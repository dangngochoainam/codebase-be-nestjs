import { Inject, Injectable } from "@nestjs/common";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { REGISTER_OPTION_TOKEN, RegisterOption } from "./constants/constants";

@Injectable()
export class TestDynamicService {
	protected logger!: ContextLogger;

	constructor(
		protected readonly loggerService: LoggerService,
		@Inject(REGISTER_OPTION_TOKEN) private readonly registerOption: RegisterOption,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async register(): Promise<string> {
		return this.registerOption.description;
	}
}
