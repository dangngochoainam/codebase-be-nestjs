import { Exclude, Expose } from "class-transformer";
import { IsBoolean } from "class-validator";
import { DTO, METHOD } from "../base.dto";

@Exclude()
export class SignContractCheckSelfieResponseDTO {
	@Expose()
	@IsBoolean()
	public isSusses!: boolean;
}

export class SignContractCheckSelfieDTO extends DTO {
	public static url = "sign-contract/check-selfie";

	public readonly responseDTOClass = SignContractCheckSelfieResponseDTO;
	public readonly url: string = SignContractCheckSelfieDTO.url;
	public readonly method = METHOD.GET;

	public paramsDTO: undefined;
	public queryDTO: undefined;
	public bodyDTO: undefined;

	constructor() {
		super();
	}
}
