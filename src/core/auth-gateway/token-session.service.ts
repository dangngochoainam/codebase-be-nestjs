import { Injectable } from "@nestjs/common";
import { BaseJWTPayload } from "src/shared/business/auth/auth.payload";
import { LoggerService } from "../logger/logger.service";
import { BaseSessionService } from "../session/session.service";
import { SessionRedisStorage } from "../session/session-storage.service";

@Injectable()
export class TokenSessionService extends BaseSessionService<"TOKEN", BaseJWTPayload> {
	public readonly NAMESPACE = "TOKEN";

	public constructor(
		storage: SessionRedisStorage,
		protected loggerService: LoggerService,
	) {
		super(storage, loggerService);
	}

	protected valueDeserializer = JSON.parse;

	protected valueSerializer = JSON.stringify;
}
