import { Injectable } from "@nestjs/common";
import { ContextLogger, LoggerService } from "../../core/logger/logger.service";
import { StreamService } from "../stream/stream.service";

@Injectable()
export class StreamTestService {
	protected readonly logger!: ContextLogger;

	public constructor(
		protected loggerService: LoggerService,
		private readonly streamService: StreamService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async streamDataFromDb(): Promise<string> {
		const query = `select * from example.engineer;`;
		await this.streamService.handleDataStream<any>(query, async (countries: any) => {
			console.log(JSON.stringify(countries));
		});
		return "Ok";
	}
}
