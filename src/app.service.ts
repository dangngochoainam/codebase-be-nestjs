import { Injectable } from "@nestjs/common";
import { ContextLogger, LoggerService } from "./core/logger/logger.service";
import { CoreEnvironmentService } from "./core/environment/environment.service";
import { ExampleEnvironment } from "./module/environment/environment";
import { RedisCacheService } from "./core/cache/cache.service";

@Injectable()
export class AppService {
	protected logger!: ContextLogger;

	public constructor(
		protected loggerService: LoggerService,
		private readonly envService: CoreEnvironmentService<ExampleEnvironment>,
		protected readonly redisCacheService: RedisCacheService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async getHello(): Promise<string> {
		console.log(this.envService.ENVIRONMENT.INSTANCE_ID);
		// this.logger.info({ context: "context", name: "name" }, "Hello World!12321");
		this.logger.debug({ context: "context", name: "name", traceId: "traceId" }, "Hello World!12321");
		// this.logger.error({ context: "context", name: "name" }, "Hello World!12321", new Error("error"));
		// this.logger.warn({ context: "context", name: "name" }, "Hello World!12321");
		// this.logger.log({ context: "context", name: "name" }, "Hello World!12321");

		// const hset = await this.redisCacheService.hSet("hset1", { a: 12, fieldName1: "valueField1", fieldnma2: 2 });
		//
		// const hget = await this.redisCacheService.hGet("hset1", "fieldNamase1");
		//
		// const hgetall = await this.redisCacheService.hGetAll("hset1");
		//
		// const hsetWithExpire = await this.redisCacheService.hSetWithExpire("hsetWithExpire", 120, {
		// 	fieldName2: "valueField2",
		// 	fieldInce: 32,
		// });
		//
		// const hincrby = await this.redisCacheService.hIncrBy("hset1", "fieldnma2", 3);
		//
		// const hdel = await this.redisCacheService.hDel("hset1", ["a", "fieldName1"]);
		//
		// console.log({ hset, hget, hgetall, hsetWithExpire, hincrby, hdel });

		return "Hello World!12321";
	}
}
