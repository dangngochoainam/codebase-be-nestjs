import { Exclude, Expose } from "class-transformer";
import { BaseEntity } from "src/core/entity/base-entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Exclude()
@Entity()
export class User extends BaseEntity {
	@Expose()
	@PrimaryGeneratedColumn("uuid", { name: "id" })
	public id!: string;

	@Expose()
	@Column({ name: "email" })
	public email!: string;

	@Expose()
	@Column({ name: "password" })
	public password!: string;
}
