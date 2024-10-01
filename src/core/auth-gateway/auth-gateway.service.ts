import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { JWTGatewayPayload, TOKEN_TYPE_MAP } from "src/shared/business/auth/auth.payload";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";
import { BaseAuthService } from "../auth/base-auth.service";

@Injectable()
export class AuthGatewayService extends BaseAuthService {
	protected buildTokenPublicPayload(payload: JWTGatewayPayload): JWTGatewayPayload {
		return plainToInstance(JWTGatewayPayload, payload, { exposeDefaultValues: true });
	}

	protected buildTokenPayload(payload: JWTGatewayPayload): JWTGatewayPayload {
		const tokenClass = TOKEN_TYPE_MAP[payload.type] as ConstructorFunction<JWTGatewayPayload>;
		if (!tokenClass) {
			throw new InternalServerErrorException(SYSTEM_CODE.INTERNAL_ERROR_OCCURRED);
		}
		return plainToInstance(tokenClass, payload, { exposeDefaultValues: true });
	}
}
