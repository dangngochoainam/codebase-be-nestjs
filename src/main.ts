import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SqlLogger } from "./core/logger/logger";
import { SQL_LOGGER_PROVIDER } from "./core/logger/logger.module";
import { CoreEnvironmentProvider } from "./core/environment/environment.service";
import { Logger } from "@nestjs/common";

async function bootstrap() {
	const { PORT } = CoreEnvironmentProvider.useValue.ENVIRONMENT;
	const app = await NestFactory.create(AppModule, {
		bodyParser: false,
		logger: new SqlLogger("[CODEBASE__SERVICE]"),
	});
	app.useLogger(new SqlLogger("CODEBASE__SERVICE", app.get(SQL_LOGGER_PROVIDER)));

	Logger.log(`Trying to start app on port : ${PORT}`);
	await app.init();
	await app.listen(PORT);
}
bootstrap();
