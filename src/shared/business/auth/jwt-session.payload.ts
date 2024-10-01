import { Exclude, Expose } from "class-transformer";
import { IsArray, IsEnum, IsIn, IsNumber, IsOptional, IsString } from "class-validator";

import { FlowSessionData } from "./flow-session.payload";
import { SESSION_TYPE } from "./session-type";

export enum USER_PERMISSION {
	OTP_VERIFIED = "OTP_VERIFIED",
	UPLOAD_IMAGE_PRIVATE = "UPLOAD_IMAGE_PRIVATE",
	FORGOT_PASSWORD = "FORGOT_PASSWORD",
}
export enum CIP_PERMISSION {}

export type SESSION_PERMISSION = USER_PERMISSION | CIP_PERMISSION;

@Exclude()
export abstract class BaseJwtSession {
	@Expose()
	@IsString()
	public key!: string;

	@Expose()
	@IsArray()
	public permissions: SESSION_PERMISSION[] = [];

	@Expose()
	@IsEnum(SESSION_TYPE)
	abstract readonly type: SESSION_TYPE;

	public tokenIDs?: string[];

	@Expose()
	public flowSessions?: FlowSessionData;
}

export abstract class BaseUserSession extends BaseJwtSession {
	@Expose()
	@IsString()
	public userId: string;

	constructor(key: string, userId: string) {
		super();
		this.key = key;
		this.userId = userId;
	}
}

@Exclude()
export class UserSession extends BaseUserSession {
	@Expose()
	@IsEnum(USER_PERMISSION, { each: true })
	public permissions: USER_PERMISSION[] = [];

	@Expose()
	@IsIn([SESSION_TYPE.USER_SESSION])
	public readonly type: SESSION_TYPE = SESSION_TYPE.USER_SESSION;
}

@Exclude()
export class OctoWebUserSession extends BaseUserSession {
	@Expose()
	@IsEnum(USER_PERMISSION, { each: true })
	public permissions: USER_PERMISSION[] = [];

	@Expose()
	@IsString()
	public partner_id!: string;

	@Expose()
	@IsString()
	public partner_userId!: string;

	@Expose()
	@IsIn([SESSION_TYPE.OCTO_WEB_SESSION])
	public readonly type: SESSION_TYPE = SESSION_TYPE.OCTO_WEB_SESSION;
}

export class OctoGuestSession extends BaseJwtSession {
	@Expose()
	@IsIn([SESSION_TYPE.OCTO_GUEST_SESSION])
	public readonly type: SESSION_TYPE = SESSION_TYPE.OCTO_GUEST_SESSION;

	@Expose()
	@IsString()
	public deviceId!: string;

	@Expose()
	@IsString()
	public deviceName!: string;

	@Expose()
	@IsNumber()
	@IsOptional()
	public time?: number;
}

export class FundTransferSession extends UserSession {
	@Expose()
	@IsString()
	public cus_no!: string;

	@Expose()
	@IsIn([SESSION_TYPE.FUND_TRANSFER_SESSION])
	public readonly type: SESSION_TYPE = SESSION_TYPE.FUND_TRANSFER_SESSION;
}
