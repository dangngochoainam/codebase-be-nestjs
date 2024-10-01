import { DTO, METHOD } from "../base.dto";

export class ExampleSessionResponseDTO {}

export class ExampleAddPermissionDTO extends DTO {
	public static url = "add-provide-permission";

	public readonly responseDTOClass = ExampleSessionResponseDTO;
	public readonly url: string = ExampleAddPermissionDTO.url;
	public readonly method = METHOD.GET;

	public paramsDTO: undefined;
	public queryDTO: undefined;
	public bodyDTO: any;

	constructor() {
		super();
	}
}

export class ExampleAddSessionLocalFlowDTO extends DTO {
	public static url = "add-flow-session";

	public readonly responseDTOClass = ExampleSessionResponseDTO;
	public readonly url: string = ExampleAddSessionLocalFlowDTO.url;
	public readonly method = METHOD.GET;

	public paramsDTO: undefined;
	public queryDTO: undefined;
	public bodyDTO: any;

	constructor() {
		super();
	}
}
