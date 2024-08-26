import { ContextLogger, LoggerService } from "src/core/logger/logger.service";
import { UserRepository } from "../database-access-operations/user/user.repository";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserService {
	protected logger!: ContextLogger;

	constructor(
		protected loggerService: LoggerService,
		private readonly userRepository: UserRepository,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async getUserList() {
		return this.userRepository.sqlFind(undefined, {});
	}
}
