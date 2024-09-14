import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { User } from "src/db-example/entity/user.entity";
import { CommonAbstractSQLService } from "src/db-example/sql-service/common-abstract-sql-service";
import { CONNECTION_NAME } from "src/db-example/typeorm.module";
import { EntityManager, FindManyOptions } from "typeorm";

@Injectable()
export class UserRepository extends CommonAbstractSQLService<User> {
	public constructor(@InjectEntityManager(CONNECTION_NAME) public readonly defaultManager: EntityManager) {
		super(defaultManager, User);
	}

	public async sqlSoftDelete2(
		rootManager: EntityManager = this.entityManager,
		findCondition: FindManyOptions<User>,
	): Promise<number> {
		return await this.mergeTransaction(rootManager, async (manager) => {
			const updateResult = await manager
				.getRepository(User)
				.createQueryBuilder()
				.softDelete()
				.where({ ...findCondition.where })
				.execute();
			return updateResult.affected ?? 0;
		});
	}
}
