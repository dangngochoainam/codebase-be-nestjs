import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { instanceToPlain } from "class-transformer";
import { randomBytes } from "crypto";
import { BaseJWTPayload, REFRESH_TOKEN } from "src/shared/business/auth/auth.payload";
import { BaseJwtSession } from "src/shared/business/auth/jwt-session.payload";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";
import * as uuid from "uuid";
import { AuthSessionService } from "../auth-gateway/auth-session.service";
import { TokenSessionService } from "../auth-gateway/token-session.service";
import { CoreEnvironment, CoreEnvironmentService } from "../environment/environment.service";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { SESSION_TYPE } from "../session/session-definition";

@Injectable()
export abstract class BaseAuthService {
	public logger!: ContextLogger;

	constructor(
		public readonly jwtService: JwtService,
		protected readonly envService: CoreEnvironmentService<CoreEnvironment>,
		protected readonly authSessionService: AuthSessionService,
		protected readonly tokenSessionService: TokenSessionService,
		protected loggerService: LoggerService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	protected abstract buildTokenPayload(rawPayload: BaseJWTPayload): BaseJWTPayload;

	protected abstract buildTokenPublicPayload(rawPayload: BaseJWTPayload): BaseJWTPayload;

	protected genSecret(): string {
		return randomBytes(32).toString("base64");
	}

	protected signJwt(
		payload: BaseJWTPayload,
		secret?: string,
		expireTime: number = this.envService.ENVIRONMENT.TOKEN_EXPIRE,
	): string {
		if (!payload.id) {
			payload.id = uuid.v4();
		}
		const content = instanceToPlain(this.buildTokenPublicPayload(payload));
		delete content.iat;
		delete content.exp;
		return this.jwtService.sign(content, {
			audience: this.envService.ENVIRONMENT.JWT_ISSUER,
			subject: payload.key,
			issuer: this.envService.ENVIRONMENT.JWT_ISSUER,
			expiresIn: expireTime,
			secret,
		});
	}

	protected async clearSession(type: SESSION_TYPE, keys: string[]): Promise<void> {
		this.logger.info({}, "CLEAR SESSION KEYS: " + JSON.stringify(keys));
		await Promise.all(
			keys.map(async (key) => {
				await this.tokenSessionService.clearSession(type, key);
				await this.authSessionService.clearSession(type, key);
			}),
		);
	}

	protected async createToken(
		payload: BaseJWTPayload,
		allowMultipleTokens: boolean = false,
		expireTime: number = this.envService.ENVIRONMENT.TOKEN_EXPIRE,
		additionalPlugins?: Record<string, object>,
	): Promise<string> {
		console.log(additionalPlugins);

		const content = this.buildTokenPayload(payload);
		const secretGeneration = this.genSecret();

		const existingToken = await this.tokenSessionService.getKeys(
			content.sessionChannel,
			content.sessionBoundId.replace(content.id, "*"),
		);
		if (allowMultipleTokens && existingToken.length) {
		} else if (existingToken.length) {
			this.clearSession(content.sessionChannel, existingToken);
		}

		const token = this.signJwt(payload, secretGeneration, expireTime);
		await this.tokenSessionService.addSession(content.sessionChannel, content.sessionBoundId, expireTime, content);
		return token;
	}

	public async authenticateWithHardSecret<SESSION extends BaseJwtSession>(
		payload: BaseJWTPayload,
		session: SESSION,
		expireTime: number = this.envService.ENVIRONMENT.TOKEN_EXPIRE,
		sessionLifeTime?: number,
	): Promise<string> {
		if (!payload.id) {
			payload.id = uuid.v4();
		}
		const token = this.signJwt(payload, undefined, expireTime);
		const content = this.buildTokenPayload(payload);
		await this.tokenSessionService.addSession(content.sessionChannel, content.sessionBoundId, expireTime, content);
		await this.authSessionService.addSession(
			content.sessionChannel,
			content.sessionBoundId,
			sessionLifeTime || expireTime,
			{
				...session,
				key: content.sessionBoundId,
				tokenIDs: [...(session.tokenIDs || []), content.id],
			},
		);
		return token;
	}

	public async authenticate<SESSION extends BaseJwtSession>(
		payload: BaseJWTPayload,
		session: SESSION,
		expireTime: number = this.envService.ENVIRONMENT.TOKEN_EXPIRE,
		sessionLifeTime?: number,
		additionalPlugins?: Record<string, object>,
		allowMultipleTokens: boolean = false,
	): Promise<string> {
		if (!payload.id) {
			payload.id = uuid.v4();
		}
		const token = await this.createToken(payload, allowMultipleTokens, expireTime, additionalPlugins);
		const content = this.buildTokenPayload(payload);
		await this.authSessionService.addSession(
			content.sessionChannel,
			content.sessionBoundId,
			sessionLifeTime || expireTime,
			{
				...session,
				key: content.sessionBoundId,
				tokenIDs: [...(session.tokenIDs || []), content.id],
			},
		);
		return token;
	}

	public async renewToken(
		content: BaseJWTPayload,
		expireTime: number = this.envService.ENVIRONMENT.TOKEN_EXPIRE,
		additionalPlugins?: Record<string, object>,
		allowMultipleTokens: boolean = false,
	): Promise<string> {
		if (!REFRESH_TOKEN.includes(content.type)) {
			this.logger.error({}, "TOKEN TYPE NOT ALLOW TO REFRESH: " + content.type, undefined);
			throw new UnauthorizedException(SYSTEM_CODE.TOKEN_IS_NOT_ALLOW_TO_REFRESH);
		}
		const exp = (content.exp || 0) * 1000;
		if (!exp || Date.now() < exp - this.envService.ENVIRONMENT.TOKEN_REFRESH_TIME_WINDOW) {
			this.logger.error({}, "TOKEN IS NOT ALLOW TO REFRESH", undefined);
			this.logger.error({}, "TOKEN EXPIRED TIME: " + exp, undefined);
			this.logger.error(
				{},
				"TOKEN_REFRESH_TIME_WINDOW: " + this.envService.ENVIRONMENT.TOKEN_REFRESH_TIME_WINDOW,
				undefined,
			);
			this.logger.error(
				{},
				"TOKEN LIFETIME: " + (exp - this.envService.ENVIRONMENT.TOKEN_REFRESH_TIME_WINDOW),
				undefined,
			);
			throw new UnauthorizedException(SYSTEM_CODE.TOKEN_IS_NOT_ALLOW_TO_REFRESH);
		}
		return this.createToken(content, allowMultipleTokens, expireTime, additionalPlugins);
	}

	public async logout(content: BaseJWTPayload): Promise<void> {
		await this.clearSession(content.sessionChannel, [content.sessionBoundId]);
	}
}
