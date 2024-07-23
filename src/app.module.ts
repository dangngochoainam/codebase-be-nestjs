import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { LogDbModule } from "./db-log/db.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerModule } from "./core/logger/logger.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		LogDbModule.create({
			useFactory: (configService: ConfigService) => {
				return {
					host: "localhost",
					port: 5433,
					database: "codebase",
					schema: "log",
					username: "postgres",
					password: "postgres",
				};
			},
			inject: [ConfigService],
		}),
		LoggerModule.factory("AppService"),
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
