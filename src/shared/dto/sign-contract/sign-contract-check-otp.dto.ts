import { Exclude, Expose } from "class-transformer";
import { IsBoolean } from "class-validator";
import { DTO, METHOD } from "../base.dto";

@Exclude()
export class SignContractCheckOtpResponseDTO {
	@Expose()
	@IsBoolean()
	public isSusses!: boolean;
}

export class SignContractCheckOtpDTO extends DTO {
	public static url = "sign-contract/check-otp";

	public readonly responseDTOClass = SignContractCheckOtpResponseDTO;
	public readonly url: string = SignContractCheckOtpDTO.url;
	public readonly method = METHOD.GET;

	public paramsDTO: undefined;
	public queryDTO: undefined;
	public bodyDTO: undefined;

	constructor() {
		super();
	}
}
