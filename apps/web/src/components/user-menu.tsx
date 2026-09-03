"use client";

import { Button } from "@internal-os/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@internal-os/ui/components/dropdown-menu";
import {
	SidebarMenuButton,
	SidebarMenuItem,
} from "@internal-os/ui/components/sidebar";
import { Skeleton } from "@internal-os/ui/components/skeleton";
import { ChevronsUpDown, CircleUserRound, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function UserMenu({
	variant = "header",
}: {
	variant?: "header" | "sidebar";
}) {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return variant === "sidebar" ? (
			<SidebarMenuItem>
				<Skeleton className="h-12 w-full" />
			</SidebarMenuItem>
		) : (
			<Skeleton className="h-9 w-24" />
		);
	}

	if (!session) {
		return (
			<Link href="/login">
				<Button variant="outline">Sign In</Button>
			</Link>
		);
	}

	const signOut = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => router.push("/login"),
			},
		});
	};

	if (variant === "sidebar") {
		return (
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
						<CircleUserRound className="size-8" />
						<span className="grid min-w-0 flex-1 text-left leading-tight">
							<span className="truncate font-medium">{session.user.name}</span>
							<span className="truncate text-muted-foreground">
								{session.user.email}
							</span>
						</span>
						<ChevronsUpDown className="ml-auto size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="min-w-56 bg-card"
						side="right"
						align="end"
					>
						<DropdownMenuGroup>
							<DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem variant="destructive" onClick={signOut}>
								<LogOut />
								Cerrar sesión
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" />}>
				{session.user.name}
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
					<DropdownMenuItem variant="destructive" onClick={signOut}>
						Cerrar sesión
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
