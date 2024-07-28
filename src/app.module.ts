import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CoreEnvironmentService } from "./core/environment/environment.service";
import { CoreEnvironmentModule } from "./core/environment/evironment.module";
import { LoggerModule } from "./core/logger/logger.module";
import { LogDbModule } from "./db-log/db.module";
import { ExampleEnvironment } from "./module/environment/environment";

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
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
