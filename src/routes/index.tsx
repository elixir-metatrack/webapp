import { createFileRoute } from "@tanstack/react-router";
import StatCardGrid from "@/components/cards/stat-card-grid";
import { ThemeImage } from "@/components/theme-image";
import QuickStart from "@/components/quick-start";
import { motion } from "framer-motion";
import { ChartAreaHomePage } from "@/components/dashboard/chart-area-home-page";
import { useDashboardStats } from "@/lib/data/statCards";
import { Loader2Icon } from "lucide-react";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const { data: statCards = [], isLoading } = useDashboardStats();

	if (isLoading) {
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<Loader2Icon size={72} className="animate-spin" />
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.3 }}
			transition={{ duration: 1.2 }}
		>
			<div className="flex flex-col items-center space-y-16">
				{/* HERO SECTION */}
				<section className="relative flex h-100 w-full items-center justify-center overflow-hidden">
					<div className="bg-elixir-blue absolute inset-0" />

					{/* Estrutura em coluna */}
					<div className="z-10 flex h-full w-full flex-col justify-between px-6 py-6">
						{/* Texto centralizado no meio da div */}
						<div className="flex flex-1 flex-col items-center justify-center text-center">
							<h1 className="animate-fade-in mb-4 text-4xl font-bold text-white lg:text-6xl">
								Manage, Share and Archive Microbial Data
							</h1>
							<h4 className="animate-fade-in text-lg text-gray-200 lg:text-2xl">
								Simplifying metadata management, sample tracking and FAIR data
								sharing.
							</h4>
						</div>

						<div className="flex justify-center">
							<QuickStart />
						</div>
					</div>
				</section>

				{/* STAT CARDS */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.3 }}
					transition={{ duration: 0.8 }}
				>
					<ChartAreaHomePage />
					<StatCardGrid data={statCards} />
				</motion.div>
			</div>
		</motion.div>
	);
}
