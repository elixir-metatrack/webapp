"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSampleStats } from "@/hooks/useSampleStats";

export const description = "An interactive area chart";

const chartConfig = {
	visitors: {
		label: "Visitors",
	},
	sample: {
		label: "Sample",
		color: "var(--selected)",
	},
} satisfies ChartConfig;

export function ChartAreaHomePage() {
	const [timeRange, setTimeRange] = React.useState("90d");

	const { data, isLoading, error } = useSampleStats(timeRange);

	if (isLoading) {
		return (
			<div className="flex h-[250px] items-center justify-center">Loading…</div>
		);
	}

	if (error || !data) {
		return <div>Error loading chart</div>;
	}

	return (
		<Card className="@container/card">
			<CardHeader>
				<CardTitle>Samples Uploaded</CardTitle>
				<CardDescription>
					<span className="hidden @[540px]/card:block">
						Total for the last 3 months
					</span>
					<span className="@[540px]/card:hidden">Last 3 months</span>
				</CardDescription>
				<CardAction>
					<ToggleGroup
						type="single"
						value={timeRange}
						onValueChange={setTimeRange}
						variant="outline"
						className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
					>
						<ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
						<ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
						<ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
					</ToggleGroup>
					<Select value={timeRange} onValueChange={setTimeRange}>
						<SelectTrigger
							className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
							aria-label="Select a value"
						>
							<SelectValue placeholder="Last 3 months" />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="90d" className="rounded-lg">
								Last 3 months
							</SelectItem>
							<SelectItem value="30d" className="rounded-lg">
								Last 30 days
							</SelectItem>
							<SelectItem value="7d" className="rounded-lg">
								Last 7 days
							</SelectItem>
						</SelectContent>
					</Select>
				</CardAction>
			</CardHeader>
			<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-[250px] w-full"
				>
					<BarChart
						data={data}
						margin={{
							left: 12,
							right: 12,
						}}
					>
						<CartesianGrid vertical={false} />

						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={32}
							tickFormatter={(value) => {
								const date = new Date(`${value}T00:00:00`);

								return date.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								});
							}}
						/>

						<YAxis tickLine={false} axisLine={false} allowDecimals={false} />

						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									labelFormatter={(value: unknown) => {
										const date = new Date(`${value as string}T00:00:00`);

										return date.toLocaleDateString("en-US", {
											year: "numeric",
											month: "short",
											day: "numeric",
										});
									}}
									indicator="dot"
								/>
							}
						/>

						<Bar
							dataKey="sample"
							fill="var(--color-sample)"
							radius={[4, 4, 0, 0]}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
