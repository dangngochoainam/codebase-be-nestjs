import { Injectable } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { AuthSessionService } from "src/core/auth-gateway/auth-session.service";
import { UserJWTPayload } from "src/shared/business/auth/auth.payload";
import { OCTO_FLOW_TYPE } from "src/shared/business/auth/flow-session.payload";
import { SignContractCheckOtpResponseDTO } from "src/shared/dto/sign-contract/sign-contract-check-otp.dto";
import { SignContractCheckSelfieResponseDTO } from "src/shared/dto/sign-contract/sign-contract-check-selfie.dto";
import { SignContractSession } from "src/shared/dto/sign-contract/sign-contract-flow-session.payload";
import { SignContractRequestOtpResponseDTO } from "src/shared/dto/sign-contract/sign-contract-request-otp.dto";
import { v4 } from "uuid";

@Injectable()
export class SignContractService {
	constructor(private authSessionService: AuthSessionService) {}

	public async requestOtp(tokenPayload: UserJWTPayload): Promise<SignContractRequestOtpResponseDTO> {
		// Request OTP, create contract item,...

		await this.authSessionService.addFlowSession<SignContractSession>(
			tokenPayload.sessionBoundId,
			plainToInstance(
				SignContractSession,
				{
					contractId: v4(),
					otpId: v4(),
				},
				{ exposeDefaultValues: true },
			),
			tokenPayload.sessionChannel,
		);
		return { isSusses: true };
	}

	public async checkOtp(_tokenPayload: UserJWTPayload): Promise<SignContractCheckOtpResponseDTO> {
		// Check OTP, save otp transaction,...

		return { isSusses: true };
	}

	public async checkSelfie(tokenPayload: UserJWTPayload): Promise<SignContractCheckSelfieResponseDTO> {
		// Check selfie, save selfie image,...

		await this.authSessionService.updateFlowSession<SignContractSession>(
			tokenPayload.sessionBoundId,
			{
				selfieId: v4(),
				type: OCTO_FLOW_TYPE.SIGN_CONTRACT,
			},
			tokenPayload.sessionChannel,
		);
		return { isSusses: true };
	}
}
