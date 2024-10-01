import { Module } from "@nestjs/common";
import { SignContractService } from "./sign-contract.service";
import { SignContractController } from "./sign-contract.controller";
import { AuthGatewayModule } from "src/core/auth-gateway/auth-gateway.module";

@Module({
	imports: [AuthGatewayModule],
	exports: [SignContractService],
	providers: [SignContractService],
	controllers: [SignContractController],
})
export class SignContractModule {}
