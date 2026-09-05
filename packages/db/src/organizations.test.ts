import assert from "node:assert/strict";
import { after, test } from "node:test";

import { db } from "./index.ts";
import { findOrganizationMembership } from "./organizations.ts";
import { member, organization, user } from "./schema/auth.ts";

const suffix = crypto.randomUUID();
const userId = `test-user-${suffix}`;
const ownedOrganizationId = `test-owned-${suffix}`;
const otherOrganizationId = `test-other-${suffix}`;

after(async () => {
	await db.delete(member);
	await db.delete(organization);
	await db.delete(user);
	await db.$client.end();
});

test("membership lookup preserves the organization ownership boundary", async () => {
	await db.insert(user).values({
		id: userId,
		name: "Test user",
		email: `${userId}@example.com`,
	});
	await db.insert(organization).values([
		{
			id: ownedOrganizationId,
			name: "Owned organization",
			slug: ownedOrganizationId,
			createdAt: new Date(),
		},
		{
			id: otherOrganizationId,
			name: "Other organization",
			slug: otherOrganizationId,
			createdAt: new Date(),
		},
	]);
	await db.insert(member).values({
		id: `test-member-${suffix}`,
		organizationId: ownedOrganizationId,
		userId,
		createdAt: new Date(),
	});

	assert.ok(await findOrganizationMembership(ownedOrganizationId, userId));
	assert.equal(
		await findOrganizationMembership(otherOrganizationId, userId),
		undefined,
	);
});
