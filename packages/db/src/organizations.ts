import { and, eq } from "drizzle-orm";

import { db } from "./index.ts";
import { member } from "./schema/auth.ts";

export function findOrganizationMembership(
	organizationId: string,
	userId: string,
) {
	return db.query.member.findFirst({
		where: and(
			eq(member.organizationId, organizationId),
			eq(member.userId, userId),
		),
	});
}

export function findOrganization(id: string) {
	return db.query.organization.findFirst({
		where: (organization, { eq }) => eq(organization.id, id),
	});
}
