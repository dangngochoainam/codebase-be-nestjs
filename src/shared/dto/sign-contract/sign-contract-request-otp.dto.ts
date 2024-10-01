import { Exclude, Expose } from "class-transformer";
import { IsBoolean } from "class-validator";
import { DTO, METHOD } from "../base.dto";

@Exclude()
export class SignContractRequestOtpResponseDTO {
	@Expose()
	@IsBoolean()
	public isSusses!: boolean;
}

export class SignContractRequestOtpDTO extends DTO {
	public static url = "sign-contract/request-otp";

	public readonly responseDTOClass = SignContractRequestOtpResponseDTO;
	public readonly url: string = SignContractRequestOtpDTO.url;
	public readonly method = METHOD.GET;

	public paramsDTO: undefined;
	public queryDTO: undefined;
	public bodyDTO: undefined;

	constructor() {
		super();
	}
}
