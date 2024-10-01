import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
	SetMetadata,
	UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { concatMap, from, Observable } from "rxjs";
import { FLOW_PERMISSION, FLOW_TYPE } from "src/shared/business/auth/flow-session.payload";
import { BaseJwtSession, SESSION_PERMISSION } from "src/shared/business/auth/jwt-session.payload";
import { ContextLogger, LoggerService } from "../logger/logger.service";
import { AuthSessionService } from "../auth-gateway/auth-session.service";
import { SYSTEM_CODE } from "src/shared/dto/code/system-code";
import { ResponseDTO } from "src/shared/dto/base.dto";

interface PermissionMetadata {
	providePermissions?: SESSION_PERMISSION[];
	requiredPermissions?: SESSION_PERMISSION[];
}

interface FlowPermissionMetadata {
	flow: FLOW_TYPE;
	providePermissions?: FLOW_PERMISSION[];
	requiredPermissions?: FLOW_PERMISSION[];
}

const PERMISSION_METADATA_KEY = Symbol("PERMISSION");
const FLOW_PERMISSION_METADATA_KEY = Symbol("FLOW_PERMISSION");

export const PermissionGuard = (meta: PermissionMetadata) => SetMetadata(PERMISSION_METADATA_KEY, meta);
export const FlowPermissionGuard = (meta: FlowPermissionMetadata) => SetMetadata(FLOW_PERMISSION_METADATA_KEY, meta);

@Injectable()
export class PermissionInterceptor implements NestInterceptor {
	protected logger!: ContextLogger;

	constructor(
		protected readonly reflector: Reflector,
		protected readonly loggerService: LoggerService,
		protected readonly authSessionService: AuthSessionService,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
		const permissionMetadata: PermissionMetadata =
			this.reflector.get(PERMISSION_METADATA_KEY, context.getClass()) ||
			this.reflector.get(PERMISSION_METADATA_KEY, context.getHandler());
		const flowPermissionMetadata: FlowPermissionMetadata =
			this.reflector.get(FLOW_PERMISSION_METADATA_KEY, context.getClass()) ||
			this.reflector.get(FLOW_PERMISSION_METADATA_KEY, context.getHandler());
		if (!permissionMetadata && !flowPermissionMetadata) {
			return next.handle();
		}
		const request = context.switchToHttp().getRequest<Request & { session: BaseJwtSession }>();
		if (
			permissionMetadata &&
			permissionMetadata.requiredPermissions &&
			permissionMetadata.requiredPermissions.length
		) {
			permissionMetadata.requiredPermissions.forEach((p) => {
				if (!request.session.permissions.includes(p)) {
					throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
				}
			});
		}
		if (
			flowPermissionMetadata &&
			flowPermissionMetadata.requiredPermissions &&
			flowPermissionMetadata.requiredPermissions.length
		) {
			const flowSession =
				request.session.flowSessions && request.session.flowSessions[flowPermissionMetadata.flow];
			if (!flowSession) {
				throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
			}
			flowPermissionMetadata.requiredPermissions.forEach((p) => {
				if (!flowSession.permissions.includes(p)) {
					throw new UnauthorizedException(SYSTEM_CODE.UNAUTHORIZED);
				}
			});
		}
		return next.handle().pipe(
			concatMap((res: ResponseDTO<unknown>) => {
				return from(
					new Promise(async (resolve) => {
						if (res.systemCode === SYSTEM_CODE.SUCCESS) {
							if (
								permissionMetadata &&
								permissionMetadata.providePermissions &&
								permissionMetadata.providePermissions.length
							) {
								await this.authSessionService.addPermissions(
									request.session.key,
									permissionMetadata.providePermissions,
								);
							}
							if (
								flowPermissionMetadata &&
								flowPermissionMetadata.providePermissions &&
								flowPermissionMetadata.providePermissions.length
							) {
								await this.authSessionService.addFlowPermissions(
									request.session.key,
									flowPermissionMetadata.flow,
									flowPermissionMetadata.providePermissions,
								);
							}
						}
						resolve(res);
					}),
				);
			}),
		);
	}
}
