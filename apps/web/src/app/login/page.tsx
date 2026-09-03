"use client";

import { PanelsTopLeft, ShieldCheck } from "lucide-react";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function LoginPage() {
	const [showSignIn, setShowSignIn] = useState(true);

	return (
		<main className="grid min-h-svh overflow-auto bg-background lg:grid-cols-2">
			<section className="flex items-center justify-center p-6 sm:p-10">
				<div className="w-full max-w-sm">
					<div className="mb-8 flex items-center gap-3 lg:hidden">
						<div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
							<PanelsTopLeft className="size-4" />
						</div>
						<div>
							<p className="font-semibold">Internal OS</p>
							<p className="text-muted-foreground text-xs">
								Acceso al backoffice
							</p>
						</div>
					</div>
					{showSignIn ? (
						<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
					) : (
						<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
					)}
				</div>
			</section>

			<section className="relative hidden overflow-hidden bg-foreground p-10 text-background lg:flex lg:flex-col lg:justify-between">
				<div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_10%,var(--color-primary),transparent_35%),radial-gradient(circle_at_80%_80%,var(--color-muted),transparent_30%)]" />
				<div className="relative flex items-center gap-3">
					<div className="grid size-10 place-items-center rounded-xl bg-background/10 ring-1 ring-background/20">
						<PanelsTopLeft className="size-5" />
					</div>
					<div>
						<p className="font-semibold text-lg">Internal OS</p>
						<p className="text-background/60 text-xs">Herramientas internas</p>
					</div>
				</div>
				<div className="relative max-w-lg">
					<p className="text-balance font-medium text-3xl leading-tight">
						Un acceso único para el equipo y sus herramientas internas.
					</p>
					<div className="mt-6 flex items-start gap-3 text-background/65 text-sm">
						<ShieldCheck className="mt-0.5 size-5 shrink-0" />
						<p>
							El backoffice requiere una sesión válida y pertenencia a la
							organización activa.
						</p>
					</div>
				</div>
				<p className="relative text-background/45 text-xs">
					Infraestructura lista para incorporar el dominio de tu producto.
				</p>
			</section>
		</main>
	);
}
