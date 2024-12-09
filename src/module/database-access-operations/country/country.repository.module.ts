import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CONNECTION_NAME } from "src/db-example/typeorm.module";
import { CountryRepository } from "./country.repository";
import { Country } from "../../../db-example/entity/country.entity";

@Module({
	imports: [TypeOrmModule.forFeature([Country], CONNECTION_NAME)],
	providers: [CountryRepository],
	exports: [CountryRepository],
})
export class CountryRepositoryModule {}
