"use client";

import { Button } from "@internal-os/ui/components/button";
import { Input } from "@internal-os/ui/components/input";
import { Label } from "@internal-os/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

const organizationSchema = z.object({
	name: z
		.string()
		.trim()
		.refine((name) => name.length > 0, "Escribe el nombre de la organización"),
	slug: z
		.string()
		.trim()
		.refine((slug) => slug.length > 0, "Escribe un identificador")
		.refine(
			(slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
			"Usa minúsculas, números y guiones",
		),
});

function toSlug(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export default function CreateOrganizationForm() {
	const router = useRouter();

	const form = useForm({
		defaultValues: {
			name: "",
			slug: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.organization.create(
				{
					name: value.name.trim(),
					slug: value.slug.trim(),
				},
				{
					onSuccess: () => {
						toast.success("Organización creada");
						router.push("/dashboard");
						router.refresh();
					},
					onError: (error) => {
						toast.error(
							error.error.message ||
								"No se pudo crear la organización. Prueba con otro identificador.",
						);
					},
				},
			);
		},
		validators: {
			onSubmit: organizationSchema,
		},
	});

	return (
		<div className="w-full">
			<div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
				<Building2 className="size-5" />
			</div>
			<p className="mt-6 font-medium text-primary text-xs uppercase tracking-[0.16em]">
				Último paso
			</p>
			<h1 className="mt-2 font-semibold text-3xl tracking-tight">
				Crea tu organización
			</h1>
			<p className="mt-2 text-muted-foreground text-sm">
				Será el espacio de trabajo compartido de tu equipo en Internal OS.
			</p>

			<form
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					form.handleSubmit();
				}}
				className="mt-8 space-y-5"
			>
				<form.Field name="name">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Nombre de la organización</Label>
							<Input
								id={field.name}
								name={field.name}
								placeholder="Acme"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => {
									const previousGeneratedSlug = toSlug(field.state.value);
									const name = event.target.value;
									field.handleChange(name);
									if (form.getFieldValue("slug") === previousGeneratedSlug) {
										form.setFieldValue("slug", toSlug(name));
									}
								}}
							/>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-destructive text-xs">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>

				<form.Field name="slug">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Identificador</Label>
							<Input
								id={field.name}
								name={field.name}
								placeholder="mi-organizacion"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) =>
									field.handleChange(toSlug(event.target.value))
								}
							/>
							<p className="text-muted-foreground text-xs">
								Debe ser único. Puedes cambiarlo si ya está en uso.
							</p>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-destructive text-xs">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? "Creando organización…" : "Crear y continuar"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
