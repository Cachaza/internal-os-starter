import {
	claimNextRunnableJob,
	db,
	getNextPendingJobRunAt,
	type JobNotificationSubscription,
	markJobCompleted,
	markJobFailed,
	subscribeToJobNotifications,
} from "@internal-os/db";
import { z } from "zod";

const workerConfig = z
	.object({
		JOB_RECONCILE_INTERVAL_MS: z.coerce.number().int().positive(),
		JOB_MAX_ATTEMPTS: z.coerce.number().int().positive(),
	})
	.parse(process.env);

let stopping = false;
let wakeLoop: (() => void) | undefined;
let wakePending = false;

function requestShutdown(signal: NodeJS.Signals) {
	console.info(`Worker received ${signal}; finishing the current job`);
	stopping = true;
	wakeLoop?.();
}

process.once("SIGINT", requestShutdown);
process.once("SIGTERM", requestShutdown);

function wakeWorker() {
	wakePending = true;
	wakeLoop?.();
}

async function waitForWork(delayMs: number) {
	if (wakePending) {
		wakePending = false;
		return;
	}

	await new Promise<void>((resolve) => {
		const timeout = setTimeout(resolve, delayMs);
		wakeLoop = () => {
			clearTimeout(timeout);
			resolve();
		};
	});
	wakeLoop = undefined;
	wakePending = false;
}

async function executeJob(
	job: Awaited<ReturnType<typeof claimNextRunnableJob>>,
) {
	if (!job) return;

	try {
		switch (job.type) {
			case "system.test":
				console.info("system.test", job.payload);
				break;
			default:
				throw new Error(`No handler registered for job type: ${job.type}`);
		}
		await markJobCompleted(job.id);
	} catch (error) {
		console.error(`Job ${job.id} failed`, error);
		await markJobFailed(job.id, error, workerConfig.JOB_MAX_ATTEMPTS);
	}
}

async function main() {
	console.info("Internal OS worker started");
	const runOnce = process.argv.includes("--once");
	let subscription: JobNotificationSubscription | undefined;

	while (!stopping) {
		if (!subscription && !runOnce) {
			try {
				subscription = await subscribeToJobNotifications(
					wakeWorker,
					(error) => {
						console.error(
							"PostgreSQL job notification listener disconnected",
							error,
						);
						const failedSubscription = subscription;
						subscription = undefined;
						void failedSubscription?.close().catch(() => undefined);
						wakeWorker();
					},
				);
			} catch (error) {
				console.error("Worker could not listen for PostgreSQL jobs", error);
			}
		}

		try {
			let nextJob = await claimNextRunnableJob();
			while (nextJob && !stopping) {
				await executeJob(nextJob);
				nextJob = await claimNextRunnableJob();
			}
		} catch (error) {
			console.error(
				"Worker could not claim PostgreSQL jobs; it will retry",
				error,
			);
		}

		if (runOnce) break;
		if (!stopping) {
			let delayMs = workerConfig.JOB_RECONCILE_INTERVAL_MS;
			try {
				const nextRunAt = await getNextPendingJobRunAt();
				if (nextRunAt) {
					delayMs = Math.min(
						delayMs,
						Math.max(0, nextRunAt.getTime() - Date.now()),
					);
				}
			} catch (error) {
				console.error("Worker could not inspect the next scheduled job", error);
			}
			await waitForWork(delayMs);
		}
	}

	await subscription?.close();
	await db.$client.end();
	console.info("Internal OS worker stopped");
}

await main();
