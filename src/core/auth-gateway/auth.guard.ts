import {
	CanActivate,
	ExecutionContext,
	Injectable,
	InternalServerErrorException,
	Logger,
	mixin,
	Type,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ClassConstructor, plainToClass, plainToInstance } from "class-transformer";
import { FastifyRequest } from "fastify";

import { validate, validateSync } from "class-validator";
import { JWTGatewayPayload, TOKEN_TYPE, TOKEN_TYPE_MAP } from "src/shared/business/auth/auth.payload";
import { BaseJwtSession } from "src/shared/business/auth/jwt-session.payload";
import { QUERY } from "src/shared/constants/http.constant";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { AuthSessionService } from "./auth-session.service";
import { TokenSessionService } from "./token-session.service";

interface RequestWithQuery {
	[QUERY.TOKEN]: string;
}

export function JwtGuard(params: {
	allowTokens: ClassConstructor<JWTGatewayPayload> | Array<ClassConstructor<JWTGatewayPayload>>;
	allowSessions?: ClassConstructor<BaseJwtSession> | Array<ClassConstructor<BaseJwtSession>>;
	needVerifyJwtSignature?: boolean;
}): Type<CanActivate> {
	@Injectable()
	class JWTDynamicGuard implements CanActivate {
		private logger!: ContextLogger;

		constructor(
			private jwtService: JwtService,
			protected loggerService: LoggerService,
			protected authSessionService: AuthSessionService,
			protected readonly tokeSessionService: TokenSessionService,
		) {
			this.logger = loggerService.newContextLogger(this.constructor.name);
		}

		public async canActivate(context: ExecutionContext): Promise<boolean> {
			const { allowTokens, allowSessions, needVerifyJwtSignature } = params;
			try {
				const request: FastifyRequest & {
					user?: JWTGatewayPayload;
					session: BaseJwtSession;
				} = context.switchToHttp().getRequest();
				const token = request.headers.authorization || (request.query as RequestWithQuery)[QUERY.TOKEN];
				if (!token) {
					throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
				}
				const jwtToken = token.startsWith("Bearer") ? token.split(" ")[1] : token;
				const payload = needVerifyJwtSignature
					? this.jwtService.verify(jwtToken)
					: this.jwtService.decode(jwtToken);
				const rawPayload: { type: TOKEN_TYPE; iat: Date; exp: number } =
					typeof payload === "string" ? JSON.parse(payload) : payload;
				if (rawPayload.exp * 1000 < Date.now()) {
					this.logger.error({}, "TOKEN EXPIRED!", undefined);
					throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
				}
				const tokenClass = TOKEN_TYPE_MAP[rawPayload.type];
				if (Array.isArray(allowTokens) ? !allowTokens.includes(tokenClass) : allowTokens !== tokenClass) {
					this.logger.error({}, "TOKEN TYPE NOT ALLOW!", undefined);
					throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
				}
				const userFromToken = plainToInstance(tokenClass, rawPayload, { exposeDefaultValues: true });
				const content = await this.tokeSessionService.getSessionValue(
					userFromToken.sessionChannel,
					userFromToken.sessionBoundId,
				);
				const tokenContent = plainToInstance(tokenClass, { ...rawPayload, ...content });
				if (!needVerifyJwtSignature && tokenContent.needVerifyJwtSignature) {
					this.jwtService.verify(jwtToken);
				}
				const validationErrors = await validate(tokenContent);
				if (validationErrors.length > 0) {
					this.logger.error({}, "Validate token error: " + JSON.stringify(validationErrors), undefined);
					throw new UnauthorizedException();
				}
				request.user = tokenContent;

				const session = await this.authSessionService.getSessionValue(
					userFromToken.sessionChannel,
					userFromToken.sessionBoundId,
				);
				request.session = session as BaseJwtSession;

				if (allowSessions) {
					if (!session) {
						throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
					}
					validateSession(session, allowSessions);
				}
				return true;
			} catch (e: unknown) {
				const { message } = e as Error;
				this.logger.debug({}, message);
				throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
			}
		}
	}

	return mixin(JWTDynamicGuard);
}

export function JWTNormalGuard(options?: {
	extraValidator?: (token: JWTGatewayPayload, request: FastifyRequest) => boolean;
}): Type<CanActivate> {
	@Injectable()
	class JWTDynamicGuard implements CanActivate {
		private logger = new Logger(this.constructor.name);

		constructor(private readonly jwtService: JwtService) {}

		public async canActivate(context: ExecutionContext): Promise<boolean> {
			try {
				const request: FastifyRequest & { user?: JWTGatewayPayload } = context.switchToHttp().getRequest();
				const bearerToken = request.headers.authorization || (request.query as RequestWithQuery)[QUERY.TOKEN];
				const token = bearerToken.replace("Bearer ", "");
				const payload: JWTGatewayPayload = await this.jwtService.verifyAsync(token);
				request.user = await this.validate(request, payload);
				if (options && options.extraValidator) {
					return options.extraValidator(request.user, request);
				}
				return true;
			} catch (e: unknown) {
				const { message } = e as Error;
				this.logger.debug(message);
				throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
			}
		}

		public async validate(_req: FastifyRequest, payload: JWTGatewayPayload): Promise<JWTGatewayPayload> {
			const parsedPayload = plainToClass(TOKEN_TYPE_MAP[payload.type] as ConstructorFunction<JWTGatewayPayload>, {
				...payload,
			});

			return parsedPayload;
		}
	}

	return mixin(JWTDynamicGuard);
}

export function validateSession(
	sessionData: BaseJwtSession,
	sessionTypes: ClassConstructor<BaseJwtSession> | Array<ClassConstructor<BaseJwtSession>>,
): BaseJwtSession {
	const sessionType = Array.isArray(sessionTypes)
		? sessionTypes.find((t) => new t().type == sessionData.type)
		: sessionTypes;
	if (!sessionType) {
		throw new InternalServerErrorException("Wrong session type implementation");
	}
	const sessionDefaultValue = new sessionType();
	if (sessionDefaultValue.type !== sessionData.type) {
		throw new UnauthorizedException("Invalid session type");
	}
	const sessionPayload = plainToInstance(sessionType, sessionData);
	const errors = validateSync(sessionPayload);
	if (errors.length > 0) {
		throw new UnauthorizedException("Invalid session data!");
	}
	return sessionPayload;
}
