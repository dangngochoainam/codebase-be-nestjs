import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JWTContent, JWTSession } from "src/core/auth-gateway/auth.decorator";
import { JwtGuard } from "src/core/auth-gateway/auth.guard";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { PermissionGuard } from "src/core/permission/permission.interceptor";
import { UserJWTPayload } from "src/shared/business/auth/auth.payload";
import { USER_PERMISSION, UserSession } from "src/shared/business/auth/jwt-session.payload";
import { ExampleAddPermissionDTO, ExampleAddSessionLocalFlowDTO } from "src/shared/dto/auth/example.dto";
import { LoginBodyDTO, LoginDto, LoginResponseDTO } from "src/shared/dto/auth/login.dto";
import { LogoutDTO, LogoutResponseDTO } from "src/shared/dto/auth/logout.dto";
import { AuthService } from "./auth.service";

@Controller()
export class AuthController {
	protected logger!: ContextLogger;
	constructor(
		public authService: AuthService,
		protected loggerService: LoggerService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	@Post(LoginDto.url)
	public async login(@Body() body: LoginBodyDTO): Promise<LoginResponseDTO> {
		return this.authService.login(body);
	}

	@Post(LogoutDTO.url)
	@UseGuards(
		JwtGuard({
			allowTokens: [UserJWTPayload],
			allowSessions: [UserSession],
		}),
	)
	public logout(
		@JWTContent() tokenPayload: UserJWTPayload,
		@JWTSession([UserSession])
		_sessionPayload: UserSession,
	): Promise<LogoutResponseDTO> {
		return this.authService.logout(tokenPayload);
	}

	@Get(ExampleAddPermissionDTO.url)
	@UseGuards(
		JwtGuard({
			allowTokens: UserJWTPayload,
			allowSessions: UserSession,
		}),
	)
	@PermissionGuard({ providePermissions: [USER_PERMISSION.OTP_VERIFIED] })
	public async exampleAddPermissionFlow(
		@JWTContent() token: UserJWTPayload,
		@JWTSession(UserSession) _: UserSession,
	) {
		this.logger.info({}, token);
	}

	@Get(ExampleAddSessionLocalFlowDTO.url)
	@UseGuards(
		JwtGuard({
			allowTokens: UserJWTPayload,
			allowSessions: UserSession,
		}),
	)
	@PermissionGuard({
		requiredPermissions: [USER_PERMISSION.OTP_VERIFIED],
		providePermissions: [USER_PERMISSION.FORGOT_PASSWORD],
	})
	public async exampleAddSessionLocalFlow(
		@JWTContent() token: UserJWTPayload,
		@JWTSession(UserSession) _: UserSession,
	) {
		this.logger.info({}, token);
	}
}
