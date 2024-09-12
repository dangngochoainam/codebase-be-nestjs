import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/db-example/entity/user.entity";
import { CONNECTION_NAME } from "src/db-example/typeorm.module";
import { UserRepository } from "./user.repository";

@Module({
	imports: [TypeOrmModule.forFeature([User], CONNECTION_NAME)],
	providers: [UserRepository],
	exports: [UserRepository],
})
export class UserRepositoryModule {}
