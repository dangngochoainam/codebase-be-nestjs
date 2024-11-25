import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { RabbitMQService } from "./module/rabbitmq-test/rabbitmq.service";

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private rabbitmq: RabbitMQService,
	) {}

	@Get()
	public async getHello(): Promise<string> {
		return this.appService.getHello();
	}

	@Get("test-send-rabbitmq")
	public async testSendRabbitmq(): Promise<string> {
		return this.rabbitmq.sendMessage();
	}
}
