import { Button } from "@internal-os/ui/components/button";
import Link from "next/link";
import { requireActiveOrganization } from "@/lib/active-organization";

export default async function ConfiguracionPage() {
	const { organization, membership } = await requireActiveOrganization();

	return (
		<main id="main-content" className="mx-auto w-full max-w-3xl space-y-6">
			<h1 className="font-semibold text-2xl">Configuración</h1>
			<section
				className="space-y-4 rounded-lg border p-6"
				aria-labelledby="organization-title"
			>
				<h2 id="organization-title" className="font-semibold text-xl">
					Organización activa
				</h2>
				<dl className="space-y-3">
					<div>
						<dt className="text-muted-foreground text-sm">Nombre</dt>
						<dd>{organization.name}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-sm">Identificador</dt>
						<dd>{organization.slug}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-sm">Tu rol</dt>
						<dd>{membership.role}</dd>
					</div>
				</dl>
				<Button
					nativeButton={false}
					variant="outline"
					render={<Link href="/organizations" />}
				>
					Cambiar de organización
				</Button>
			</section>
		</main>
	);
}
