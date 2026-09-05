import { and, asc, eq, lt, lte, or, sql } from "drizzle-orm";

import { db } from "./index.ts";
import { type Job, job } from "./schema/jobs.ts";

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

export type ClaimJobOptions = {
	leaseDurationMs: number;
	maxAttempts: number;
};

function validateClaimOptions(options: ClaimJobOptions) {
	if (
		!Number.isInteger(options.leaseDurationMs) ||
		options.leaseDurationMs < 1
	) {
		throw new Error(
			`leaseDurationMs must be a positive integer; received ${options.leaseDurationMs}. Set JOB_LEASE_MS to the maximum acceptable recovery delay after a worker stops.`,
		);
	}
	if (!Number.isInteger(options.maxAttempts) || options.maxAttempts < 1) {
		throw new Error(
			`maxAttempts must be a positive integer; received ${options.maxAttempts}. Set JOB_MAX_ATTEMPTS to at least 1.`,
		);
	}
}

export async function claimNextRunnableJob(
	options: ClaimJobOptions,
): Promise<Job | null> {
	validateClaimOptions(options);
	const now = new Date();
	const expiredBefore = new Date(now.getTime() - options.leaseDurationMs);

	return db.transaction(async (transaction) => {
		await transaction
			.update(job)
			.set({
				status: "failed",
				lockedAt: null,
				lockToken: null,
				lastError: `Worker lease expired after ${options.leaseDurationMs}ms and the job reached the ${options.maxAttempts}-attempt limit. Inspect the handler and retry the job explicitly.`,
			})
			.where(
				and(
					eq(job.status, "processing"),
					lte(job.lockedAt, expiredBefore),
					sql`${job.attemptCount} >= ${options.maxAttempts}`,
				),
			);

		const [next] = await transaction
			.select({ id: job.id })
			.from(job)
			.where(
				or(
					and(eq(job.status, "pending"), lte(job.runAt, now)),
					and(
						eq(job.status, "processing"),
						lte(job.lockedAt, expiredBefore),
						lt(job.attemptCount, options.maxAttempts),
					),
				),
			)
			.orderBy(asc(job.runAt), asc(job.createdAt))
			.limit(1)
			.for("update", { skipLocked: true });

		if (!next) return null;

		const [claimed] = await transaction
			.update(job)
			.set({
				status: "processing",
				lockedAt: new Date(),
				lockToken: crypto.randomUUID(),
				attemptCount: sql`${job.attemptCount} + 1`,
			})
			.where(eq(job.id, next.id))
			.returning();

		return claimed ?? null;
	});
}

export async function renewJobLease(
	id: string,
	lockToken: string,
): Promise<boolean> {
	const renewed = await db
		.update(job)
		.set({ lockedAt: new Date() })
		.where(
			and(
				eq(job.id, id),
				eq(job.status, "processing"),
				eq(job.lockToken, lockToken),
			),
		)
		.returning({ id: job.id });
	return renewed.length === 1;
}

export async function markJobCompleted(
	id: string,
	lockToken: string,
): Promise<void> {
	await db
		.update(job)
		.set({
			status: "completed",
			completedAt: new Date(),
			lockedAt: null,
			lockToken: null,
			lastError: null,
		})
		.where(
			and(
				eq(job.id, id),
				eq(job.status, "processing"),
				eq(job.lockToken, lockToken),
			),
		);
}

export async function markJobFailed(
	id: string,
	lockToken: string,
	error: unknown,
	maxAttempts: number,
): Promise<void> {
	if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
		throw new Error(
			`maxAttempts must be a positive integer; received ${maxAttempts}. Set JOB_MAX_ATTEMPTS to at least 1.`,
		);
	}

	const message = error instanceof Error ? error.message : String(error);

	await db
		.update(job)
		.set({
			status: sql`CASE WHEN ${job.attemptCount} < ${maxAttempts} THEN 'pending'::job_status ELSE 'failed'::job_status END`,
			runAt: new Date(),
			lockedAt: null,
			lockToken: null,
			lastError: message,
			completedAt: null,
		})
		.where(
			and(
				eq(job.id, id),
				eq(job.status, "processing"),
				eq(job.lockToken, lockToken),
			),
		);
}
