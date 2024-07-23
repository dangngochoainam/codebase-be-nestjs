import { Injectable, InternalServerErrorException } from "@nestjs/common";
import Pino from "pino";
import { BaseSqlLoggerService } from "./sql-logger.service";

export interface ICustomLogging {
	traceId?: string;
	context?: string;
	name?: string;
}

function customReplacer(value: any) {
	try {
		return Object.getOwnPropertyNames(value).reduce((acc, key) => {
			return {
				...acc,
				[key]: value[key],
			};
		}, {});
	} catch (e) {
		return {
			value,
			e,
		};
	}
}

export class ContextLogger {
	constructor(
		private loggerService: LoggerService,
		private context: string,
	) {}

	public log(customLogging: ICustomLogging, message: string | unknown): void {
		return this.info(customLogging, message);
	}

	public info(customLogging: ICustomLogging, message: string | unknown): void {
		if (typeof message === "string") {
			this.loggerService.pino.trace(
				{
					traceId: customLogging.traceId,
					context: customLogging.context || this.context,
					parentContext: this.context,
				},
				message,
			);
		} else {
			this.loggerService.pino.trace({
				...customLogging,
				message,
			});
		}
	}

	public error(customLogging: ICustomLogging, message: string | unknown, error: Error | undefined) {
		this.loggerService.pino.error(
			{
				traceId: customLogging.traceId,
				context: customLogging.context || this.context,
				parentContext: this.context,
				error: customReplacer(error) || new InternalServerErrorException("Unexpected Error"),
			},
			`${message} __ Error ${JSON.stringify(customReplacer(error)) || new InternalServerErrorException("Unexpected Error")}`,
		);
	}

	public debug(customLogging: ICustomLogging, message: string | unknown, error?: Error): void {
		// TODO: find the way to read environment variable
		// if (CoreEnvironmentProvider.useValue.ENVIRONMENT.LOG_DEBUG_MODE) {
		// 	if (typeof message === "string") {
		// 		this.loggerService.pino.debug(
		// 			{
		// 				traceId: customLogging.traceId,
		// 				context: customLogging.context || this.context,
		// 				parentContext: this.context,
		// 			},
		// 			message,
		// 		);
		// 	} else {
		// 		this.loggerService.pino.debug({
		// 			traceId: customLogging.traceId,
		// 			context: customLogging.context || this.context,
		// 			parentContext: this.context,
		// 			message,
		// 		});
		// 	}
		// }
		const sqlLog = this.loggerService.sqlLoggerService.debug(
			{ name: this.loggerService.name, ...customLogging },
			message,
		);
		this.loggerService.pino.debug(
			{
				traceId: customLogging.traceId,
				context: customLogging.context || this.context,
				parentContext: this.context,
			},
			`[[[Debug content storing in db with id: ${sqlLog.id}]]]`,
		);
		if (error) {
			this.loggerService.pino.error({
				...customLogging,
				error: customReplacer(error) || new InternalServerErrorException("Unexpected Error"),
			});
		}
	}

	public warn(customLogging: ICustomLogging, message: string): void {
		this.loggerService.pino.warn(
			{
				traceId: customLogging.traceId,
				context: customLogging.context || this.context,
				parentContext: this.context,
			},
			message,
		);
	}
}

let instance: LoggerService;
@Injectable()
export class LoggerService {
	public pino!: Pino.Logger;

	private setupPino(name: string) {
		this.pino = Pino({
			name,
			safe: true,
			level: "trace",
			transport: {
				target: "pino-pretty",
			},
		});
	}

	public static getInstance(sqlLoggerService: BaseSqlLoggerService, name: string): LoggerService {
		if (instance) {
			return instance.setName(name);
		}
		instance = new LoggerService(sqlLoggerService, name);
		return instance;
	}

	// TODO: define type for loggerService
	public constructor(
		public sqlLoggerService: BaseSqlLoggerService,
		public name: string = "Unset",
	) {
		this.setupPino(name);
	}

	protected setName(name: string): this {
		this.name = name;
		this.setupPino(name);
		return this;
	}

	public newContextLogger(context: string): ContextLogger {
		return new ContextLogger(this, context);
	}
}
