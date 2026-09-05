import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { eq } from "drizzle-orm";

import { db } from "./index.ts";
import {
	claimNextRunnableJob,
	enqueueJob,
	markJobCompleted,
	markJobFailed,
} from "./jobs.ts";
import { job } from "./schema/jobs.ts";

const claimOptions = {
	// Tests move locked_at to the Unix epoch, so the lease is unambiguously expired.
	leaseDurationMs: 60_000,
	maxAttempts: 3,
};

beforeEach(async () => {
	await db.delete(job);
});

after(async () => {
	await db.delete(job);
	await db.$client.end();
});

test("two concurrent workers cannot claim the same job", async () => {
	const created = await enqueueJob({ type: "test.concurrent", payload: {} });
	const claims = await Promise.all([
		claimNextRunnableJob(claimOptions),
		claimNextRunnableJob(claimOptions),
	]);

	assert.equal(claims.filter(Boolean).length, 1);
	assert.equal(claims.find(Boolean)?.id, created.id);
});

test("a scheduled job is not claimed before run_at", async () => {
	// One minute keeps the job safely beyond the duration of this focused test.
	await enqueueJob({
		type: "test.scheduled",
		payload: {},
		runAt: new Date(Date.now() + 60_000),
	});

	assert.equal(await claimNextRunnableJob(claimOptions), null);
});

test("handler failures stop at the configured attempt limit", async () => {
	const options = { ...claimOptions, maxAttempts: 2 };
	const created = await enqueueJob({ type: "test.retry", payload: {} });

	const first = await claimNextRunnableJob(options);
	assert.equal(first?.id, created.id);
	assert.ok(first?.lockToken);
	await markJobFailed(
		created.id,
		first.lockToken,
		new Error("first failure"),
		options.maxAttempts,
	);

	const second = await claimNextRunnableJob(options);
	assert.equal(second?.id, created.id);
	assert.ok(second?.lockToken);
	await markJobFailed(
		created.id,
		second.lockToken,
		new Error("second failure"),
		options.maxAttempts,
	);

	const [stored] = await db.select().from(job).where(eq(job.id, created.id));
	assert.equal(stored?.status, "failed");
	assert.equal(stored?.attemptCount, 2);
	assert.equal(await claimNextRunnableJob(options), null);
});

test("an expired lease makes an interrupted job claimable", async () => {
	const created = await enqueueJob({ type: "test.recovery", payload: {} });
	await claimNextRunnableJob(claimOptions);
	await db
		.update(job)
		.set({ lockedAt: new Date(0) })
		.where(eq(job.id, created.id));

	const recovered = await claimNextRunnableJob(claimOptions);
	assert.equal(recovered?.id, created.id);
	assert.equal(recovered?.attemptCount, 2);
});

test("a recovered job rejects completion from its previous owner", async () => {
	const created = await enqueueJob({ type: "test.ownership", payload: {} });
	const previousOwner = await claimNextRunnableJob(claimOptions);
	assert.ok(previousOwner?.lockToken);
	await db
		.update(job)
		.set({ lockedAt: new Date(0) })
		.where(eq(job.id, created.id));
	const currentOwner = await claimNextRunnableJob(claimOptions);
	assert.ok(currentOwner?.lockToken);

	await markJobCompleted(created.id, previousOwner.lockToken);
	const [stored] = await db.select().from(job).where(eq(job.id, created.id));
	assert.equal(stored?.status, "processing");
	assert.equal(stored?.lockToken, currentOwner.lockToken);
});

test("an expired lease fails a job that exhausted its attempts", async () => {
	const options = { ...claimOptions, maxAttempts: 1 };
	const created = await enqueueJob({ type: "test.exhausted", payload: {} });
	await claimNextRunnableJob(options);
	await db
		.update(job)
		.set({ lockedAt: new Date(0) })
		.where(eq(job.id, created.id));

	assert.equal(await claimNextRunnableJob(options), null);
	const [stored] = await db.select().from(job).where(eq(job.id, created.id));
	assert.equal(stored?.status, "failed");
	assert.match(stored?.lastError ?? "", /1-attempt limit/);
});
