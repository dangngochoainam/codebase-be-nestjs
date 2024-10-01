import { Exclude, Expose } from "class-transformer";
import { IsEnum, IsIn, IsNumber, IsOptional, IsString } from "class-validator";
import { JWT_SESSION } from "./session-type";

export enum SERVICE {
	EXAMPLE = "example-ms",
	AUTH = "authentication-ms",
	ONBOARD = "onboard-service-ms",
	FIXED_DEPOSIT = "fixed-deposit-ms",
	REPAYMENT = "repayment-ms",
}

export enum TOKEN_TYPE {
	USER = "USER",
	OCTO_GUEST = "OCTO_GUEST",
	OCTO_WEB = "OCTO_WEB",
	ONBOARDING_EMAIL_OTP = "ONBOARDING_EMAIL_OTP",
	ONBOARDING_EMAIL_OTP_VERIFIED = "ONBOARDING_EMAIL_OTP_VERIFIED",
}

export const REFRESH_TOKEN: string[] = [TOKEN_TYPE.OCTO_GUEST, TOKEN_TYPE.OCTO_WEB];

export interface IJWTGatewayPayload {
	key: string;
	type: TOKEN_TYPE;
}

@Exclude()
export abstract class BaseJWTPayload {
	@Expose()
	@IsNumber()
	@IsOptional()
	public iat?: number;

	@Expose()
	@IsNumber()
	@IsOptional()
	public exp?: number;

	@Expose()
	@IsString()
	public key!: string;

	@Expose()
	@IsString()
	public id!: string;

	@Expose()
	@IsEnum(JWT_SESSION)
	public sessionChannel: JWT_SESSION = JWT_SESSION.TOKEN;

	public get sessionBoundId(): string {
		return `${this.key}:${this.id}`;
	}

	@Expose()
	public abstract type: string;

	public needVerifyJwtSignature: boolean = false;
}

@Exclude()
export class JWTGatewayPayload extends BaseJWTPayload implements IJWTGatewayPayload {
	@Expose()
	@IsEnum(TOKEN_TYPE)
	public type!: TOKEN_TYPE;
}

@Exclude()
export class UserJWTPayload extends JWTGatewayPayload {
	public constructor() {
		super();
	}

	@Expose()
	@IsIn([TOKEN_TYPE.USER])
	public readonly type: TOKEN_TYPE = TOKEN_TYPE.USER;
}

@Exclude()
export class OctoWebUserJWTPayload extends JWTGatewayPayload {
	@Expose()
	@IsIn([TOKEN_TYPE.OCTO_WEB])
	public readonly type: TOKEN_TYPE = TOKEN_TYPE.OCTO_WEB;
}

@Exclude()
export class OctoWebJWTPayload extends JWTGatewayPayload {
	@Expose()
	@IsIn([TOKEN_TYPE.OCTO_WEB])
	public readonly type: TOKEN_TYPE = TOKEN_TYPE.OCTO_WEB;
}

@Exclude()
export class OctoGuestJWTPayload extends JWTGatewayPayload {
	@Expose()
	@IsIn([TOKEN_TYPE.OCTO_GUEST])
	public readonly type: TOKEN_TYPE = TOKEN_TYPE.OCTO_GUEST;

	public needVerifyJwtSignature: boolean = true;
}

@Exclude()
export class SignContractJWTPayload extends JWTGatewayPayload {
	@Expose()
	@IsIn([TOKEN_TYPE.USER])
	public readonly type: TOKEN_TYPE = TOKEN_TYPE.USER;
}

type TokenMap<T extends JWTGatewayPayload> = {
	[k in TOKEN_TYPE]: ConstructorFunction<T>;
};

export class TokenTypeMap implements TokenMap<JWTGatewayPayload> {
	public [TOKEN_TYPE.USER] = UserJWTPayload as ConstructorFunction<JWTGatewayPayload>;
	public [TOKEN_TYPE.OCTO_GUEST] = OctoGuestJWTPayload;
	public [TOKEN_TYPE.OCTO_WEB] = OctoWebJWTPayload;
	public [TOKEN_TYPE.ONBOARDING_EMAIL_OTP] = OctoGuestJWTPayload;
	public [TOKEN_TYPE.ONBOARDING_EMAIL_OTP_VERIFIED] = OctoGuestJWTPayload;
}

export const TOKEN_TYPE_MAP = new TokenTypeMap();
