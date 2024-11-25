import { Module } from "@nestjs/common";
import { AmqpManagementService } from "./amqp-management.service";
import { AmqpService } from "./amqp.service";

@Module({
	imports: [],
	providers: [AmqpManagementService, AmqpService],
	exports: [AmqpService],
})
export class AmqpModule {}
