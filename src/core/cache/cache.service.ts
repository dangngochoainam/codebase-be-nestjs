import { Injectable } from "@nestjs/common";
import { AbstractRedisService } from "../redis/base-redis.service";

@Injectable()
export class RedisCacheService extends AbstractRedisService<"REDIS-CACHE"> {
	public readonly NAMESPACE = "REDIS-CACHE";
}
