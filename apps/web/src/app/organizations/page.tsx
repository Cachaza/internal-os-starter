import { auth } from "@internal-os/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CreateOrganizationForm from "@/components/create-organization-form";
import { OrganizationPicker } from "@/components/organization-picker";

export default async function OrganizationsPage() {
	const requestHeaders = await headers();
	const session = await auth.api.getSession({ headers: requestHeaders });
	if (!session?.user) redirect("/login");
	const organizations = await auth.api.listOrganizations({
		headers: requestHeaders,
	});
	return (
		<main className="mx-auto w-full max-w-2xl space-y-8 p-6">
			<h1 className="font-semibold text-3xl">Organizaciones</h1>
			{organizations.length ? (
				<>
					<OrganizationPicker organizations={organizations} />
					<details className="rounded-lg border p-4">
						<summary className="cursor-pointer font-medium">
							Crear otra organización
						</summary>
						<div className="pt-6">
							<CreateOrganizationForm />
						</div>
					</details>
				</>
			) : (
				<CreateOrganizationForm />
			)}
		</main>
	);
}
