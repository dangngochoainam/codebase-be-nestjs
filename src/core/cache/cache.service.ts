import { Injectable } from "@nestjs/common";
import { AbstractRedisService } from "../redis/base-redis.service";

@Injectable()
export class RedisCacheService extends AbstractRedisService<"REDIS_CACHE"> {
	public readonly NAMESPACE = "REDIS_CACHE";
}
