import { Injectable } from "@nestjs/common";
import { BinaryToTextEncoding, createHash } from "crypto";
import { ContextLogger, LoggerService } from "../logger/logger.service";

@Injectable()
export class CryptoService {
	protected logger!: ContextLogger;
	public constructor(protected loggerService: LoggerService) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public hashingSHA256 = (content: string, encoding: BinaryToTextEncoding = "base64"): string => {
		return createHash("sha256").update(content).digest(encoding);
	};
}
