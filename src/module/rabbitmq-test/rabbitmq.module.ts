import { Module } from "@nestjs/common";
import { RabbitMQService } from "./rabbitmq.service";
import { AmqpModule } from "../../core/amqp/amqp.module";

@Module({
	imports: [AmqpModule],
	providers: [RabbitMQService],
	exports: [RabbitMQService],
})
export class RabbitMQModule {}
