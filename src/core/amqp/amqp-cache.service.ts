import { Injectable } from "@nestjs/common";
import { AbstractRedisService } from "../redis/base-redis.service";

@Injectable()
export class AmqpCacheService extends AbstractRedisService<"AMQP"> {
	public readonly NAMESPACE: "AMQP" = "AMQP";

	private keyDeliveryCount(key: string) {
		return this.cacheKey(`dlvr-count-${key}`);
	}

	public async increaseDeliveryCount(msgId: string): Promise<void> {
		const key = this.keyDeliveryCount(msgId);
		await this.redisClient.incr(key);
		void this.redisClient.expire(key, 3600 * 12);
	}

	public async isValidDeliveryCount(msgId: string, max: number): Promise<boolean> {
		const current = parseInt((await this.redisClient.get(this.keyDeliveryCount(msgId))) || "0", 10);
		return current ? current - 1 <= max : true;
	}
}
