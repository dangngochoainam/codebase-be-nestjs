import { Controller, Get, UseGuards } from "@nestjs/common";
import { SignContractService } from "./sign-contract.service";
import {
	SignContractRequestOtpDTO,
	SignContractRequestOtpResponseDTO,
} from "src/shared/dto/sign-contract/sign-contract-request-otp.dto";
import { JwtGuard } from "src/core/auth-gateway/auth.guard";
import { UserJWTPayload } from "src/shared/business/auth/auth.payload";
import { UserSession } from "src/shared/business/auth/jwt-session.payload";
import { FlowPermissionGuard } from "src/core/permission/permission.interceptor";
import { OCTO_FLOW_TYPE, SIGN_CONTRACT_FLOW_PERMISSION } from "src/shared/business/auth/flow-session.payload";
import { JWTContent, JWTSession } from "src/core/auth-gateway/auth.decorator";
import {
	SignContractCheckOtpDTO,
	SignContractCheckOtpResponseDTO,
} from "src/shared/dto/sign-contract/sign-contract-check-otp.dto";
import {
	SignContractCheckSelfieDTO,
	SignContractCheckSelfieResponseDTO,
} from "src/shared/dto/sign-contract/sign-contract-check-selfie.dto";

@Controller()
export class SignContractController {
	constructor(public signContractService: SignContractService) {}

	@Get(SignContractRequestOtpDTO.url)
	@UseGuards(
		JwtGuard({
			allowTokens: [UserJWTPayload],
			allowSessions: [UserSession],
		}),
	)
	@FlowPermissionGuard({
		flow: OCTO_FLOW_TYPE.SIGN_CONTRACT,
		providePermissions: [SIGN_CONTRACT_FLOW_PERMISSION.OTP_REQUESTED],
	})
	public requestOtp(
		@JWTContent() tokenPayload: UserJWTPayload,
		@JWTSession([UserSession])
		_sessionPayload: UserSession,
	): Promise<SignContractRequestOtpResponseDTO> {
		return this.signContractService.requestOtp(tokenPayload);
	}

	@Get(SignContractCheckOtpDTO.url)
	@UseGuards(
		JwtGuard({
			allowTokens: [UserJWTPayload],
			allowSessions: [UserSession],
		}),
	)
	@FlowPermissionGuard({
		flow: OCTO_FLOW_TYPE.SIGN_CONTRACT,
		requiredPermissions: [SIGN_CONTRACT_FLOW_PERMISSION.OTP_REQUESTED],
		providePermissions: [SIGN_CONTRACT_FLOW_PERMISSION.OTP_VERIFIED],
	})
	public checkOtp(
		@JWTContent() tokenPayload: UserJWTPayload,
		@JWTSession([UserSession])
		_sessionPayload: UserSession,
	): Promise<SignContractCheckOtpResponseDTO> {
		return this.signContractService.checkOtp(tokenPayload);
	}

	@Get(SignContractCheckSelfieDTO.url)
	@UseGuards(
		JwtGuard({
			allowTokens: [UserJWTPayload],
			allowSessions: [UserSession],
		}),
	)
	@FlowPermissionGuard({
		flow: OCTO_FLOW_TYPE.SIGN_CONTRACT,
		requiredPermissions: [SIGN_CONTRACT_FLOW_PERMISSION.OTP_REQUESTED, SIGN_CONTRACT_FLOW_PERMISSION.OTP_VERIFIED],
		providePermissions: [SIGN_CONTRACT_FLOW_PERMISSION.SELFIE_VERIFIED],
	})
	public checkSelfie(
		@JWTContent() tokenPayload: UserJWTPayload,
		@JWTSession([UserSession])
		_sessionPayload: UserSession,
	): Promise<SignContractCheckSelfieResponseDTO> {
		return this.signContractService.checkSelfie(tokenPayload);
	}
}
