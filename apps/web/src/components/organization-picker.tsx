"use client";
import { Button } from "@internal-os/ui/components/button";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function OrganizationPicker({
	organizations,
}: {
	organizations: { id: string; name: string; slug: string }[];
}) {
	const [pending, setPending] = useState<string | null>(null);
	const [error, setError] = useState("");
	async function select(organizationId: string) {
		setPending(organizationId);
		setError("");
		try {
			const result = await authClient.organization.setActive({
				organizationId,
			});
			if (result.error)
				throw new Error(
					"No se pudo abrir la organización. Comprueba tu acceso e inténtalo de nuevo.",
				);
			// A full navigation discards queries and server components from the previous organization.
			window.location.assign("/dashboard");
		} catch {
			setError(
				"No se pudo abrir la organización. Comprueba tu acceso e inténtalo de nuevo.",
			);
			setPending(null);
		}
	}
	return (
		<section aria-labelledby="organization-picker-title" className="space-y-4">
			<h2 id="organization-picker-title" className="font-semibold text-2xl">
				Elige una organización
			</h2>
			<ul className="space-y-3">
				{organizations.map((org) => (
					<li
						key={org.id}
						className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
					>
						<div>
							<p className="font-medium">{org.name}</p>
							<p className="text-muted-foreground text-sm">{org.slug}</p>
						</div>
						<Button
							disabled={pending !== null}
							onClick={() => void select(org.id)}
							aria-label={`Abrir ${org.name}`}
						>
							{pending === org.id ? "Abriendo…" : "Abrir organización"}
						</Button>
					</li>
				))}
			</ul>
			{error && (
				<p role="alert" className="text-destructive text-sm">
					{error}
				</p>
			)}
		</section>
	);
}
