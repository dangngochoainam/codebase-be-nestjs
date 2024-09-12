import { Controller, Get, Query } from "@nestjs/common";
import { GetUserListDTO, GetUserListQueryDTO, GetUserListResponseDTO } from "src/shared/dto/user/get-user-list.dto";
import { UserService } from "./user.service";

@Controller()
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get(GetUserListDTO.url)
	public async getListUser(@Query() query: GetUserListQueryDTO): Promise<GetUserListResponseDTO> {
		return this.userService.getUserList(query);
	}
}
