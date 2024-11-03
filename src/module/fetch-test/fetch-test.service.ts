import { Injectable } from "@nestjs/common";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { FetchService } from "src/fetch/fetch.service";
import { GetProfileDTO } from "src/shared/dto/user/get-profile.dto";

@Injectable()
export class FetchTestService {
	protected logger!: ContextLogger;

	public constructor(
		protected readonly loggerService: LoggerService,
		private readonly fetchService: FetchService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async callRawTest(): Promise<any> {
		const response = await this.fetchService.callRaw(new GetProfileDTO({ id: "b0ce42dc-21a7-4ba1-8193-ab046c0380f1" }));
		this.logger.info({}, "ajdskfsa");
		return response;
	}
}
