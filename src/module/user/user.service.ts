import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { UserRepository } from "../database-access-operations/user/user.repository";
import { Injectable } from "@nestjs/common";
import { GetUserListQueryDTO, GetUserListResponseDTO, UserItemDTO } from "src/shared/dto/user/get-user-list.dto";
import { plainToInstance } from "class-transformer";

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

		const userItemDTO = plainToInstance(UserItemDTO, userList);
		const result = new GetUserListResponseDTO(userItemDTO, query.page as number, userList.length, query.pageSize as number);

		return result;
	}
}
