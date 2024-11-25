import { ContextLogger, LoggerService } from "../logger/logger.service";
import { Injectable, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from "@nestjs/common";
import { AmqpManagementService, IAddress, IExchange } from "./amqp-management.service";
import {
	Connection,
	ConnectionEvents,
	create_container,
	Delivery,
	EventContext,
	Message,
	Receiver,
	SenderEvents,
	Session,
	ReceiverEvents,
} from "rhea";
import { CoreEnvironmentService } from "../environment/environment.service";
import { ExampleEnvironment } from "../../module/environment/environment";
import { BehaviorSubject, concatMap, filter, fromEvent, Observable, switchMap } from "rxjs";
import { throws } from "../utils/throw";
import { AmqpCacheService } from "./amqp-cache.service";

interface ISendMessage {
	address: string;
	message: string | Buffer;
	traceId: string;
	durable: boolean;
	replyTo?: {
		address: string;
		// Id of the sender of this message
		id: string;
	};
	// Id of the expected receiver of this message
	receiverId?: string;
	session?: Session;
	closeSession?: boolean;
}

interface IMessageAnnotation {
	senderId?: string;
	receiverId?: string;
	traceId?: string;
}

export interface IMessageEvent<T> {
	msg: Message;
	parsedMessage: T;
	senderId?: string;
	receiverId?: string;
	traceId?: string;
	/**
	 * Acknowledge the message
	 */
	accept: () => void;
	addCredit: () => void;
	/**
	 * Backoff
	 */
	release: () => void;
	/**
	 * Send to DLQ
	 */
	reject: () => Promise<void>;
}

@Injectable()
export class AmqpService implements OnModuleInit, OnModuleDestroy {
	protected logger!: ContextLogger;
	private connection!: Connection;

	constructor(
		protected loggerService: LoggerService,
		public readonly envService: CoreEnvironmentService<ExampleEnvironment>,
		private mgtService: AmqpManagementService,
		private cacheService: AmqpCacheService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async onModuleInit(): Promise<void> {
		this.logger.log({}, `Init AMQP connection ${this.envService.ENVIRONMENT.MQ_HOSTNAME}`);
		this.logger.log({}, `Connecting to MQ => ${this.envService.ENVIRONMENT.MQ_HOSTNAME}`);
		const container = create_container({
			id: this.envService.ENVIRONMENT.INSTANCE_ID,
		});
		const [host, port] = this.envService.ENVIRONMENT.MQ_HOSTNAME.split(":");
		this.connection = container.connect({
			host,
			port: parseInt(port),
			username: this.envService.ENVIRONMENT.MQ_USERNAME,
			password: this.envService.ENVIRONMENT.MQ_PASSWORD,
			sessionIdContext: this.envService.ENVIRONMENT.INSTANCE_ID,
			reconnect: true,
			max_reconnect_delay: 2000,
		});

		this.connection.on(ConnectionEvents.connectionError, (e) => {
			this.logger.error(
				{},
				`Connection error to => ${this.envService.ENVIRONMENT.MQ_HOSTNAME}`,
				(e?.toJSON ? e?.toJSON() : e) as Error,
			);
		});
		this.connection.on(ConnectionEvents.protocolError, (e) => {
			this.logger.error(
				{},
				`Protocol error to => ${this.envService.ENVIRONMENT.MQ_HOSTNAME}`,
				(e?.toJSON ? e?.toJSON() : e) as Error,
			);
		});
		this.connection.on(ConnectionEvents.error, (e) => {
			this.logger.error(
				{},
				`Error to => ${this.envService.ENVIRONMENT.MQ_HOSTNAME}`,
				(e?.toJSON ? e?.toJSON() : e) as Error,
			);
		});
		this.connection.on(ConnectionEvents.disconnected, () => {
			this.logger.warn({}, `Disconnected with broker => ${this.envService.ENVIRONMENT.MQ_HOSTNAME}`);
		});
		this.connection.on(ConnectionEvents.connectionOpen, async () => {
			this.logger.log({}, `Connected with broker => ${this.envService.ENVIRONMENT.MQ_HOSTNAME}`);
		});
		await new Promise((resolve) => {
			this.connection.once(ConnectionEvents.connectionOpen, resolve);
		});
	}

	public async onModuleDestroy(): Promise<void> {
		this.connection?.close();
		await new Promise((resolve) => {
			this.connection?.on(ConnectionEvents.connectionClose, resolve);
		});
	}

	public async sendMessage(e: ISendMessage): Promise<Delivery> {
		const address = e.address[0] === "/" ? e.address : `/amq/queue/${e.address}`;
		if (!e.durable) {
			await this.mgtService.assertTemporaryQueue(address);
		}
		const msgBody = Buffer.from(e.message.toString());
		if (msgBody.byteLength / 1048576 > 5) {
			this.logger.error(
				{
					traceId: e.traceId,
				},
				`AMQP Message size larger than 5MB
			Address ${address}
			It could cause performance problem`,
				new Error(),
			);
		}
		this.logger.log(
			{
				traceId: e.traceId,
			},
			`Opening sender for address ${address}`,
		);
		const sender = this.connection.open_sender({
			target: {
				address,
				...(e.durable
					? // TODO: which this config are meaning ?
						{
							durable: 2,
							expiry_policy: "never",
						}
					: {}),
			},
		});

		await new Promise((resolve) => {
			this.logger.log(
				{
					traceId: e.traceId,
				},
				`Sender opened for address ${address}`,
			);
			sender.on(SenderEvents.senderError, (error) => {
				this.logger.error(
					{
						traceId: e.traceId,
					},
					`Sender for address ${sender.target.address} got error`,
					error as Error,
				);
			});
			sender.on(SenderEvents.senderDraining, () => {
				this.logger.warn(
					{
						traceId: e.traceId,
					},
					`Sender for address ${sender.target.address} got drained`,
				);
			});

			sender.on(SenderEvents.senderClose, () => {
				this.logger.warn(
					{
						traceId: e.traceId,
					},
					`Sender for address ${sender.target.address} got closed`,
				);
			});

			sender.once(SenderEvents.senderOpen, resolve);
		});

		if (!sender.sendable()) {
			throw new ServiceUnavailableException("Message quota exceeded. Please retry later ok");
		}

		this.logger.log(
			{
				traceId: e.traceId,
			},
			`Sending message to address ${sender.target.address}`,
		);

		try {
			const delivery = sender.send({
				body: msgBody,
				correlation_id: e.traceId,
				durable: e.durable,
				reply_to: e.replyTo?.address,
				message_annotations: <IMessageAnnotation>{
					senderId: e.replyTo?.id,
					receiverId: e.receiverId,
					traceId: e.traceId,
				},
			});

			await new Promise((resolve) => {
				sender.once(SenderEvents.accepted, resolve);
			});

			this.logger.log(
				{
					traceId: e.traceId,
				},
				`Message sent to address ${sender.target.address}`,
			);

			return delivery;
		} catch (error) {
			this.logger.error(
				{
					traceId: e.traceId,
				},
				`Fail to send message to address ${sender.target.address}`,
				error as Error,
			);
			throw error;
		} finally {
			sender.close();
			e.closeSession && e.session?.close();
		}
	}

	private async buildAddress(address: IAddress, durable: boolean, exchange?: IExchange): Promise<string> {
		if (exchange && address.name[0] === "/") {
			throw new Error("Invalid AMQP address options");
		} else if (exchange && address.name[0] !== "/") {
			return await this.mgtService.assertAMQPAddress(
				{
					...address,
					options: {
						durable,
					},
				},
				exchange,
			);
		}
		return address.name[0] === "/" ? address.name : `/amq/queue/${address.name}`;
	}

	protected async rejectDLQ(ctx: EventContext) {
		ctx.delivery?.reject();
		ctx.receiver?.add_credit(1);
	}

	public async receiveMessage<T>(options: {
		address: IAddress;
		exchange?: IExchange;
		concurrentLimit: number;
		maxRedeliverCount: number;
		backoffSeconds: number;
		durable: boolean;
	}): Promise<{
		start: () => void;
		source: Observable<IMessageEvent<T>>;
	}> {
		this.logger.log({}, `Registering address: ${JSON.stringify(options.address)}`);

		const address = await this.buildAddress(options.address, options.durable, options.exchange);

		if (!options.durable) {
			const queueName = address.split("/").pop();
			this.logger.log({}, `Asserting queue ${queueName}`);
			await this.mgtService.assertTemporaryQueue(
				queueName || throws(new Error("Failed to assert temporary queue")),
			);
			this.connection.on(ConnectionEvents.connectionOpen, async () => {
				await this.mgtService.assertTemporaryQueue(
					queueName || throws(new Error("Failed to assert temporary queue")),
				);
			});
			this.logger.log({}, `Asserting queue completed ${queueName}`);
		}

		const receiverOptions = {
			credit_window: 0,
			source: {
				address,
				...(options.durable
					? {
							durable: 2,
							expiry_policy: "never",
						}
					: {}),
			},
			autoaccept: false,
			autosettle: true,
		};

		let receiver: Receiver;
		let subject: BehaviorSubject<Receiver> | undefined;

		const createReceiver = () => {
			if (!receiver || receiver.is_closed()) {
				receiver = this.connection.open_receiver(receiverOptions);
				receiver.add_credit(options.concurrentLimit);
				if (subject) {
					subject.next(receiver);
				} else {
					subject = new BehaviorSubject(receiver);
				}
				receiver.once(ReceiverEvents.receiverClose, () => {
					// Replace receiver once close by any reason
					createReceiver();
				});
			}
			return receiver;
		};

		receiver = createReceiver();

		this.connection.on(ConnectionEvents.connectionOpen, () => {
			createReceiver();
		});

		await new Promise((resolve) => {
			receiver.once(ReceiverEvents.receiverOpen, resolve);
		});

		this.logger.info({}, `Listening to address: ${address} with ${options.concurrentLimit} credits`);

		if (!subject) {
			throw new Error("FATAL: Subject is not initialized !!!");
		}

		return {
			start() {
				receiver.add_credit(options.concurrentLimit);
			},
			source: subject.pipe(
				switchMap((r) => fromEvent<EventContext>(r, ReceiverEvents.message)),
				concatMap(async (eventCtx) => {
					const msg = eventCtx.message;
					if (!msg) return undefined;

					try {
						const body: unknown = JSON.parse(msg.body.toString());
						const { receiverId, senderId, traceId } = msg.message_annotations as IMessageAnnotation;
						this.logger.log(
							{
								traceId,
							},
							`${traceId} AMQP message received => ${JSON.stringify(msg)} ==> ${JSON.stringify(body)}`,
						);
						if (
							!msg.first_acquirer &&
							!(await this.cacheService.isValidDeliveryCount(
								msg.message_id + "",
								options.maxRedeliverCount,
							))
						) {
							this.logger.error(
								{
									traceId,
								},
								`Delivery attempt exceeded -> reject`,
								new Error("Delivery attempt exceeded"),
							);
							await this.rejectDLQ(eventCtx);
						} else {
							void this.cacheService.increaseDeliveryCount(msg.message_id + "");
							let creditPending = true;
							return {
								traceId,
								receiverId,
								senderId,
								msg,
								parsedMessage: body as T,
								accept: () => {
									eventCtx.delivery?.accept();
									return receiver;
								},
								addCredit: () => {
									creditPending && receiver.add_credit(1);
									creditPending = false;
									this.logger.log(
										{
											traceId,
										},
										"Add 1 credit",
									);
								},
								release: () => {
									this.logger.log(
										{
											traceId,
										},
										"Releasing message",
									);
									setTimeout(async () => {
										eventCtx.delivery?.release({
											delivery_failed: true,
										});
										receiver.add_credit(1);
									}, 1 * 1000);
								},
								reject: () => {
									return this.rejectDLQ(eventCtx);
								},
							};
						}
					} catch (e) {
						eventCtx.delivery?.reject();
						receiver.add_credit(1);
						this.logger.error({}, "Failed to process AMQP message", e as Error);
					}
					return undefined;
				}),
				filter<IMessageEvent<T> | undefined, IMessageEvent<T>>((v): v is IMessageEvent<T> => !!v),
			),
		};
	}
}
