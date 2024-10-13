import { Controller, Get } from "@nestjs/common";
import { TestDynamicService } from "../dynamic.service";

@Controller()
export class TestDynamicRegisterController {
	constructor(private readonly testDynamicService: TestDynamicService) {}

	@Get("test/register-dynamic-module-b")
	public async register(): Promise<string> {
		return this.testDynamicService.register();
	}
}
