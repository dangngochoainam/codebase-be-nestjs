import { Injectable } from "@nestjs/common";
import { CoreEnvironmentService } from "src/core/environment/environment.service";
import { BaseResponseInterceptor } from "src/core/interceptor/response.interceptor";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";
import { ExampleEnvironment } from "../environment/environment";

@Injectable()
export class ExampleResponseInterceptor<T> extends BaseResponseInterceptor<T, SYSTEM_CODE> {
	protected logger: ContextLogger;
	public constructor(
		protected readonly loggerService: LoggerService,
		protected readonly envService: CoreEnvironmentService<ExampleEnvironment>,
	) {
		super(loggerService, envService);
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}
}