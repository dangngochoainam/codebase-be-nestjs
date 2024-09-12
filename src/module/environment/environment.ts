import { ValueProvider } from "@nestjs/common";
import { Exclude } from "class-transformer";
import { CoreEnvironment, CoreEnvironmentService } from "src/core/environment/environment.service";
import { ExampleDBEnvironmentClass } from "src/db-example/environment";

@Exclude()
export class ExampleEnvironment extends ExampleDBEnvironmentClass(CoreEnvironment) {
	// add environment of servier at here
}

export class ExampleEnvironmentService extends CoreEnvironmentService<ExampleEnvironment> {}
export const RepaymentEnvironmentProvider: ValueProvider<ExampleEnvironmentService> = {
	provide: ExampleEnvironmentService,
	useValue: new ExampleEnvironmentService(ExampleEnvironment),
};
