import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

type NMDPLogoProps = {
	className?: string;
	width?: number;
	height?: number;
};

export function NMDPLogo({ className, width = 250, height }: NMDPLogoProps) {
	const { resolvedTheme } = useTheme();

	const src =
		resolvedTheme === "dark"
			? "/NMDP_logo_extend_dark.svg"
			: "/NMDP_logo_extend_light.svg";

	return (
		<img
			src={src}
			alt="NMDP Logo"
			width={width}
			height={height}
			className={cn(className)}
		/>
	);
}
