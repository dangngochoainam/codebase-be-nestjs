import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { ISqlLoggerPayload, SQL_LOGGER_TYPE } from "../../core/logger/sql-logger.payload";

@Entity("log")
export class LogEntity implements ISqlLoggerPayload {
	@PrimaryGeneratedColumn()
	public id!: string;

	@Column()
	public timestamp: Date = new Date();

	@Column({ name: "instance_id" })
	public instanceId!: string;

	@Column()
	public name?: string;

	@Column({ type: "text" })
	public context?: string;

	@Column()
	public type!: SQL_LOGGER_TYPE;

	@Column({ name: "trace_id" })
	public traceId?: string;

	@Column({ type: "text" })
	public message!: string;
}
