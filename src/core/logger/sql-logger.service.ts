import { v4 } from "uuid";
import { ISqlLoggerPayload, SQL_LOGGER_TYPE } from "./sql-logger.payload";
import { ICustomLogging } from "./logger.service";
import { inspect } from "util";
import { CoreEnvironmentProvider, CoreEnvironmentService } from "../environment/environment.service";
import { ExampleEnvironment } from "src/module/environment/environment";

export abstract class BaseSqlLoggerService {
	abstract insertLog(payload: ISqlLoggerPayload): void;

	private log(type: SQL_LOGGER_TYPE, customLogging: ICustomLogging, message: string | unknown): ISqlLoggerPayload {
		const log: ISqlLoggerPayload = {
			id: v4(),
			instanceId: CoreEnvironmentProvider.useValue.ENVIRONMENT.INSTANCE_ID,
			name: customLogging.name,
			context: customLogging.context,
			type,
			traceId: customLogging.traceId,
			message: typeof message === "string" ? message : inspect(message),
		};
		this.insertLog(log);
		return log;
	}

	public debug(customLogging: ICustomLogging, message: string | unknown): ISqlLoggerPayload {
		return this.log(SQL_LOGGER_TYPE.DEBUG, customLogging, message);
	}

	public info(customLogging: ICustomLogging, message: string | unknown): ISqlLoggerPayload {
		return this.log(SQL_LOGGER_TYPE.INFO, customLogging, message);
	}

	public warn(customLogging: ICustomLogging, message: string | unknown): ISqlLoggerPayload {
		return this.log(SQL_LOGGER_TYPE.WARN, customLogging, message);
	}

	public error(customLogging: ICustomLogging, message: string | unknown): ISqlLoggerPayload {
		return this.log(SQL_LOGGER_TYPE.ERROR, customLogging, message);
	}
}
