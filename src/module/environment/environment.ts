import { ValueProvider } from "@nestjs/common";
import { Exclude, Expose, Type } from "class-transformer";
import { CoreEnvironment, CoreEnvironmentService } from "src/core/environment/environment.service";
import { ExampleDBEnvironmentClass } from "src/db-example/environment";
import { IsNumber } from "class-validator";

@Exclude()
export class ExampleEnvironment extends ExampleDBEnvironmentClass(CoreEnvironment) {
	// add environment of servier at here

	@Expose()
	@IsNumber()
	@Type(() => Number)
	public THROTTLE_TTL!: number;

	@Expose()
	@IsNumber()
	@Type(() => Number)
	public THROTTLE_LIMIT!: number;
}

export class ExampleEnvironmentService extends CoreEnvironmentService<ExampleEnvironment> {}

export const RepaymentEnvironmentProvider: ValueProvider<ExampleEnvironmentService> = {
	provide: ExampleEnvironmentService,
	useValue: new ExampleEnvironmentService(ExampleEnvironment),
};
