import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

type MetatrackLogoProps = {
	className?: string;
	width?: number;
	height?: number;
};

export function MetatrackLogo({
	className,
	width = 250,
	height,
}: MetatrackLogoProps) {
	const { resolvedTheme } = useTheme();

	const src =
		resolvedTheme === "dark"
			? "/Metatrack_logo_advanced_dark.svg"
			: "/Metatrack_logo_advanced.svg";

	return (
		<img
			src={src}
			alt="MetaTrack Logo"
			width={width}
			height={height}
			className={cn(className)}
		/>
	);
}
