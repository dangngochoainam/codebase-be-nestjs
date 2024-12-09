import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthGatewayModule } from "./core/auth-gateway/auth-gateway.module";
import { RedisCacheModule } from "./core/cache/cache.module";
import { CryptoModule } from "./core/crypto/crypto.module";
import { CoreEnvironmentService } from "./core/environment/environment.service";
import { CoreEnvironmentModule } from "./core/environment/evironment.module";
import { DBLogger } from "./core/logger/db-logger";
import { LoggerModule, SQL_LOGGER_PROVIDER } from "./core/logger/logger.module";
import { PermissionInterceptor } from "./core/permission/permission.interceptor";
import { typeOrmOptions as exampleTypeOrmOptions } from "./db-example/typeorm.module";
import { LogDbModule } from "./db-log/db.module";
import { SqlLoggerService } from "./db-log/module/sql-logger/sql-logger.service";
import { AuthModule } from "./module/auth/auth.module";
import { ExampleEnvironment } from "./module/environment/environment";
import { ExampleResponseInterceptor } from "./module/interceptor/response.interceptor";
import { UserModule } from "./module/user/user.module";
import { SignContractModule } from "./module/sign-contract/sign-contract.module";
import { TestDynamicModule } from "./module/dynamic-module/dynamic.module";
import { TestDynamicRegisterModule } from "./module/dynamic-module/test-dynamic-module-register/test-dynamic-module-register.module";
import { FetchTestModule } from "./module/fetch-test/fetch-test.module";
import { AmqpModule } from "./core/amqp/amqp.module";
import { RabbitMQModule } from "./module/rabbitmq-test/rabbitmq.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { Redis } from "ioredis";
import { readFileSync } from "fs";
import { StreamTestModule } from "./module/stream-test/stream-test.module";

@Module({
	imports: [
		LogDbModule.create({
			useFactory: (env: CoreEnvironmentService<ExampleEnvironment>) => {
				return {
					host: env.ENVIRONMENT.DB_LOG_HOST,
					port: env.ENVIRONMENT.DB_LOG_PORT,
					database: env.ENVIRONMENT.DB_LOG_DATABASE,
					schema: env.ENVIRONMENT.DB_LOG_SCHEMA,
					username: env.ENVIRONMENT.DB_LOG_USERNAME,
					password: env.ENVIRONMENT.DB_LOG_PASSWORD,
				};
			},
			inject: [CoreEnvironmentService],
		}),
		LoggerModule.factory("Example__Service"),
		CoreEnvironmentModule.create(ExampleEnvironment),
		TypeOrmModule.forRootAsync({
			name: exampleTypeOrmOptions.name,
			inject: [CoreEnvironmentService, SQL_LOGGER_PROVIDER],
			useFactory: (env: CoreEnvironmentService<ExampleEnvironment>, sqlLoggerService: SqlLoggerService) =>
				({
					host: env.ENVIRONMENT.DB_EXAMPLE_HOST,
					port: env.ENVIRONMENT.DB_EXAMPLE_PORT,
					schema: env.ENVIRONMENT.DB_EXAMPLE_SCHEMA,
					database: env.ENVIRONMENT.DB_EXAMPLE_DATABASE,
					username: env.ENVIRONMENT.DB_EXAMPLE_USERNAME,
					password: env.ENVIRONMENT.DB_EXAMPLE_PASSWORD,
					...exampleTypeOrmOptions,
					logger: new DBLogger(sqlLoggerService, "Example__Service__DB", exampleTypeOrmOptions.name || ""),
					cache: {
						type: "ioredis",
						options: {
							host: env.ENVIRONMENT.REDIS_HOST,
							port: env.ENVIRONMENT.REDIS_PORT,
							password: env.ENVIRONMENT.REDIS_PASSWORD,
						},
					},
				}) as TypeOrmModuleOptions,
		}),
		UserModule,
		RedisCacheModule,
		AuthGatewayModule,
		CryptoModule,
		AuthModule,
		SignContractModule,
		TestDynamicModule.register({ description: "import test dynamic module register at App" }),
		TestDynamicRegisterModule,
		FetchTestModule,
		AmqpModule,
		RabbitMQModule,
		StreamTestModule,
		ThrottlerModule.forRootAsync({
			useFactory: (env: CoreEnvironmentService<ExampleEnvironment>) => {
				return {
					throttlers: [
						{
							ttl: env.ENVIRONMENT.THROTTLE_TTL,
							limit: env.ENVIRONMENT.THROTTLE_LIMIT,
						},
					],
					storage: new ThrottlerStorageRedisService(
						new Redis({
							host: env.ENVIRONMENT.REDIS_HOST,
							port: env.ENVIRONMENT.REDIS_PORT,
							connectTimeout: env.ENVIRONMENT.REDIS_TIMEOUT,
							commandTimeout: env.ENVIRONMENT.REDIS_TIMEOUT,
							username: env.ENVIRONMENT.REDIS_USERNAME,
							password: env.ENVIRONMENT.REDIS_PASSWORD,
							...(env.ENVIRONMENT.REDIS_SSL_ENABLED
								? {
										tls: {
											ca: readFileSync(env.ENVIRONMENT.REDIS_SSL_CA_CERT_PATH),
											cert: readFileSync(env.ENVIRONMENT.REDIS_SSL_CERT_PATH),
											key: readFileSync(env.ENVIRONMENT.REDIS_SSL_KEY_PATH),
											rejectUnauthorized: env.ENVIRONMENT.REDIS_SSL_REJECT_UNAUTHORIZED,
										},
									}
								: {}),
							// slotsRefreshTimeout: envService.ENVIRONMENT.REDIS_SLOTS_REFRESH_TIMEOUT,
							// slotsRefreshInterval: envService.ENVIRONMENT.REDIS_SLOTS_REFRESH_INTERVAL,
							showFriendlyErrorStack: true,
						}),
					),
				};
			},
			inject: [CoreEnvironmentService],
		}),
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_INTERCEPTOR,
			useClass: PermissionInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: ExampleResponseInterceptor,
		},
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
