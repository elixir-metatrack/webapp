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
				<section className="relative flex h-180 w-full items-center justify-center overflow-hidden">
					<ThemeImage
						lightSrc="/bg-light.jpg"
						darkSrc="/bg-light.jpg"
						alt="Background"
						className="absolute inset-0 h-180 w-full object-cover"
					/>

					<div className="absolute inset-0 bg-black/20 dark:bg-black/40" />

					{/* Estrutura em coluna */}
					<div className="z-10 flex h-full w-full flex-col justify-between px-6 py-12">
						{/* Texto centralizado no meio da div */}
						<div className="flex flex-1 flex-col items-center justify-center text-center">
							<h1 className="animate-fade-in mb-4 text-4xl font-bold text-white lg:text-6xl">
								Platform for Metadata Management and Tracking
							</h1>
							<h4 className="animate-fade-in text-lg text-gray-200 lg:text-2xl">
								For life scientists in Norway
							</h4>
							<a
								href="https://elixir.no"
								className="mt-2 flex flex-col items-center px-6 pb-4 font-medium text-white shadow-lg"
							>
								By ELIXIR Norway
							</a>
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
					<div className="flex flex-col">
						<div className="flex flex-col items-center rounded-md pb-4 text-center shadow-none">
							<h3 className="text-primary pt-4 text-center font-semibold lg:text-left">
								Numbers Behind MetaTrack
							</h3>
						</div>
					</div>
					<ChartAreaHomePage />
					<StatCardGrid data={statCards} />
				</motion.div>
			</div>
		</motion.div>
	);
}
