import { Controller, Get } from "@nestjs/common";
import { FetchTestService } from "./fetch-test.service";

@Controller()
export class FetchTestController {
	public constructor(private readonly fetchTestService: FetchTestService) {}

	@Get("fetch-test/call-raw")
	public async callRawTest(): Promise<any> {
		return this.fetchTestService.callRawTest();
	}
}
