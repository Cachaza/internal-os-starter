import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@internal-os/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { requireActiveOrganization } from "@/lib/active-organization";

export default async function BackofficeLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { organization: activeOrganization } =
		await requireActiveOrganization();

	return (
		<SidebarProvider>
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:p-3"
			>
				Saltar al contenido
			</a>
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
