import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SqlLogger } from "./core/logger/logger";
import { SQL_LOGGER_PROVIDER } from "./core/logger/logger.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bodyParser: false,
		logger: new SqlLogger("[CODEBASE__SERVICE]"),
	});
	app.useLogger(new SqlLogger("CODEBASE__SERVICE", app.get(SQL_LOGGER_PROVIDER)));
	await app.listen(9000);
}
bootstrap();
