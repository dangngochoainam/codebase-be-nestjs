import { Injectable } from "@nestjs/common";
import { ContextLogger, LoggerService } from "./core/logger/logger.service";

@Injectable()
export class AppService {
	protected logger!: ContextLogger;

	public constructor(protected loggerService: LoggerService) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}
	public getHello(): string {
		console.log(123);
		// this.logger.info({ context: "context", name: "name" }, "Hello World!12321");
		this.logger.debug({ context: "context", name: "name", traceId: "traceId" }, "Hello World!12321");
		// this.logger.error({ context: "context", name: "name" }, "Hello World!12321", new Error("error"));
		// this.logger.warn({ context: "context", name: "name" }, "Hello World!12321");
		// this.logger.log({ context: "context", name: "name" }, "Hello World!12321");
		return "Hello World!12321";
	}
}
