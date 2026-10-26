import { BookOpen, Fingerprint, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuickStart() {
	return (
		<div className="mx-auto flex w-full max-w-[1200px] flex-wrap justify-center gap-[6vw]">
			{/* Card 1 */}
			<div className="bg-secondary hover:bg-secondary/80 flex h-36 w-36 flex-col items-center justify-center gap-6 rounded-xl border border-white/20 p-6 backdrop-blur-md transition duration-300">
				<div className="flex flex-col items-center gap-4 transition-transform duration-300 hover:-translate-y-1 hover:scale-105">
					<BookOpen size={60} />
					<Button
						className="hover:bg-secondary/0 bg-secondary/0 h-6 rounded-lg px-6"
						variant="secondary"
					>
						GET STARTED
					</Button>
				</div>
			</div>

			{/* Card 2 */}
			<div className="bg-secondary hover:bg-secondary/80 flex h-36 w-36 flex-col items-center justify-center gap-6 rounded-xl border border-white/20 p-6 backdrop-blur-md transition duration-300">
				<div className="flex flex-col items-center gap-4 transition-transform duration-300 hover:-translate-y-1 hover:scale-105">
					<Upload size={60} />
					<Button
						className="hover:bg-secondary/0 bg-secondary/0 h-6 rounded-lg px-6"
						variant="secondary"
					>
						UPLOAD DATA
					</Button>
				</div>
			</div>

			{/* Card 3 */}
			<div className="bg-secondary hover:bg-secondary/80 flex h-36 w-36 flex-col items-center justify-center gap-6 rounded-xl border border-white/20 p-6 backdrop-blur-md transition duration-300">
				<div className="flex flex-col items-center gap-4 transition-transform duration-300 hover:-translate-y-1 hover:scale-105">
					<Fingerprint size={60} />
					<Button
						className="hover:bg-secondary/0 bg-secondary/0 h-6 rounded-lg px-6"
						variant="secondary"
					>
						DATA ACCESS
					</Button>
				</div>
			</div>
		</div>
	);
}
