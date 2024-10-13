import { DynamicModule, Module } from "@nestjs/common";
import { REGISTER_OPTION_TOKEN, RegisterOption } from "./constants/constants";
import { TestDynamicController } from "./dynamic.controller";
import { TestDynamicService } from "./dynamic.service";

@Module({})
export class TestDynamicModule {
	public static register(option: RegisterOption): DynamicModule {
		return {
			module: TestDynamicModule,
			imports: [],
			providers: [
				{
					provide: REGISTER_OPTION_TOKEN,
					useValue: option,
				},
				TestDynamicService,
			],
			controllers: [TestDynamicController],
			exports: [TestDynamicService],
		};
	}
}
