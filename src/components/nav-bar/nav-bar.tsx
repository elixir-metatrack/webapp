import { useContext } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { AuthContext } from "@/providers/auth-context";
import { LogosModeToggle } from "../logos-mode-toggle";
import { MetatrackLogo } from "../logos-metatrack-toogle";

type NavItem = { pageUrl: string; pageName: string };
const NavItems: NavItem[] = [
	{
		pageUrl: "/about",
		pageName: "About",
	},
	{
		pageUrl: "/public-data",
		pageName: "Public Data",
	},
	{
		pageUrl: "/get-started",
		pageName: "Get Started",
	},
	{
		pageUrl: "/resources",
		pageName: "Resources",
	},
];

export function NavBar() {
	const { isAuthenticated, login, logout } = useContext(AuthContext);

	return (
		<nav className="flex w-full justify-between py-4">
			<div className="flex w-full justify-around">
				<div>
					<div className="flex items-center gap-4">
						<a href="https://elixir.no">
							<LogosModeToggle className="opacity-100" />
						</a>
						<Link to="/">
							<MetatrackLogo width={250} height={65.55} />
						</Link>
						<a href="https://www.microbial-data-platform.no">
							<div className="flex flex-col justify-center">
								<h1 className="animate-fade-in text-4xl font-bold lg:text-2xl">
									Norwegian Microbial Data Platform
								</h1>
								<h4 className="animate-fade-in text-lg lg:text-base">
									Manage, share and archive data
								</h4>
							</div>
						</a>
					</div>
				</div>

				<div className="flex items-center gap-6">
					<ul className="flex items-center gap-4">
						{isAuthenticated && (
							<Button
								variant="secondary"
								className={cn(
									"text-md",
									"h-10 rounded-md px-4 has-[>svg]:px-4"
								)}
								asChild
							>
								<Link to="/projects">My Projects</Link>
							</Button>
						)}
						{NavItems.map((it) => (
							<NavBarItem
								key={it.pageName}
								pageUrl={it.pageUrl}
								pageName={it.pageName}
							/>
						))}
						{isAuthenticated ? (
							<Button
								onClick={logout}
								variant="destructive"
								className={cn(
									"text-md",
									"h-10 rounded-md px-4 has-[>svg]:px-4"
								)}
							>
								Logout
							</Button>
						) : (
							<Button
								onClick={login}
								className={cn(
									"text-md",
									"h-10 rounded-md px-4 has-[>svg]:px-4"
								)}
							>
								Login
							</Button>
						)}
					</ul>
					<ModeToggle />
				</div>
			</div>
		</nav>
	);
}

function NavBarItem({ pageUrl, pageName }: NavItem) {
	const selected = useRouterState({
		select: (state) => state.location,
	});

	const pathName = selected.pathname;

	return (
		<Button
			asChild
			className={cn("text-md", "h-10 rounded-md px-4 has-[>svg]:px-4")}
			variant={pathName === pageUrl ? "default" : "secondary"}
		>
			<Link to={pageUrl}>{pageName}</Link>
		</Button>
	);
}
