import { Injectable } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { CommonAbstractSQLService } from "src/db-example/sql-service/common-abstract-sql-service";
import { CONNECTION_NAME } from "src/db-example/typeorm.module";
import { EntityManager } from "typeorm";
import { Country } from "../../../db-example/entity/country.entity";

@Injectable()
export class CountryRepository extends CommonAbstractSQLService<Country> {
	public constructor(@InjectEntityManager(CONNECTION_NAME) public readonly defaultManager: EntityManager) {
		super(defaultManager, Country);
	}
}
