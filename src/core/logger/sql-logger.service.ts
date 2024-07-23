import { v4 } from "uuid";
import { ISqlLoggerPayload, SQL_LOGGER_TYPE } from "./sql-logger.payload";
import { ICustomLogging } from "./logger.service";
import { inspect } from "util";

export abstract class BaseSqlLoggerService {
	// TODO: find the way to get instance environment variable, replace for this way
	constructor(private instanceId: string) {
		this.instanceId = instanceId;
	}

	abstract insertLog(payload: ISqlLoggerPayload): void;

	private log(type: SQL_LOGGER_TYPE, customLogging: ICustomLogging, message: string | unknown): ISqlLoggerPayload {
		const log: ISqlLoggerPayload = {
			id: v4(),
			// TODO: find the way to get instance environment variable
			instanceId: this.instanceId,
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
