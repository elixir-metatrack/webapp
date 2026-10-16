import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

export function LogosModeToggle({
	className = "",
	width = 150,
	height = 50,
}: {
	className?: string;
	width?: number;
	height?: number;
}) {
	const { resolvedTheme } = useTheme();
	let src;

	switch (resolvedTheme) {
		case "light":
			src = "/elixir-no-logo-black.svg";
			break;
		case "dark":
			src = "/elixir-no-logo-white.svg";
			break;
		default:
			src = "/elixir-no-logo-black.svg";
			break;
	}

	return (
		<img
			src={src}
			alt="Logo of ELIXIR Norway"
			width={width}
			height={height}
			className={cn("opacity-90 transition hover:opacity-100", className)}
		/>
	);
}
