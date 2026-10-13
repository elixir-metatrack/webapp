import { useContext, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Info, Search, Rocket, BookOpen, FolderKanban } from "lucide-react";

import { HamburgerButton } from "../hamburger-button";
import { ModeToggle } from "../mode-toggle";
import {
	Sheet,
	SheetTrigger,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuthContext } from "@/providers/auth-context";

type NavItem = {
	pageUrl: string;
	pageName: string;
	icon: typeof Info;
};

const NavItems: NavItem[] = [
	{
		pageUrl: "/about",
		pageName: "About",
		icon: Info,
	},
	{
		pageUrl: "/public-data",
		pageName: "Public Data",
		icon: Search,
	},
	{
		pageUrl: "/get-started",
		pageName: "Get Started",
		icon: Rocket,
	},
	{
		pageUrl: "/resources",
		pageName: "Resources",
		icon: BookOpen,
	},
];

export function NavBarMobile() {
	const [open, setOpen] = useState(false);
	const { isAuthenticated, login, logout } = useContext(AuthContext);

	return (
		<nav className="flex w-full items-center justify-between px-4 py-3">
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetTrigger asChild>
					<HamburgerButton open={open} />
				</SheetTrigger>

				<SheetContent side="left" className="w-72">
					<SheetHeader>
						<SheetTitle className="font-bold">Menu</SheetTitle>
						<SheetDescription>Navigate through MetaTrack.</SheetDescription>
					</SheetHeader>

					<div className="flex flex-col gap-3 px-4">
						{isAuthenticated && (
							<MobileNavLink
								pageUrl="/projects"
								pageName="My Projects"
								icon={FolderKanban}
								onNavigate={() => setOpen(false)}
							/>
						)}

						{NavItems.map((item) => (
							<MobileNavLink
								key={item.pageUrl}
								{...item}
								onNavigate={() => setOpen(false)}
							/>
						))}

						<div className="my-2 border-t" />

						{isAuthenticated ? (
							<Button
								variant="destructive"
								className="w-full justify-start"
								onClick={() => {
									setOpen(false);
									logout();
								}}
							>
								Logout
							</Button>
						) : (
							<Button
								className="w-full justify-start"
								onClick={() => {
									setOpen(false);
									login();
								}}
							>
								Login
							</Button>
						)}
					</div>
				</SheetContent>
			</Sheet>

			<Link to="/" className="flex items-center">
				<img
					src="/Metatrack_logo_advanced.svg"
					alt="MetaTrack Logo"
					className="h-auto w-36 sm:w-40"
				/>
			</Link>

			<ModeToggle />
		</nav>
	);
}

function MobileNavLink({
	pageUrl,
	pageName,
	icon: Icon,
	onNavigate,
}: NavItem & { onNavigate: () => void }) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	const selected =
		pathname === pageUrl ||
		(pageUrl !== "/" && pathname.startsWith(`${pageUrl}/`));

	return (
		<Button
			asChild
			variant={selected ? "default" : "secondary"}
			className={cn("h-11 w-full justify-start rounded-md px-4")}
		>
			<Link to={pageUrl} onClick={onNavigate}>
				<Icon className="mr-2 h-4 w-4" />
				{pageName}
			</Link>
		</Button>
	);
}
