import { auth } from "@internal-os/auth";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@internal-os/ui/components/sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";

export default async function BackofficeLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const requestHeaders = await headers();
	const session = await auth.api.getSession({ headers: requestHeaders });
	if (!session?.user) redirect("/login");

	const activeOrganization = await auth.api.getFullOrganization({
		headers: requestHeaders,
	});
	if (!activeOrganization) redirect("/organization-required");

	return (
		<SidebarProvider>
			<AppSidebar organizationName={activeOrganization.name} />
			<SidebarInset className="min-h-svh overflow-hidden">
				<header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
					<div className="flex items-center gap-2">
						<SidebarTrigger />
						<div className="h-4 w-px bg-border" />
						<p className="text-muted-foreground text-sm">
							{activeOrganization.name}
						</p>
					</div>
					<ModeToggle />
				</header>
				<div className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
