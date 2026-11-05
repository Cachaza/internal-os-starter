import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { auth } from "@internal-os/auth";
import { db } from "@internal-os/db";
import { enqueueJob } from "@internal-os/db/jobs";
import { member, organization, user } from "@internal-os/db/schema/auth";
import { job } from "@internal-os/db/schema/jobs";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { appRouter } from "./routers/index.ts";

const suffix = crypto.randomUUID();
const email = `${suffix}@example.com`;
const password = crypto.randomUUID();
const organizations: string[] = [];
const jobs: string[] = [];
let userId: string | undefined;
const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
async function request(path: string, body: object, cookie = "") {
	const response = await auth.handler(
		new Request(`${origin}/api/auth/${path}`, {
			method: "POST",
			headers: { "content-type": "application/json", origin, cookie },
			body: JSON.stringify(body),
		}),
	);
	const data = await response.json();
	assert.equal(response.status, 200, JSON.stringify(data));
	return {
		data,
		cookie: response.headers
			.getSetCookie()
			.map((value) => value.split(";")[0])
			.join("; "),
	};
}
async function caller(cookie: string) {
	return appRouter.createCaller({
		auth: null,
		session: await auth.api.getSession({ headers: new Headers({ cookie }) }),
	});
}
after(async () => {
	if (jobs.length) await db.delete(job).where(inArray(job.id, jobs));
	if (userId) await db.delete(member).where(eq(member.userId, userId));
	if (organizations.length)
		await db
			.delete(organization)
			.where(inArray(organization.id, organizations));
	if (userId) await db.delete(user).where(eq(user.id, userId));
	await db.$client.end();
});

test("returning members can select an organization; API enforces membership and job ownership", async () => {
	const signup = await request("sign-up/email", {
		email,
		password,
		name: "Starter test",
	});
	userId = z.object({ user: z.object({ id: z.string() }) }).parse(signup.data)
		.user.id;
	const created = await request(
		"organization/create",
		{ name: "Test organization", slug: `test-${suffix}` },
		signup.cookie,
	);
	const organizationId = z.object({ id: z.string() }).parse(created.data).id;
	organizations.push(organizationId);
	await request("sign-out", {}, signup.cookie);
	const signin = await request("sign-in/email", { email, password });
	const headers = new Headers({ cookie: signin.cookie });
	const available = await auth.api.listOrganizations({ headers });
	assert.ok(available.some((org) => org.id === organizationId));
	const noActiveCaller = await caller(signin.cookie);
	await assert.rejects(noActiveCaller.organizationContext(), {
		code: "FORBIDDEN",
	});
	await assert.rejects(noActiveCaller.enqueueSystemTest({ message: "test" }), {
		code: "FORBIDDEN",
	});
	const foreignOrganizationId = crypto.randomUUID();
	await db.insert(organization).values({
		id: foreignOrganizationId,
		name: "Other organization",
		slug: foreignOrganizationId,
		createdAt: new Date(),
	});
	organizations.push(foreignOrganizationId);
	await assert.rejects(
		auth.api.setActiveOrganization({
			headers,
			body: { organizationId: foreignOrganizationId },
		}),
	);
	const activated = await request(
		"organization/set-active",
		{ organizationId },
		signin.cookie,
	);
	// setActive updates both the database session and session cookies.
	const activeCookie = activated.cookie || signin.cookie;
	const activeCaller = await caller(activeCookie);
	assert.equal((await activeCaller.organizationContext()).id, organizationId);
	const queued = await activeCaller.enqueueSystemTest({ message: "test" });
	jobs.push(queued.id);
	assert.equal(
		(await activeCaller.systemTestJob({ id: queued.id })).status,
		"pending",
	);
	// Use the actual one-shot worker with the documented example configuration.
	await promisify(execFile)(process.execPath, ["src/index.ts", "--once"], {
		cwd: fileURLToPath(new URL("../../../apps/worker/", import.meta.url)),
		env: {
			...process.env,
			JOB_LEASE_MS: "60000",
			JOB_RECONCILE_INTERVAL_MS: "30000",
			JOB_MAX_ATTEMPTS: "3",
		},
	});
	assert.equal(
		(await activeCaller.systemTestJob({ id: queued.id })).status,
		"completed",
	);
	const foreign = await enqueueJob({
		type: "system.test",
		payload: { organizationId: crypto.randomUUID() },
	});
	const otherType = await enqueueJob({
		type: "private.handler",
		payload: { organizationId },
	});
	jobs.push(foreign.id, otherType.id);
	await assert.rejects(activeCaller.systemTestJob({ id: foreign.id }), {
		code: "NOT_FOUND",
	});
	await assert.rejects(activeCaller.systemTestJob({ id: otherType.id }), {
		code: "NOT_FOUND",
	});
	// Revoked membership must invalidate existing sessions, not just future logins.
	await db.delete(member).where(eq(member.userId, userId));
	await assert.rejects(activeCaller.organizationContext(), {
		code: "FORBIDDEN",
	});
	await assert.rejects(activeCaller.enqueueSystemTest({ message: "test" }), {
		code: "FORBIDDEN",
	});
	await assert.rejects(activeCaller.systemTestJob({ id: queued.id }), {
		code: "FORBIDDEN",
	});
	const anonymous = appRouter.createCaller({ auth: null, session: null });
	await assert.rejects(anonymous.enqueueSystemTest({ message: "test" }), {
		code: "UNAUTHORIZED",
	});
});
