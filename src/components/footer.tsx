import { Link } from "@tanstack/react-router";
import { CreativeCommons } from "lucide-react";
import { LogosModeToggle } from "./logos-mode-toggle";
import { Sigma2Logo } from "./logos-sigma2-toggle";

export default function Footer() {
	return (
		<footer className="bg-background text-foreground mt-8 w-full">
			<hr />
			<div className="container mx-auto w-3/4 px-4 py-8">
				<div className="flex flex-wrap items-center justify-center gap-24">
					<a href="https://elixir.no" className="hover:underline">
						<LogosModeToggle />
					</a>
					<a
						href="https://www.sigma2.no"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Sigma2Logo />
					</a>
				</div>

				<div className="mt-8 flex items-center justify-center gap-8 border-t pt-6">
					<ul className="flex flex-wrap items-center gap-4 text-lg">
						<li>
							<Link to="/about" className="hover:underline">
								About
							</Link>
						</li>
						<li>
							<Link to="/privacy-policy" className="hover:underline">
								Privacy Policy
							</Link>
						</li>
						<li>
							<Link to="/terms-of-use" className="hover:underline">
								Terms of Use
							</Link>
						</li>
						<li>
							<Link to="/how-to-cite-us" className="hover:underline">
								How to cite us
							</Link>
						</li>
						<li>
							<Link to="/help-and-support" className="hover:underline">
								Help and Support
							</Link>
						</li>
					</ul>
				</div>

				<div className="text-muted-foreground mt-8 flex flex-row items-center justify-center space-x-2 border-t border-gray-200 pt-4 text-center text-xs">
					<CreativeCommons />
					<p>
						{new Date().getFullYear()} ELIXIR Norway. Website content is
						licensed under{" "}
						<a
							href="https://creativecommons.org/licenses/by/4.0/deed.en"
							className="text-primary hover:underline"
						>
							CC-BY 4.0
						</a>{" "}
						unless otherwise noted.
					</p>
				</div>
			</div>
		</footer>
	);
}
