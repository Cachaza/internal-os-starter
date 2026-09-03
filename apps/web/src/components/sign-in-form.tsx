import { Button } from "@internal-os/ui/components/button";
import { Input } from "@internal-os/ui/components/input";
import { Label } from "@internal-os/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const router = useRouter();
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						router.push("/dashboard");
						toast.success("Sign in successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="w-full">
			<p className="font-medium text-primary text-xs uppercase tracking-[0.16em]">
				Acceso interno
			</p>
			<h1 className="mt-2 font-semibold text-3xl tracking-tight">
				Bienvenido de nuevo
			</h1>
			<p className="mt-2 text-muted-foreground text-sm">
				Entra con tu cuenta del equipo.
			</p>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="mt-8 space-y-5"
			>
				<div>
					<form.Field name="email">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Correo electrónico</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									placeholder="nombre@empresa.com"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Contraseña</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									placeholder="Tu contraseña"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

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
							{isSubmitting ? "Entrando…" : "Entrar al backoffice"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-5 border-t pt-5 text-center">
				<span className="text-muted-foreground text-sm">
					¿Necesitas una cuenta?{" "}
				</span>
				<Button variant="link" onClick={onSwitchToSignUp} className="px-1">
					Crear cuenta
				</Button>
			</div>
		</div>
	);
}
