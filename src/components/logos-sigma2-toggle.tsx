import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

export function Sigma2Logo({
	className = "",
	width = 140,
	height = 45,
}: {
	className?: string;
	width?: number;
	height?: number;
}) {
	const { resolvedTheme } = useTheme();

	const src =
		resolvedTheme === "dark"
			? "/Sigma2 Logo Negativ.png"
			: "/Sigma2 Logo Hoved.png";

	return (
		<div className={cn("flex flex-col items-center gap-2", className)}>
			<span className="text-muted-foreground text-xs tracking-wide uppercase">
				Data hosted on:
			</span>

			<img
				src={src}
				alt="Sigma2 logo"
				width={width}
				height={height}
				className="opacity-90 transition hover:opacity-100"
			/>
		</div>
	);
}
