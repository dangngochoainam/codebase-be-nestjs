import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { BaseFlowSession, FLOW_PERMISSION, FLOW_TYPE } from "src/shared/business/auth/flow-session.payload";
import { BaseJwtSession, SESSION_PERMISSION } from "src/shared/business/auth/jwt-session.payload";
import { JWT_SESSION } from "src/shared/business/auth/session-type";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";
import { LoggerService } from "../logger/logger.service";
import { BaseSessionService } from "../session/session.service";
import { SessionRedisStorage } from "../session/session-storage.service";

@Injectable()
export class AuthSessionService extends BaseSessionService<"SESSION", BaseJwtSession> {
	public readonly NAMESPACE = "SESSION";

	public constructor(
		storage: SessionRedisStorage,
		protected loggerService: LoggerService,
	) {
		super(storage, loggerService);
	}

	protected valueDeserializer = JSON.parse;

	protected valueSerializer = JSON.stringify;

	public async addPermissions(
		key: string,
		permissions: SESSION_PERMISSION[],
		sessionType: JWT_SESSION = JWT_SESSION.TOKEN,
	): Promise<Record<string, any> | never> {
		const session = await super.getSessionValue(JWT_SESSION.TOKEN, key);
		if (!session) {
			throw new BadRequestException(SYSTEM_CODE.SESSION_NOT_AVAILABLE);
		}
		if (!session.permissions) {
			session.permissions = [];
		}
		permissions.forEach((p) => {
			if (!session.permissions.includes(p)) {
				session.permissions.push(p);
			}
		});
		return super.addSession(sessionType, key, (session as any).exp - Math.floor(Date.now() / 1000), session);
	}

	public async addFlowSession<V extends BaseFlowSession>(
		key: string,
		value: V,
		sessionType: JWT_SESSION = JWT_SESSION.TOKEN,
	): Promise<Record<string, any> | never> {
		if (!value.type) {
			this.logger.error({}, "Flow session type invalid!", undefined);
			throw new InternalServerErrorException(SYSTEM_CODE.SORRY_SOMETHING_WENT_WRONG);
		}
		const session = await super.getSessionValue(sessionType, key);
		if (!session) {
			throw new BadRequestException(SYSTEM_CODE.SESSION_NOT_AVAILABLE);
		}
		return super.addSession(sessionType, key, (session as any).exp - Math.floor(Date.now() / 1000), {
			...session,
			flowSessions: {
				...session.flowSessions,
				[value.type]: {
					...(session.flowSessions ? session.flowSessions[value.type] : {}),
					...value,
				},
			},
		});
	}

	public async updateFlowSession<V extends BaseFlowSession>(
		key: string,
		value: Partial<V>,
		sessionType: JWT_SESSION = JWT_SESSION.TOKEN,
	): Promise<Record<string, any> | never> {
		return this.addFlowSession(key, value as V, sessionType);
	}

	public async getFlowSession<V extends BaseFlowSession>(
		key: string,
		type: FLOW_TYPE,
		sessionType: JWT_SESSION = JWT_SESSION.TOKEN,
	): Promise<V | never> {
		const session = await super.getSessionValue(sessionType, key);
		if (!session || !session.flowSessions || !session.flowSessions[type]) {
			throw new BadRequestException(SYSTEM_CODE.SESSION_NOT_AVAILABLE);
		}
		return session.flowSessions![type] as V;
	}

	public async clearFlowSession(
		key: string,
		type: FLOW_TYPE,
		sessionType: JWT_SESSION = JWT_SESSION.TOKEN,
	): Promise<Record<string, any> | never> {
		const session = await super.getSessionValue(sessionType, key);
		if (!session) {
			throw new BadRequestException(SYSTEM_CODE.SESSION_NOT_AVAILABLE);
		}
		return super.addSession(sessionType, key, (session as any).exp - Math.floor(Date.now() / 1000), {
			...session,
			flowSessions: {
				...session.flowSessions,
				[type]: undefined,
			},
		});
	}

	public async addFlowPermissions(
		key: string,
		type: FLOW_TYPE,
		permissions: FLOW_PERMISSION[],
		sessionType: JWT_SESSION = JWT_SESSION.TOKEN,
	): Promise<BaseJwtSession | never> {
		const session = await super.getSessionValue(sessionType, key);
		if (!session) {
			throw new BadRequestException(SYSTEM_CODE.SESSION_NOT_AVAILABLE);
		}
		const flowSession: BaseFlowSession | undefined = session.flowSessions && session.flowSessions[type];
		if (!flowSession) {
			throw new BadRequestException(SYSTEM_CODE.SESSION_NOT_AVAILABLE);
		}
		permissions.forEach((p) => {
			if (!flowSession.permissions.includes(p)) {
				flowSession.permissions.push(p);
			}
		});
		return super.addSession(sessionType, key, (session as any).exp - Math.floor(Date.now() / 1000), {
			...session,
			flowSessions: {
				...session.flowSessions,
				[type]: {
					...flowSession,
				},
			},
		});
	}
}
