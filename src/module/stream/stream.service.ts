import { Injectable } from "@nestjs/common";
import { ContextLogger, LoggerService } from "../../core/logger/logger.service";
import { InjectEntityManager } from "@nestjs/typeorm";
import { CONNECTION_NAME } from "../../db-example/typeorm.module";
import { EntityManager } from "typeorm";
import { ReadStream } from "typeorm/platform/PlatformTools";

@Injectable()
export class StreamService {
	protected readonly logger!: ContextLogger;

	public constructor(
		protected loggerService: LoggerService,
		@InjectEntityManager(CONNECTION_NAME)
		private entityManager: EntityManager,
	) {
		this.logger = loggerService.newContextLogger(this.constructor.name);
	}

	public async getReadStreamData(query: string): Promise<ReadStream> {
		const queryRunner = this.entityManager.connection.createQueryRunner();
		try {
			await queryRunner.startTransaction();
			const stream = await queryRunner.stream(query);
			await queryRunner.commitTransaction();
			return stream;
		} catch (error) {
			queryRunner.isTransactionActive && (await queryRunner.rollbackTransaction());
			const errMsg = (error as Error)?.message || "Unexpected error";
			this.logger.error({}, `Error when get data by stream: ${errMsg}`, undefined);
			throw new Error();
		} finally {
			await queryRunner.release();
		}
	}

	public async handleDataStream<T>(query: string, handleData: (chunk: T) => Promise<void>): Promise<void> {
		const queryRunner = this.entityManager.connection.createQueryRunner();
		// await queryRunner.startTransaction();
		const stream: ReadStream = await queryRunner.stream(query);
		this.logger.info({}, "Get stream successfully");
		try {
			stream.on("data", (chunk: T) => {
				stream.pause();
				handleData(chunk)
					.then(() => {
						stream.resume();
					})
					.catch((err) => {
						stream.emit("error", err);
					});
			});

			stream.on("close", () => {
				this.logger.info({}, "Stream data from core close event triggered");
			});

			await new Promise((rs, rj) => {
				stream.on("error", (err) => {
					stream.destroy();
					const errorMessage = err.message;
					this.logger.error({}, `Error steam data from core: ${errorMessage}`, new Error(errorMessage));
					rj(err);
				});

				stream.on("end", () => {
					this.logger.info({}, "Stream data from core end event triggered");
					rs(true);
				});
			});

			// await queryRunner.commitTransaction();
		} catch (error) {
			// queryRunner.isTransactionActive && (await queryRunner.rollbackTransaction());
			const errMsg = (error as Error)?.message || "Unexpected error";
			this.logger.error({}, `Error when get data by stream: ${errMsg}`, undefined);
			throw new Error();
		} finally {
			stream.destroy();
			await queryRunner.release();
		}
	}
}
