import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { CommonAbstractSQLService } from "src/db-example/sql-service/common-abstract-sql-service";
import { CONNECTION_NAME } from "src/db-example/typeorm.module";
import { EntityManager } from "typeorm";
import { Engineer } from "../../../db-example/entity/engineer.entity";

@Injectable()
export class EngineerRepository extends CommonAbstractSQLService<Engineer> {
	public constructor(@InjectEntityManager(CONNECTION_NAME) public readonly defaultManager: EntityManager) {
		super(defaultManager, Engineer);
	}
}
