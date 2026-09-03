"use client";

import { Button } from "@internal-os/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Database, PanelsTopLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { trpc } from "@/utils/trpc";

export default function Home() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());

	return (
		<main className="relative min-h-0 overflow-auto bg-background">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-muted),transparent_38%)]" />
			<div className="relative mx-auto grid min-h-full max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
				<section>
					<div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-muted-foreground text-xs">
						<span className="size-1.5 rounded-full bg-emerald-500" />
						Starter operativo
					</div>
					<p className="mb-3 font-medium text-primary text-sm uppercase tracking-[0.18em]">
						Internal OS
					</p>
					<h1 className="max-w-3xl text-balance font-semibold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
						Una base sólida para tu próxima herramienta interna.
					</h1>
					<p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground leading-relaxed">
						Autenticación, organizaciones, API tipada, PostgreSQL y trabajo en
						segundo plano, listos para incorporar el dominio de tu producto.
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						<Button
							nativeButton={false}
							size="lg"
							render={<Link href="/dashboard" />}
						>
							Entrar al backoffice
							<ArrowRight data-icon="inline-end" />
						</Button>
						<Button
							nativeButton={false}
							size="lg"
							variant="outline"
							render={<Link href="/login" />}
						>
							Acceder con otra cuenta
						</Button>
					</div>
				</section>

				<aside className="rounded-2xl border bg-card/90 p-3 shadow-foreground/5 shadow-xl backdrop-blur">
					<div className="rounded-xl border bg-muted/30 p-6">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="font-semibold">Base del sistema</p>
								<p className="mt-1 text-muted-foreground text-sm">
									Servicios preparados para el trabajo interno.
								</p>
							</div>
							<PanelsTopLeft className="size-6 text-primary" />
						</div>
						<div className="mt-7 grid gap-3">
							<div className="flex items-center gap-3 rounded-lg border bg-background p-3">
								<ShieldCheck className="size-5 text-emerald-600" />
								<div>
									<p className="font-medium text-sm">Acceso protegido</p>
									<p className="text-muted-foreground text-xs">
										Usuarios y organizaciones
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3 rounded-lg border bg-background p-3">
								<Database className="size-5 text-sky-600" />
								<div>
									<p className="font-medium text-sm">Trabajo durable</p>
									<p className="text-muted-foreground text-xs">
										PostgreSQL y worker independiente
									</p>
								</div>
							</div>
						</div>
						<div className="mt-5 flex items-center gap-2 border-t pt-4 text-xs">
							<span
								className={`size-2 rounded-full ${healthCheck.data ? "bg-emerald-500" : healthCheck.isLoading ? "bg-amber-500" : "bg-destructive"}`}
							/>
							<span className="text-muted-foreground">
								{healthCheck.isLoading
									? "Comprobando servicios…"
									: healthCheck.data
										? "API conectada"
										: "API no disponible"}
							</span>
						</div>
					</div>
				</aside>
			</div>
		</main>
	);
}
