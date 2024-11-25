import { Injectable, OnModuleInit } from "@nestjs/common";
import { AbstractMessaging, MessagingConfig } from "./example";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { AmqpService, IMessageEvent } from "./amqp.service";
import { ExampleEnvironment } from "../../module/environment/environment";
import { CoreEnvironmentService } from "../environment/environment.service";

/**
 * One per service instance
 */
@Injectable()
export class UseExample extends AbstractMessaging<any> implements OnModuleInit {
	public readonly $CorrelationIDSignature!: string;

	/**
	 * This address accept reporting message
	 * @protected
	 */
	protected get _address(): string {
		return `SYS-WF-REP-${this.envService.ENVIRONMENT.INSTANCE_ID}`;
	}

	protected readonly durable = false;

	ROUTING = null;

	protected logger!: ContextLogger;

	protected messagingConfig = new MessagingConfig({
		backoffSeconds: this.envService.ENVIRONMENT.SYNC_SIGNAL_BACKOFF_SECONDS,
		maxRetry: this.envService.ENVIRONMENT.SYNC_SIGNAL_MAX_RETRY,
		maxConcurrency: this.envService.ENVIRONMENT.SYNC_SIGNAL_MAX_CONCURRENCY,
	});

	protected eagerAcceptMessage = true;

	protected async onMessage(msgEvent: IMessageEvent<any>): Promise<null> {
		this.logger.log(
			{
				traceId: msgEvent.traceId,
			},
			`Received sys notify message: {msgEvent.parsedMessage.type} and workflowId {msgEvent.parsedMessage.body.workflowId}`,
		);
		return null;
	}

	constructor(
		protected amqpService: AmqpService,
		protected envService: CoreEnvironmentService<ExampleEnvironment>,
		protected loggerService: LoggerService,
	) {
		super();
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	async onModuleInit() {
		await this.listen();
	}
}
