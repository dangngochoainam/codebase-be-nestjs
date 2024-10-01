import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthGatewayModule } from "src/core/auth-gateway/auth-gateway.module";
import { CryptoModule } from "src/core/crypto/crypto.module";
import { AuthController } from "./auth.controller";

@Module({
	imports: [AuthGatewayModule, CryptoModule],
	providers: [AuthService],
	exports: [AuthService],
	controllers: [AuthController],
})
export class AuthModule {}
