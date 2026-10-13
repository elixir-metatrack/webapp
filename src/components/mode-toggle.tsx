import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/providers/theme-provider";

type ModeToggleProps = {
	variant?: VariantProps<typeof Button>["variant"];
	align?: "start" | "center" | "end";
	label?: string;
};

export function ModeToggle({
	variant = "outline",
	align = "end",
	label,
}: ModeToggleProps) {
	const { setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={variant}
					size={label ? "default" : "icon"}
					className={
						label
							? "-ml-1 h-8 w-full justify-start gap-2 rounded-md border-0 px-0 text-left font-normal shadow-none hover:bg-neutral-300"
							: ""
					}
				>
					<SunIcon className="h-4 w-4 shrink-0 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
					<MoonIcon className="absolute left-2 h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
					{label && <span>{label}</span>}
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align={align}>
				<DropdownMenuItem onClick={() => setTheme("light")}>
					Light
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")}>
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")}>
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
