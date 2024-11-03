import { Module } from "@nestjs/common";
import { FetchModule } from "src/fetch/fetch.module";
import { FetchTestController } from "./fetch-test.controller";
import { FetchTestService } from "./fetch-test.service";

@Module({
	imports: [
		FetchModule.register({
			useFactory: () => {
				return {
					hostname: "http://localhost:9009/api/v1",
				};
			},
		}),
	],
	providers: [FetchTestService],
	controllers: [FetchTestController],
	exports: [FetchTestService],
})
export class FetchTestModule {}
