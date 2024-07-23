import { Injectable } from "@nestjs/common";
import { BaseSqlLoggerService } from "src/core/logger/sql-logger.service";
import { LogEntity } from "src/db-log/entity/log.entity";
import { Repository } from "typeorm";
import { SQL_LOG_DB_CONNECTION_NAME } from "./db-logger";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SqlLoggerService extends BaseSqlLoggerService {
	constructor(
		@InjectRepository(LogEntity, SQL_LOG_DB_CONNECTION_NAME) private readonly logRepository: Repository<LogEntity>,
		private readonly configService: ConfigService,
	) {
		super(configService.get("INSTANCE_ID") || "no-instance-id");
	}

	public insertLog(payload: LogEntity): void {
		this.logRepository
			.insert(payload)
			.then((_) => {})
			.catch((error) => console.error("INSERT LOG ERROR: ", error));
	}
}
