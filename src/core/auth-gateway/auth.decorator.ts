import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ClassConstructor } from "class-transformer";
import { JWTGatewayPayload } from "src/shared/business/auth/auth.payload";
import { BaseJwtSession } from "src/shared/business/auth/jwt-session.payload";
import { throws } from "../utils/throw";
import { validateSession } from "./auth.guard";

export const JWTContent = createParamDecorator((_: undefined, context: ExecutionContext): JWTGatewayPayload => {
	const req: { user: JWTGatewayPayload } = context.switchToHttp().getRequest();
	if (!req.user) {
		throw new UnauthorizedException();
	}
	return req.user ? req.user : throws(new UnauthorizedException());
});

export const JWTSession = createParamDecorator(
	(
		sessionTypes: ClassConstructor<BaseJwtSession> | Array<ClassConstructor<BaseJwtSession>>,
		context: ExecutionContext,
	): BaseJwtSession => {
		const req: { session: BaseJwtSession } = context.switchToHttp().getRequest();
		return validateSession(req.session, sessionTypes);
	},
);
