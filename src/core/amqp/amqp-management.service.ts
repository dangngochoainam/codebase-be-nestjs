import { ContextLogger, LoggerService } from "../logger/logger.service";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Channel, connect, Connection, Options } from "amqplib";
import { ExampleEnvironment } from "../../module/environment/environment";
import { CoreEnvironmentService } from "../environment/environment.service";
import { delay } from "../../shared/utils/delay";

export enum QUEUE_ATTRIBUTE_KEY {
	QUEUE_TYPE = "x-queue-type",
	QUEUE_VERSION = "x-queue-version",
}

export interface IExchange {
	name: string;
	fanout: boolean;
	options?: Options.AssertExchange;
}

export interface IAddress {
	name: string;
	options?: Options.AssertQueue;
}

export const TEMPORARY_QUEUE_LIFETIME = 60 * 60 * 24;

@Injectable()
export class AmqpManagementService implements OnModuleInit, OnModuleDestroy {
	protected logger!: ContextLogger;
	private connection!: Connection;
	public channel!: Channel;

	constructor(
		protected readonly loggerService: LoggerService,
		private envService: CoreEnvironmentService<ExampleEnvironment>,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async onModuleInit() {
		const { MQ_HOSTNAME } = this.envService.ENVIRONMENT;
		const host: Options.Connect = {
			protocol: "amqp",
			hostname: MQ_HOSTNAME.split(":")[0],
			port: parseInt(MQ_HOSTNAME.split(":")[1]),
			username: this.envService.ENVIRONMENT.MQ_USERNAME,
			password: this.envService.ENVIRONMENT.MQ_PASSWORD,
		};
		await this.connect(host);
	}

	public async onModuleDestroy() {
		this.connection && (await this.connection.close());
	}

	private async handleNewConnection(connection: Connection) {
		this.connection = connection;
		this.channel = await this.connection.createChannel();
		this.connection.on("error", (e) => {
			this.logger.error({}, "Connection Error", e);
		});
	}

	private handleDisconnect(host: Options.Connect) {
		this.connection.on("close", async () => {
			this.logger.warn({}, "AMQP disconnected");
			let connected = false;
			while (!connected) {
				try {
					this.logger.log({}, "Retry connection");
					await this.connect(host);
					connected = true;
				} catch (e) {
					await delay(3000);
				}
			}
		});
	}

	private async connect(host: Options.Connect) {
		const connection = await connect(host);
		this.logger.log({}, `Connected ${this.envService.ENVIRONMENT.MQ_HOSTNAME}`);
		await this.handleNewConnection(connection);
		this.handleDisconnect(host);
	}

	public async assertTemporaryQueue(queue: string, expireSeconds: number = TEMPORARY_QUEUE_LIFETIME) {
		const res = await this.channel.assertQueue(queue, {
			durable: false,
			autoDelete: true,
			expires: expireSeconds * 1000,
			arguments: {
				[QUEUE_ATTRIBUTE_KEY.QUEUE_VERSION]: 2,
			},
		});
		return res.queue;
	}

	public async assertAMQPAddress(address: IAddress, exchange: IExchange): Promise<string> {
		const { name, options } = exchange;
		this.logger.log({}, `Asserting exchange ${name} with options ${JSON.stringify(options)}`);
		const ex = await this.channel.assertExchange(name, "topic", options);
		const queueName = `${exchange.name}_${address.name}`;
		const addressOptions: Options.AssertQueue = {
			...address.options,
			// ...(this.envService.ENVIRONMENT.USE_MODERN_QUEUE_TYPE ? {
			// 	arguments: {
			// 		[QUEUE_ATTRIBUTE_KEY.QUEUE_TYPE]: QUEUE_TYPE.QUORUM,
			// 	}
			// } : {}
			// )
		};
		const queue = await this.channel.assertQueue(queueName, addressOptions);
		await this.channel.bindQueue(queue.queue, ex.exchange, exchange.fanout ? "#" : address.name);
		// Backhand management has bound this queue to corresponding exchange
		return `/amq/queue/${queueName}`;
	}
}
