import { Exclude, Expose } from "class-transformer";
import { DTO, METHOD } from "../base.dto";

@Exclude()
export class CheckSessionResponseDTO {
	@Expose()
	public tokenPayload!: unknown;
	@Expose()
	public sessionPayload!: unknown;
}

export class CheckSessionDTO extends DTO {
	public static url = "check-session";
	public readonly method = METHOD.GET;

	public paramsDTO: undefined;
	public queryDTO: undefined;
	public bodyDTO: undefined;

	public readonly responseDTOClass = CheckSessionResponseDTO;
	public readonly url: string = CheckSessionDTO.url;

	constructor() {
		super();
	}
}
