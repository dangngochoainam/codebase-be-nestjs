import { Injectable, OnModuleInit } from "@nestjs/common";
import { ContextLogger, LoggerService } from "../../core/logger/logger.service";
import { AmqpService, IMessageEvent } from "../../core/amqp/amqp.service";
import { throws } from "../../core/utils/throw";
import { from, Observable, share } from "rxjs";

@Injectable()
export class RabbitMQService implements OnModuleInit {
	protected logger!: ContextLogger;
	protected source?: Observable<IMessageEvent<any>>;
	private eagerAcceptMessage: boolean = true;

	public constructor(
		protected readonly loggerService: LoggerService,
		private amqpService: AmqpService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async onModuleInit() {
		const { start, source } = await this.amqpService.receiveMessage<any>({
			durable: false,
			address: {
				name: "test",
			},
			backoffSeconds: 10000,
			concurrentLimit: 10,
			maxRedeliverCount: 5 || throws(new Error("Missing max retry config")),
		});
		this.source = from(source).pipe(share<IMessageEvent<any>>());
		void this.source.forEach(async (msg) => {
			try {
				this.logger.log(
					{
						traceId: msg.traceId,
					},
					`AMQP_MESSAGE_RECEIVED`,
				);
				if (this.eagerAcceptMessage) {
					msg.accept();
				}
				const reply = await this.onMessage(msg);
				if (this.eagerAcceptMessage) {
					msg.addCredit();
				} else {
					msg.accept();
					msg.addCredit();
				}
				if (reply) {
					await this.reply(msg, reply);
				}
			} catch (e) {
				this.logger.error(
					{
						traceId: msg.traceId,
					},
					`AMQP_MESSAGE_PROCESS_ERROR`,
					e as Error,
				);
				msg.release();
			}
		});
		start();
	}

	protected async onMessage(msgEvent: IMessageEvent<any>): Promise<null> {
		this.logger.log(
			{
				traceId: msgEvent.traceId,
			},
			// `Received sys notify message: ${msgEvent.parsedMessage.type} and workflowId ${msgEvent.parsedMessage.body.workflowId}`,
			`Received sys notify message: {msgEvent.parsedMessage.type} and workflowId {msgEvent.parsedMessage.body.workflowId}`,

		);
		return null;
	}

	private async reply(msgEvent: IMessageEvent<any>, replyData: any | null): Promise<void> {
		const { reply_to, correlation_id } = msgEvent.msg;
		if (reply_to && !correlation_id) {
			throw new Error(
				`Message ${msgEvent.msg.message_id} for ${this.constructor.name} has reply_to but missing correlation_id`,
			);
		}
		if (reply_to && correlation_id) {
			this.logger.log(
				{
					traceId: correlation_id.toString(),
				},
				`REPLY_TO ${reply_to}`,
			);
			replyData &&
				(await this.amqpService.sendMessage({
					address: reply_to,
					durable: false,
					traceId: correlation_id.toString(),
					message: JSON.stringify(replyData),
					receiverId: msgEvent.senderId,
				}));
		}
	}

	public async sendMessage(): Promise<string> {
		await this.amqpService.sendMessage({
			address: "test",
			message: JSON.stringify({ content: "Hello World!" }),
			traceId: "123tuhlkjfdnasdiu3yr",
			durable: false,
		});
		return "Ok";
	}
}
