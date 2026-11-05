"use client";
import { Button } from "@internal-os/ui/components/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { trpc } from "@/utils/trpc";

const jobLabels = {
	pending: "Pendiente",
	processing: "En proceso",
	completed: "Completado",
	failed: "Fallido",
};
export default function Dashboard() {
	const context = useQuery(trpc.organizationContext.queryOptions());
	const [jobId, setJobId] = useState<string | null>(null);
	const systemTest = useMutation(
		trpc.enqueueSystemTest.mutationOptions({
			onSuccess: (job) => setJobId(job.id),
		}),
	);
	const job = useQuery({
		...trpc.systemTestJob.queryOptions({ id: jobId ?? "" }),
		enabled: Boolean(jobId),
	});
	return (
		<main id="main-content" className="mx-auto w-full max-w-4xl space-y-8">
			<header>
				<h1 className="font-semibold text-3xl">Resumen</h1>
				<p className="mt-2 text-muted-foreground">
					Comprueba el acceso y el procesamiento de trabajos de tu organización.
				</p>
			</header>
			<section
				aria-labelledby="access-title"
				className="space-y-3 rounded-lg border p-6"
			>
				<h2 id="access-title" className="font-semibold text-xl">
					Acceso a la organización
				</h2>
				{context.isPending ? (
					<p role="status">Comprobando acceso…</p>
				) : context.isError ? (
					<div role="alert">
						<p>No se pudo comprobar el acceso. {context.error.message}</p>
						<Button variant="outline" onClick={() => void context.refetch()}>
							Reintentar
						</Button>
					</div>
				) : (
					<p>
						API conectada · {context.data.name} · {context.data.role}
					</p>
				)}
			</section>
			<section
				aria-labelledby="system-test-title"
				className="space-y-4 rounded-lg border p-6"
			>
				<h2 id="system-test-title" className="font-semibold text-xl">
					Comprobación del sistema
				</h2>
				<p className="text-muted-foreground text-sm">
					Encola una prueba y comprueba que el worker la completa. Esta prueba
					no modifica datos del producto.
				</p>
				<Button
					disabled={systemTest.isPending}
					onClick={() =>
						systemTest.mutate({ message: "Prueba desde el backoffice" })
					}
				>
					{systemTest.isPending ? "Encolando…" : "Encolar prueba"}
				</Button>
				{systemTest.isError && (
					<p role="alert" className="text-destructive">
						No se pudo encolar la prueba. {systemTest.error.message} Vuelve a
						intentarlo.
					</p>
				)}
				<div role="status" className="space-y-2 break-words text-sm">
					{jobId && <p>Trabajo: {jobId}</p>}
					{job.isFetching && <p>Comprobando estado…</p>}
					{job.data && (
						<>
							<p>
								Estado: {jobLabels[job.data.status]} · Intentos:{" "}
								{job.data.attemptCount}
							</p>
							{job.data.status === "pending" && (
								<p>
									Si sigue pendiente, comprueba que el worker está en ejecución.
								</p>
							)}
							{job.data.status === "completed" && (
								<p>Prueba completada por el worker.</p>
							)}
							{job.data.status === "failed" && (
								<p className="text-destructive">
									{job.data.lastError ||
										"El worker no pudo completar la prueba."}
								</p>
							)}
						</>
					)}
				</div>
				{job.isError && (
					<p role="alert" className="text-destructive text-sm">
						No se pudo consultar el trabajo. {job.error.message}
					</p>
				)}
				{jobId && (
					<Button
						variant="outline"
						disabled={job.isFetching}
						onClick={() => void job.refetch()}
					>
						Comprobar estado
					</Button>
				)}
			</section>
		</main>
	);
}
