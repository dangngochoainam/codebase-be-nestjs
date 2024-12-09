import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CONNECTION_NAME } from "src/db-example/typeorm.module";
import { EngineerRepository } from "./engineer.repository";
import { Engineer } from "../../../db-example/entity/engineer.entity";

@Module({
	imports: [TypeOrmModule.forFeature([Engineer], CONNECTION_NAME)],
	providers: [EngineerRepository],
	exports: [EngineerRepository],
})
export class EngineerRepositoryModule {}
