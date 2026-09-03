import { auth } from "@internal-os/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import CreateOrganizationForm from "@/components/create-organization-form";

export default async function OrganizationRequiredPage() {
	const requestHeaders = await headers();
	const session = await auth.api.getSession({ headers: requestHeaders });

	if (!session?.user) redirect("/login");

	const activeOrganization = await auth.api.getFullOrganization({
		headers: requestHeaders,
	});
	if (activeOrganization) redirect("/dashboard");

	return (
		<main className="flex min-h-0 items-center justify-center overflow-auto bg-muted/20 p-6 sm:p-10">
			<section className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-foreground/5 shadow-xl sm:p-9">
				<CreateOrganizationForm />
			</section>
		</main>
	);
}
