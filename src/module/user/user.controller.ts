import { Body, Controller, Delete, Get, Param, Put, Query } from "@nestjs/common";
import { GetProfileDTO, GetProfileParamDTO, GetProfileResponseDTO } from "src/shared/dto/user/get-profile.dto";
import { GetUserListDTO, GetUserListQueryDTO, GetUserListResponseDTO } from "src/shared/dto/user/get-user-list.dto";
import {
	UpdateProfileBodyDTO,
	UpdateProfileDTO,
	UpdateProfileParamDTO,
	UpdateProfileResponseDTO,
} from "src/shared/dto/user/update-profile.dto";
import { UserService } from "./user.service";
import { RemoveUserDTO, RemoveUserParamDTO, RemoveUserResponseDTO } from "src/shared/dto/user/remove-user.dto";

@Controller()
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get(GetUserListDTO.url)
	public async getListUser(@Query() query: GetUserListQueryDTO): Promise<GetUserListResponseDTO> {
		return this.userService.getUserList(query);
	}

	@Get(GetProfileDTO.url)
	public async getProfile(@Param() params: GetProfileParamDTO): Promise<GetProfileResponseDTO> {
		return this.userService.getProfile(params);
	}

	@Put(UpdateProfileDTO.url)
	public async updateProfile(
		@Param() params: UpdateProfileParamDTO,
		@Body() body: UpdateProfileBodyDTO,
	): Promise<UpdateProfileResponseDTO> {
		return this.userService.updateProfile(params, body);
	}

	@Delete(RemoveUserDTO.url)
	public async removeUser(@Param() params: RemoveUserParamDTO): Promise<RemoveUserResponseDTO> {
		return this.userService.removeUser(params);
	}
}
