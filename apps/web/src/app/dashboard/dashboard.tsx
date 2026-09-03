"use client";
import { Button } from "@internal-os/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@internal-os/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, Database, ServerCog, ShieldCheck } from "lucide-react";

import { trpc } from "@/utils/trpc";

export default function Dashboard() {
	const privateData = useQuery(trpc.privateData.queryOptions());
	const systemTest = useMutation(trpc.enqueueSystemTest.mutationOptions());

	return (
		<div className="mx-auto w-full max-w-7xl space-y-6">
			<div>
				<p className="font-medium text-primary text-xs uppercase tracking-[0.16em]">
					Centro de operaciones
				</p>
				<h1 className="mt-2 font-semibold text-3xl tracking-tight">Resumen</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Estado de la infraestructura disponible para el backoffice.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatusCard
					icon={Activity}
					title="API privada"
					value={privateData.isPending ? "Comprobando…" : "Conectada"}
					description={privateData.data?.message ?? "Sesión autenticada"}
				/>
				<StatusCard
					icon={ShieldCheck}
					title="Acceso"
					value="Protegido"
					description="Sesión y organización activas"
				/>
				<StatusCard
					icon={Database}
					title="Persistencia"
					value="PostgreSQL"
					description="Datos y trabajos duraderos"
				/>
				<StatusCard
					icon={ServerCog}
					title="Worker"
					value="Disponible"
					description="Efectos en segundo plano"
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Comprobación del sistema</CardTitle>
					<CardDescription>
						Encola un trabajo de prueba en el worker duradero de PostgreSQL.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
					<Button
						disabled={systemTest.isPending}
						onClick={() =>
							systemTest.mutate({ message: "Enqueued from the backoffice" })
						}
					>
						{systemTest.isPending ? "Encolando…" : "Encolar prueba"}
					</Button>
					{systemTest.isSuccess && (
						<p className="text-muted-foreground text-sm">
							Trabajo encolado: {systemTest.data.id}
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

type StatusCardProps = {
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	value: string;
};

function StatusCard({
	description,
	icon: Icon,
	title,
	value,
}: StatusCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
				<CardDescription>{title}</CardDescription>
				<Icon className="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<p className="font-semibold text-2xl tracking-tight">{value}</p>
				<p className="mt-1 text-muted-foreground text-xs">{description}</p>
			</CardContent>
		</Card>
	);
}
