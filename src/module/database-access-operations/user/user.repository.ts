import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { User } from "src/db-example/entity/user.entity";
import { CommonAbstractSQLService } from "src/db-example/sql-service/common-abstract-sql-service";
import { CONNECTION_NAME } from "src/db-example/typeorm.module";
import { EntityManager } from "typeorm";

@Injectable()
export class UserRepository extends CommonAbstractSQLService<User> {
	public constructor(@InjectEntityManager(CONNECTION_NAME) public readonly defaultManager: EntityManager) {
		super(defaultManager, User);
	}
}
