import { Injectable, Logger, ValueProvider } from "@nestjs/common";
import { Exclude, Expose, plainToClass, Transform, Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsString, validateSync } from "class-validator";
import { createWriteStream } from "fs";
import { stringToBoolean } from "src/shared/utils/class-transformer";
import dotenv from "dotenv";
dotenv.config();

@Exclude()
export class CoreEnvironment {
	@Expose()
	@IsString()
	@Type(() => String)
	public NODE_ENV: string = "dev";

	@Expose()
	@IsString()
	@Type(() => String)
	public INSTANCE_ID: string = "unset instanceId";

	@Expose()
	@IsNumber()
	@Type(() => Number)
	@IsNotEmpty()
	public PORT!: number;

	@Expose()
	@IsBoolean()
	@Transform(({ value }) => stringToBoolean(value))
	@IsNotEmpty()
	public LOG_DEBUG_MODE: boolean = false;

	@Expose()
	@IsString()
	@Type(() => String)
	@IsNotEmpty()
	public DB_LOG_HOST!: string;

	@Expose()
	@IsNumber()
	@Type(() => Number)
	@IsNotEmpty()
	public DB_LOG_PORT!: number;

	@Expose()
	@IsString()
	@Type(() => String)
	@IsNotEmpty()
	public DB_LOG_DATABASE!: string;

	@Expose()
	@IsString()
	@Type(() => String)
	@IsNotEmpty()
	public DB_LOG_SCHEMA!: string;

	@Expose()
	@IsString()
	@Type(() => String)
	@IsNotEmpty()
	public DB_LOG_USERNAME!: string;

	@Expose()
	@IsString()
	@Type(() => String)
	@IsNotEmpty()
	public DB_LOG_PASSWORD!: string;
}

@Injectable()
export class CoreEnvironmentService<T extends CoreEnvironment> {
	protected logger = new Logger(this.constructor.name);

	public ENVIRONMENT: T;

	constructor(envClass: ConstructorFunction<T>) {
		this.ENVIRONMENT = plainToClass(
			envClass,
			{
				...new envClass(), // Include default value
				...process.env, // ENV override
			},
			{
				excludeExtraneousValues: true,
			},
		);

		const errors = validateSync(this.ENVIRONMENT, { skipMissingProperties: false });

		if (errors.length > 0) {
			this.logger.log(this.ENVIRONMENT);
			throw errors;
		}

		// Output environment template
		if (this.ENVIRONMENT.NODE_ENV !== "production") {
			const content = createWriteStream("./env-template.sh");
			Object.entries(this.ENVIRONMENT).forEach((entry) => content.write(`export ${entry[0]}=${entry[1]} \n`));
			content.close();
		}
	}
}

export const CoreEnvironmentProvider: ValueProvider<CoreEnvironmentService<CoreEnvironment>> = {
	provide: CoreEnvironmentService,
	useValue: new CoreEnvironmentService(CoreEnvironment),
};
