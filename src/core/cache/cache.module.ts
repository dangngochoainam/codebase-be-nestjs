import { Module } from "@nestjs/common";
import { RedisCacheService } from "./cache.service";

@Module({
	providers: [RedisCacheService],
	exports: [RedisCacheService],
})
export class RedisCacheModule {}
