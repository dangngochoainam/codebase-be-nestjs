import { Injectable, OnModuleInit } from "@nestjs/common";
import { readFileSync } from "fs";
import { Redis } from "ioredis";
import { ExampleEnvironment } from "src/module/environment/environment";
import { CoreEnvironmentService } from "../environment/environment.service";
import { ContextLogger, LoggerService } from "../logger/logger.service";

@Injectable()
class BaseRedis implements OnModuleInit {
	protected logger!: ContextLogger;
	public readonly redisClient: Redis;
	public constructor(
		protected envService: CoreEnvironmentService<ExampleEnvironment>,
		protected loggerService: LoggerService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
		this.redisClient = new Redis({
			host: this.envService.ENVIRONMENT.REDIS_HOST,
			port: this.envService.ENVIRONMENT.REDIS_PORT,
			connectTimeout: this.envService.ENVIRONMENT.REDIS_TIMEOUT,
			commandTimeout: this.envService.ENVIRONMENT.REDIS_TIMEOUT,
			username: this.envService.ENVIRONMENT.REDIS_USERNAME,
			password: this.envService.ENVIRONMENT.REDIS_PASSWORD,
			...(this.envService.ENVIRONMENT.REDIS_SSL_ENABLED
				? {
						tls: {
							ca: readFileSync(this.envService.ENVIRONMENT.REDIS_SSL_CA_CERT_PATH),
							cert: readFileSync(this.envService.ENVIRONMENT.REDIS_SSL_CERT_PATH),
							key: readFileSync(this.envService.ENVIRONMENT.REDIS_SSL_KEY_PATH),
							rejectUnauthorized: this.envService.ENVIRONMENT.REDIS_SSL_REJECT_UNAUTHORIZED,
						},
					}
				: {}),
			// slotsRefreshTimeout: envService.ENVIRONMENT.REDIS_SLOTS_REFRESH_TIMEOUT,
			// slotsRefreshInterval: envService.ENVIRONMENT.REDIS_SLOTS_REFRESH_INTERVAL,
			showFriendlyErrorStack: true,
		});
	}
	public async onModuleInit() {
		if (!this.envService.ENVIRONMENT.LOG_DEBUG_MODE) {
			return;
		}
		this.redisClient.monitor((err?: Error | null, monitor?: Redis) => {
			if (err) {
				this.logger.error({}, err, err);
			}
			this.logger.info({}, "Entering monitoring mode...");
			monitor &&
				monitor.on("monitor", (_time, args, _source) => {
					this.logger.info({}, `Command: ${args.join(" ")}`);
				});
			return this.redisClient;
		});
	}
}

export abstract class AbstractRedisService<NS> extends BaseRedis {
	protected abstract readonly NAMESPACE: NS;

	public async del(key: string): Promise<number> {
		return this.redisClient.del(this.cacheKey(key));
	}

	public async exists(key: string[]): Promise<number> {
		return this.redisClient.exists(key);
	}

	public async set(key: string, value: string): Promise<boolean> {
		const nsKey = this.cacheKey(key);
		const res = await this.redisClient.set(nsKey, value);
		return res == "OK";
	}

	public async setEX(key: string, expireInSeconds: number, value: string): Promise<boolean> {
		const nsKey = this.cacheKey(key);
		const res = await this.redisClient.setex(nsKey, expireInSeconds, value);
		return res == "OK";
	}

	public async setNX(key: string, value: string): Promise<boolean> {
		const nsKey = this.cacheKey(key);
		const res = await this.redisClient.setnx(nsKey, value);
		return res != 0;
	}

	public async get(key: string): Promise<string | null> {
		return this.redisClient.get(this.cacheKey(key));
	}

	public async incr(key: string): Promise<number> {
		return this.redisClient.incr(key);
	}

	public async setAdd(setName: string, members: string[]): Promise<number> {
		const name = this.cacheKey(setName);
		this.logger.debug({}, `Adding to redis set ${name} value ${members}`);
		return this.redisClient.sadd(name, members);
	}

	public async setRemove(setName: string, members: string[]): Promise<number> {
		const name = this.cacheKey(setName);
		return this.redisClient.srem(name, members);
	}

	public async setGet(setName: string): Promise<string[]> {
		const name = this.cacheKey(setName);
		return this.redisClient.smembers(name);
	}

	public async hSet(hashName: string, field: object): Promise<number> {
		const name = this.cacheKey(hashName);
		return this.redisClient.hset(name, field);
	}

	public async hGet(hashName: string, fieldName: string): Promise<string | null> {
		const name = this.cacheKey(hashName);
		return this.redisClient.hget(name, fieldName);
	}

	public async hGetAll(hashName: string): Promise<Record<string, string>> {
		const name = this.cacheKey(hashName);
		return this.redisClient.hgetall(name);
	}

	public async hSetWithExpire(
		hashName: string,
		expireInSeconds: number,
		field: object,
	): Promise<[error: Error | null, result: unknown][] | null> {
		const name = this.cacheKey(hashName);
		return this.redisClient.multi().hset(name, field).expire(name, expireInSeconds).exec();
	}

	public async hIncrBy(hashName: string, fieldName: string, increment: number): Promise<number> {
		const name = this.cacheKey(hashName);
		return this.redisClient.hincrby(name, fieldName, increment);
	}

	public async hDel(hashName: string, fieldNames: string[]): Promise<number> {
		const name = this.cacheKey(hashName);
		return this.redisClient.hdel(name, ...fieldNames);
	}

	public cacheKey(key: string | number): string {
		return `${this.nsKey()}:${key}`;
	}

	protected nsKey(): string {
		return `${this.NAMESPACE}`;
	}
}