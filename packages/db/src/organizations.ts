import { and, eq } from "drizzle-orm";

import { db } from "./index";
import { member } from "./schema/auth";

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
