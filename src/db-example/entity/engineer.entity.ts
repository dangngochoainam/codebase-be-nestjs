import { Exclude, Expose } from "class-transformer";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Exclude()
@Entity()
export class Engineer {
	@Expose()
	@PrimaryGeneratedColumn("increment", { name: "id" })
	public id!: number;

	@Expose()
	@Column({ name: "first_name" })
	public firstName!: string;

	@Expose()
	@Column({ name: "last_name" })
	public lastName!: string;

	@Expose()
	@Column({ name: "gender", nullable: false })
	public gender!: number;

	@Expose()
	@Column({ name: "country_id" })
	public countryId!: number;

	@Expose()
	@Column({ name: "title" })
	public title!: string;

	@Expose()
	@Column({ name: "created", type: "timestamp without time zone" })
	public created!: Date;
}
