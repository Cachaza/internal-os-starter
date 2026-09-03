import { and, asc, eq, lte, sql } from "drizzle-orm";

import { db } from "./index";
import { type Job, job } from "./schema/jobs";

const JOB_NOTIFICATION_CHANNEL = "job_available";

export type EnqueueJobInput = {
	type: string;
	payload: unknown;
	runAt?: Date;
};

export async function enqueueJob(input: EnqueueJobInput): Promise<Job> {
	const created = await db.transaction(async (transaction) => {
		const [inserted] = await transaction
			.insert(job)
			.values({ type: input.type, payload: input.payload, runAt: input.runAt })
			.returning();

		if (!inserted) {
			throw new Error("The database did not return the enqueued job");
		}

		// PostgreSQL delivers NOTIFY only after this transaction commits, so a
		// woken worker can always observe the durable row.
		await transaction.execute(
			sql`select pg_notify(${JOB_NOTIFICATION_CHANNEL}, ${inserted.id})`,
		);

		return inserted;
	});

	if (!created) {
		throw new Error("The database did not return the enqueued job");
	}

	return created;
}

export async function getNextPendingJobRunAt(): Promise<Date | null> {
	const [next] = await db
		.select({ runAt: job.runAt })
		.from(job)
		.where(eq(job.status, "pending"))
		.orderBy(asc(job.runAt), asc(job.createdAt))
		.limit(1);

	return next?.runAt ?? null;
}

export type JobNotificationSubscription = {
	close: () => Promise<void>;
};

export async function subscribeToJobNotifications(
	onNotification: () => void,
	onError: (error: Error) => void,
): Promise<JobNotificationSubscription> {
	const client = await db.$client.connect();
	let closed = false;

	const handleNotification = (notification: { channel: string }) => {
		if (notification.channel === JOB_NOTIFICATION_CHANNEL) onNotification();
	};
	const handleError = (error: Error) => {
		if (!closed) onError(error);
	};

	client.on("notification", handleNotification);
	client.on("error", handleError);
	try {
		await client.query(`LISTEN ${JOB_NOTIFICATION_CHANNEL}`);
	} catch (error) {
		client.off("notification", handleNotification);
		client.off("error", handleError);
		client.release(true);
		throw error;
	}

	return {
		close: async () => {
			if (closed) return;
			closed = true;
			client.off("notification", handleNotification);
			client.off("error", handleError);
			try {
				await client.query(`UNLISTEN ${JOB_NOTIFICATION_CHANNEL}`);
			} finally {
				client.release();
			}
		},
	};
}

export async function claimNextRunnableJob(): Promise<Job | null> {
	return db.transaction(async (transaction) => {
		const [next] = await transaction
			.select({ id: job.id })
			.from(job)
			.where(and(eq(job.status, "pending"), lte(job.runAt, new Date())))
			.orderBy(asc(job.runAt), asc(job.createdAt))
			.limit(1)
			.for("update", { skipLocked: true });

		if (!next) return null;

		const [claimed] = await transaction
			.update(job)
			.set({
				status: "processing",
				lockedAt: new Date(),
				attemptCount: sql`${job.attemptCount} + 1`,
			})
			.where(and(eq(job.id, next.id), eq(job.status, "pending")))
			.returning();

		return claimed ?? null;
	});
}

export async function markJobCompleted(id: string): Promise<void> {
	await db
		.update(job)
		.set({
			status: "completed",
			completedAt: new Date(),
			lockedAt: null,
			lastError: null,
		})
		.where(sql`${job.id} = ${id} AND ${job.status} = 'processing'`);
}

export async function markJobFailed(
	id: string,
	error: unknown,
	maxAttempts: number,
): Promise<void> {
	if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
		throw new Error(
			`maxAttempts must be a positive integer; received ${maxAttempts}`,
		);
	}

	const message = error instanceof Error ? error.message : String(error);

	await db
		.update(job)
		.set({
			status: sql`CASE WHEN ${job.attemptCount} < ${maxAttempts} THEN 'pending'::job_status ELSE 'failed'::job_status END`,
			runAt: new Date(),
			lockedAt: null,
			lastError: message,
			completedAt: null,
		})
		.where(sql`${job.id} = ${id} AND ${job.status} = 'processing'`);
}
