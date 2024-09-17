import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { UserRepository } from "../database-access-operations/user/user.repository";
import { BadRequestException, Injectable } from "@nestjs/common";
import { GetUserListQueryDTO, GetUserListResponseDTO, UserItemDTO } from "src/shared/dto/user/get-user-list.dto";
import { plainToInstance } from "class-transformer";
import { GetProfileParamDTO, GetProfileResponseDTO } from "src/shared/dto/user/get-profile.dto";
import {
	UpdateProfileBodyDTO,
	UpdateProfileParamDTO,
	UpdateProfileResponseDTO,
} from "src/shared/dto/user/update-profile.dto";
import { RemoveUserParamDTO, RemoveUserResponseDTO } from "src/shared/dto/user/remove-user.dto";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";

@Injectable()
export class UserService {
	protected logger!: ContextLogger;

	constructor(
		protected loggerService: LoggerService,
		private readonly userRepository: UserRepository,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async getUserList(query: GetUserListQueryDTO): Promise<GetUserListResponseDTO> {
		const userList = await this.userRepository.sqlFind(undefined, {
			where: {
				email: query.email,
			},
		});

		throw new BadRequestException(SYSTEM_CODE.ACCOUNT_INVALID);

		const userItemDTO = plainToInstance(UserItemDTO, userList);
		const result = new GetUserListResponseDTO(
			userItemDTO,
			query.page as number,
			userList.length,
			query.pageSize as number,
		);

		return result;
	}

	public async getProfile(params: GetProfileParamDTO): Promise<GetProfileResponseDTO> {
		const user = await this.userRepository.sqlFindOne(undefined, {
			where: {
				id: params.id,
			},
		});

		const result = plainToInstance(GetProfileResponseDTO, user);

		return result;
	}

	public async updateProfile(
		params: UpdateProfileParamDTO,
		body: UpdateProfileBodyDTO,
	): Promise<UpdateProfileResponseDTO> {
		const effectdRows = await this.userRepository.sqlUpdate(
			undefined,
			{
				where: {
					id: params.id,
				},
			},
			body,
		);

		const result = plainToInstance(UpdateProfileResponseDTO, effectdRows);

		return result;
	}

	public async removeUser(params: RemoveUserParamDTO): Promise<RemoveUserResponseDTO> {
		const effectdRows = await this.userRepository.sqlSoftDelete(undefined, {
			where: {
				id: params.id,
			},
		});

		const result = plainToInstance(RemoveUserResponseDTO, effectdRows);

		return result;
	}
}
