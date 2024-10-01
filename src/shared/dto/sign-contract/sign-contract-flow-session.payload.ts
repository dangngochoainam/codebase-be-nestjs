import { Exclude, Expose } from "class-transformer";
import { IsIn, IsOptional, IsString } from "class-validator";
import {
	BaseFlowSession,
	OCTO_FLOW_TYPE,
	SIGN_CONTRACT_FLOW_PERMISSION,
} from "src/shared/business/auth/flow-session.payload";

export enum SIGN_CONTRACT_PERMISSION {
	OTP_REQUESTED = "OTP_REQUESTED",
	OTP_VERIFIED = "OTP_VERIFIED",
	SELFIE_VERIFIED = "SELFIE_VERIFIED",
}

@Exclude()
export class SignContractSession extends BaseFlowSession {
	@Expose()
	@IsIn([OCTO_FLOW_TYPE.SIGN_CONTRACT])
	public readonly type: OCTO_FLOW_TYPE.SIGN_CONTRACT = OCTO_FLOW_TYPE.SIGN_CONTRACT;

	@Expose()
	public permissions: SIGN_CONTRACT_FLOW_PERMISSION[] = [];

	@Expose()
	@IsString()
	public contractId!: string;

	@Expose()
	@IsString()
	@IsOptional()
	public otpId?: string;

	@Expose()
	@IsString()
	@IsOptional()
	public selfieId?: string;
}
