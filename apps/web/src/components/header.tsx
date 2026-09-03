"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const pathname = usePathname();

	if (pathname.startsWith("/dashboard") || pathname === "/login") return null;

	const links = [
		{ to: "/", label: "Inicio" },
		{ to: "/dashboard", label: "Backoffice" },
	] as const;

	return (
		<header className="border-b bg-background/95 backdrop-blur">
			<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
				<div className="flex items-center gap-6">
					<Link className="font-semibold tracking-tight" href="/">
						Internal OS
					</Link>
					<nav className="flex gap-4 text-muted-foreground text-sm">
						{links.map(({ to, label }) => (
							<Link key={to} href={to}>
								{label}
							</Link>
						))}
					</nav>
				</div>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
