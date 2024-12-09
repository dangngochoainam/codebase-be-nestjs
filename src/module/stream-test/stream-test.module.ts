import { Module } from "@nestjs/common";
import { CountryRepositoryModule } from "../database-access-operations/country/country.repository.module";
import { EngineerRepositoryModule } from "../database-access-operations/engineer/engineer.repository.module";
import { StreamTestService } from "./stream-test.service";
import { StreamTestController } from "./stream-test.controller";
import { StreamModule } from "../stream/stream.module";

@Module({
	imports: [CountryRepositoryModule, EngineerRepositoryModule, StreamModule],
	providers: [StreamTestService],
	exports: [StreamTestService],
	controllers: [StreamTestController],
})
export class StreamTestModule {}
