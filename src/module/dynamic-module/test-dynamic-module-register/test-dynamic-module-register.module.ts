import { Module } from "@nestjs/common";
import { TestDynamicModule } from "../dynamic.module";
import { TestDynamicRegisterController } from "./test-dynamic-module-register.controller";

@Module({
	imports: [TestDynamicModule.register({ description: "import test dynamic module register at B" })],
	controllers: [TestDynamicRegisterController],
})
export class TestDynamicRegisterModule {}
