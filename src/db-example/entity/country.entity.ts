import { Exclude, Expose } from "class-transformer";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Exclude()
@Entity()
export class Country {
	@Expose()
	@PrimaryGeneratedColumn("increment", { name: "id" })
	public id!: number;

	@Expose()
	@Column({ name: "country_name" })
	public countryName!: string;

	@Expose()
	@Column({ name: "created", type: "timestamp without time zone" })
	public created!: Date;
}
