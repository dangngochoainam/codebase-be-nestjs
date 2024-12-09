import { Controller, Get } from "@nestjs/common";
import { StreamTestService } from "./stream-test.service";

@Controller()
export class StreamTestController {
	public constructor(private readonly streamTestService: StreamTestService) {}

	@Get("stream")
	public async streamDataFromDb(): Promise<string> {
		return this.streamTestService.streamDataFromDb();
	}
}
