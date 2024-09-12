import { Exclude, Expose, Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";
export function ExampleDBEnvironmentClass<K extends ConstructorFunction<any>>(TargetClass: K) {
	@Exclude()
	class ExampleEnvironment extends TargetClass {
		@Expose()
		@IsString()
		public DB_EXAMPLE_HOST!: string;

		@Expose()
		@IsNumber()
		@Type(() => Number)
		public DB_EXAMPLE_PORT!: number;

		@Expose()
		@IsString()
		public DB_EXAMPLE_USERNAME!: string;

		@Expose()
		@IsString()
		// @Transform(({ value, obj }) => decryptEnvValueByAES(value, obj.PASSWORD_ENCRYPTION_KEY))
		public DB_EXAMPLE_PASSWORD!: string;

		@Expose()
		@IsString()
		public DB_EXAMPLE_DATABASE!: string;

		@Expose()
		@IsString()
		public DB_EXAMPLE_SCHEMA!: string;
	}
	return ExampleEnvironment;
}
