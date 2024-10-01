import { Global, Module } from "@nestjs/common";
import { AuthGatewayService } from "./auth-gateway.service";
import { AuthSessionService } from "./auth-session.service";
import { TokenSessionService } from "./token-session.service";
import { CoreJwtModule } from "src/jwt/jwt.module";
import { SessionRedisStorage } from "../session/session-storage.service";

@Global()
@Module({
	imports: [CoreJwtModule],
	providers: [AuthGatewayService, AuthSessionService, SessionRedisStorage, TokenSessionService],
	controllers: [],
	exports: [AuthGatewayService, SessionRedisStorage, AuthSessionService, TokenSessionService, CoreJwtModule],
})
export class AuthGatewayModule {}
