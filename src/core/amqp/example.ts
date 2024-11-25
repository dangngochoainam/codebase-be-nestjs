import { plainToClassFromExist } from "class-transformer";
import { randomUUID } from "crypto";
import { from, Observable, share } from "rxjs";
import { AmqpService, IMessageEvent } from "./amqp.service";
import { ContextLogger } from "../logger/logger.service";
import { IAddress, IExchange } from "./amqp-management.service";
import { throws } from "../utils/throw";
import { Receiver } from "rhea";

export class MessagingConfig {
	public maxConcurrency!: number;
	public backoffSeconds!: number;
	public maxRetry!: number;

	public constructor(o: MessagingConfig) {
		plainToClassFromExist(this, o);
	}
}

export abstract class RootMsg<M, Payload> {
	public static type: unknown;

	public static is<T extends RootMsg<any, any>>(this: { type: T["type"] }, msg: RootMsg<any, any>): msg is T {
		return msg.type === this.type;
	}

	public abstract readonly type: M;
	public abstract body: Payload;

	public abstract get address(): string;

	public abstract readonly replyClass: (new (...args: never[]) => unknown) | null;
}

export type MessageReplyType<T extends RootMsg<any, any>> =
	T["replyClass"] extends ConstructorFunction<infer R> ? R : never;

export type IMessageRouting = { fanout: string; topic?: never } | { topic: string; fanout?: never } | null;

export abstract class AbstractMessaging<ENQ_MSG extends RootMsg<unknown, unknown>> {
	public abstract readonly $CorrelationIDSignature: string;

	protected abstract readonly amqpService: AmqpService;

	protected abstract readonly messagingConfig: MessagingConfig;

	protected abstract logger: ContextLogger;

	protected abstract eagerAcceptMessage: boolean;

	/**
	 * Specify which partition this workflow will process on
	 * @protected
	 */
	public abstract readonly ROUTING: IMessageRouting;

	protected abstract get _address(): string;

	protected get LISTEN_TO_ADDRESS(): {
		address: IAddress;
		exchange?: IExchange;
	} {
		const address = `${this._address}`;
		return this.ROUTING
			? {
					exchange: {
						name: address,
						fanout: !!this.ROUTING.fanout,
					},
					address: {
						name: ((this.ROUTING.fanout || this.ROUTING.topic) as string) + this.workflowVariant,
					},
				}
			: {
					address: {
						name: address,
					},
				};
	}

	public getPublishAddress(address: string = this._address, global: boolean): string {
		if (global) {
			return `/exchange/${address}/*`;
		} else if (this.ROUTING) {
			const partition = this.ROUTING;
			return partition?.fanout
				? `/exchange/${address}/*`
				: partition?.topic
					? `/exchange/${address}/${partition.topic}`
					: throws(new Error("FATAL error invalid address"));
		} else {
			return `/amq/queue/${address}`;
		}
	}

	protected source?: Observable<IMessageEvent<ENQ_MSG>>;

	protected durable: boolean = true;

	protected async listen() {
		const { start, source } = await this.amqpService.receiveMessage<ENQ_MSG>({
			durable: this.durable,
			...this.LISTEN_TO_ADDRESS,
			backoffSeconds: this.messagingConfig.backoffSeconds,
			concurrentLimit: this.messagingConfig.maxConcurrency,
			maxRedeliverCount: this.messagingConfig.maxRetry || throws(new Error("Missing max retry config")),
		});
		this.source = from(source).pipe(share<IMessageEvent<ENQ_MSG>>());
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

	/**
	 * Enqueue message to this workflow
	 * @param msg this workflow message type
	 * @param options
	 * @param global enqueue to exchange or to partition
	 */
	protected async enqueue<T extends this>(
		msg: ENQ_MSG,
		options: {
			address?: string;
			correlationID: T["$CorrelationIDSignature"];
			receiver?: Receiver;
			replyTo?: {
				address: string;
				id: string;
			};
		},
		global: boolean = false,
	): Promise<void> {
		const { receiver } = options;
		const address = `${options.address}${this.workflowVariant}`;
		await this.amqpService.sendMessage({
			message: JSON.stringify(msg),
			address: this.getPublishAddress(address, global),
			traceId: options.correlationID,
			durable: true,
			replyTo:
				options.replyTo ||
				(receiver
					? {
							address: receiver.source.address,
							id: randomUUID(),
						}
					: undefined),
			session: options.receiver?.session,
			closeSession: !options.receiver?.session,
		});
	}

	private async reply(msgEvent: IMessageEvent<ENQ_MSG>, replyData: MessageReplyType<ENQ_MSG> | null): Promise<void> {
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

	protected abstract onMessage(msgEvent: IMessageEvent<ENQ_MSG>): Promise<MessageReplyType<ENQ_MSG> | null>;

	protected get workflowVariant() {
		return this.amqpService.envService.ENVIRONMENT.WORKFLOW_VARIANT
			? `-${this.amqpService.envService.ENVIRONMENT.WORKFLOW_VARIANT}`
			: "";
	}
}
