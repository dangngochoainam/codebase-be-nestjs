import { Module } from "@nestjs/common";
import { AmqpManagementService } from "./amqp-management.service";
import { AmqpService } from "./amqp.service";
import { AmqpCacheService } from "./amqp-cache.service";

@Module({
	imports: [],
	providers: [AmqpManagementService, AmqpService, AmqpCacheService],
	exports: [AmqpService],
})
export class AmqpModule {}
