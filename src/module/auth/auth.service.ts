import { Injectable } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { AuthGatewayService } from "src/core/auth-gateway/auth-gateway.service";
import { CryptoService } from "src/core/crypto/crypto.service";
import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { UserJWTPayload } from "src/shared/business/auth/auth.payload";
import { UserSession } from "src/shared/business/auth/jwt-session.payload";
import { LoginBodyDTO, LoginResponseDTO } from "src/shared/dto/auth/login.dto";
import { LogoutResponseDTO } from "src/shared/dto/auth/logout.dto";

@Injectable()
export class AuthService {
	protected logger!: ContextLogger;

	constructor(
		protected readonly loggerService: LoggerService,
		private authGatewayService: AuthGatewayService,
		private cryptoService: CryptoService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async login(body: LoginBodyDTO): Promise<LoginResponseDTO> {
		return {
			token: await this.authGatewayService.authenticate<UserSession>(
				plainToInstance(
					UserJWTPayload,
					{
						key: this.cryptoService.hashingSHA256(body.userId),
					},
					{ exposeDefaultValues: true },
				),
				plainToInstance(
					UserSession,
					{
						userId: body.userId,
					},
					{ exposeDefaultValues: true },
				),
			),
		};
	}

	public async logout(tokenPayload: UserJWTPayload): Promise<LogoutResponseDTO> {
		await this.authGatewayService.logout(tokenPayload);
		return { isSuccess: true };
	}
}
