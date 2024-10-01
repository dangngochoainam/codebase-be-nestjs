import { Exclude, Expose } from "class-transformer";
import { IsIn, IsOptional, IsString } from "class-validator";

export enum OCTO_FLOW_TYPE {
	SIGN_CONTRACT = "SIGN_CONTRACT",
	FUND_TRANSFER = "FUND_TRANSFER",
	INQUIRY_STATUS = "INQUIRY_STATUS",
	WITHDRAWAL_DEPOSIT = "WITHDRAWAL_DEPOSIT",
	ACTIVE_BIOMETRIC = "ACTIVE_BIOMETRIC",
	VERIFY_BIOMETRIC = "VERIFY_BIOMETRIC",
	CREATE_ACCOUNT = "CREATE_ACCOUNT",
	FORGOT_PASSWORD = "FORGOT_PASSWORD",
}

export enum PARTNER_FLOW_TYPE {
	SIGN_CONTRACT = "SIGN_CONTRACT",
	LINK_TYPE_3 = "LINK_TYPE_3",
}

export enum SIGN_CONTRACT_FLOW_PERMISSION {
	OTP_REQUESTED = "OTP_REQUESTED",
	OTP_VERIFIED = "OTP_VERIFIED",
	SELFIE_VERIFIED = "SELFIE_VERIFIED",
	INIT_CONTRACT = "INIT_CONTRACT",
}

export enum FUND_TRANSFER_FLOW_PERMISSION {
	INQUIRY_ACCOUNT = "INQUIRY_ACCOUNT",
}

export enum WITHDRAWAL_DEPOSIT_FLOW_PERMISSION {
	REQUEST_WITHDRAWAL_DEPOSIT = "REQUEST_WITHDRAWAL_DEPOSIT",
	VERIFIED_OTP_WITHDRAWAL_DEPOSIT = "VERIFIED_OTP_WITHDRAWAL_DEPOSIT",
}

export enum LINK_TYPE_3_FLOW_PERMISSION {
	IC_VALIDATED = "IC_VALIDATED",
	OTP_REQUESTED = "OTP_REQUESTED",
	OTP_VERIFIED = "OTP_VERIFIED",
}

export type FLOW_TYPE = OCTO_FLOW_TYPE | PARTNER_FLOW_TYPE;

export type FLOW_PERMISSION =
	| SIGN_CONTRACT_FLOW_PERMISSION
	| FUND_TRANSFER_FLOW_PERMISSION
	| WITHDRAWAL_DEPOSIT_FLOW_PERMISSION;

@Exclude()
export abstract class BaseFlowSession {
	abstract readonly type: FLOW_TYPE;

	@Expose()
	public permissions: FLOW_PERMISSION[] = [];
}

export type FlowSessionData = {
	[k in FLOW_TYPE]?: BaseFlowSession;
};

@Exclude()
export class FundTransferSession extends BaseFlowSession {
	@Expose()
	@IsString()
	public readonly transactionId!: string;

	@Expose()
	@IsString()
	public readonly cust_no!: string;

	@Expose()
	@IsIn([OCTO_FLOW_TYPE.FUND_TRANSFER])
	public readonly type: OCTO_FLOW_TYPE = OCTO_FLOW_TYPE.FUND_TRANSFER;

	constructor() {
		super();
	}
}

@Exclude()
export class WithdrawalDepositSession extends BaseFlowSession {
	@IsString()
	@Expose()
	@IsOptional()
	public uuid?: string;

	@IsString()
	@Expose()
	public depositId!: string; // format: [casa_number.depositId]

	@IsString()
	@Expose()
	public userId!: string;

	@IsString()
	@Expose()
	public transactionId!: string;

	@IsString()
	@Expose()
	public casaSubAccountSeq!: string;

	@Expose()
	@IsIn([OCTO_FLOW_TYPE.WITHDRAWAL_DEPOSIT])
	public readonly type: OCTO_FLOW_TYPE = OCTO_FLOW_TYPE.WITHDRAWAL_DEPOSIT;

	constructor() {
		super();
	}
}
