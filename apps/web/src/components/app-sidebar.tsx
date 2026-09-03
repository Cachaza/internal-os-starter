"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@internal-os/ui/components/sidebar";
import { Gauge, PanelsTopLeft, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import UserMenu from "@/components/user-menu";

const navigation = [
	{ label: "Resumen", href: "/dashboard", icon: Gauge },
	{
		label: "Configuración",
		href: "/dashboard/configuracion",
		icon: Settings2,
	},
] as const;

type AppSidebarProps = {
	organizationName: string;
};

export function AppSidebar({ organizationName }: AppSidebarProps) {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon" variant="inset">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
							<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								<PanelsTopLeft className="size-4" />
							</span>
							<span className="grid min-w-0 flex-1 text-left leading-tight">
								<span className="truncate font-semibold">Internal OS</span>
								<span className="truncate text-muted-foreground">
									{organizationName}
								</span>
							</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Espacio de trabajo</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navigation.map((item) => {
								const isActive =
									item.href === "/dashboard"
										? pathname === item.href
										: pathname.startsWith(item.href);

								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											isActive={isActive}
											tooltip={item.label}
											render={<Link href={item.href} />}
										>
											<item.icon />
											<span>{item.label}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<UserMenu variant="sidebar" />
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
