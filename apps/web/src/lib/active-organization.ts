import { auth } from "@internal-os/auth";
import { findOrganization, findOrganizationMembership } from "@internal-os/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Check expected missing-access states directly. Better Auth's full-org endpoint
// throws for deleted organizations and revoked memberships instead of returning null.
export async function requireActiveOrganization() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/login");
	const id = session.session.activeOrganizationId;
	if (!id) redirect("/organizations");
	const membership = await findOrganizationMembership(id, session.user.id);
	if (!membership) redirect("/organizations");
	const organization = await findOrganization(id);
	if (!organization) redirect("/organizations");
	return { organization, membership };
}
