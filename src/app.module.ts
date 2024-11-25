import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
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
	],
})
export class AppModule {}
