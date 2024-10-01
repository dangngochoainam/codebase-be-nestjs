import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { CoreEnvironment, CoreEnvironmentService } from "src/core/environment/environment.service";

export const CoreJwtModule = JwtModule.registerAsync({
	global: true,
	useFactory: async (env: CoreEnvironmentService<CoreEnvironment>): Promise<JwtModuleOptions> => {
		return {
			secret: env.ENVIRONMENT.JWT_SECRET,
		};
	},
	inject: [CoreEnvironmentService],
});
