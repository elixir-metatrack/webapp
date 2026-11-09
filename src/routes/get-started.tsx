import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import {
	BookOpen,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	Menu,
	X,
} from "lucide-react";

import beforeYouStart from "@/content/get-started/01-before-you-start.md?raw";
import login from "@/content/get-started/02-login.md?raw";

export const Route = createFileRoute("/get-started")({
	component: RouteComponent,
});

const sections = [
	{
		id: "before-you-start",
		title: "Before you start",
		content: beforeYouStart,
	},
	{
		id: "login",
		title: "Log in to MetaTrack",
		content: login,
	},
	{
		id: "create-project",
		title: "Create a project",
		content: "",
	},
	{
		id: "register-samples",
		title: "Register samples",
		content: "",
	},
	{
		id: "manage-metadata",
		title: "Manage sample metadata",
		content: "",
	},
	{
		id: "upload-data",
		title: "Upload sequencing data",
		content: "",
	},
	{
		id: "collaborators",
		title: "Invite collaborators",
		content: "",
	},
	{
		id: "share-archive",
		title: "Share and archive",
		content: "",
	},
];

type MarkdownImageProps = {
	src?: string;
	alt?: string;
};

function MarkdownImage({ src, alt }: MarkdownImageProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	useEffect(() => {
		if (!isExpanded) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsExpanded(false);
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isExpanded]);

	if (!src) return null;

	return (
		<>
			<figure className="my-6">
				<img
					src={src}
					alt={alt || ""}
					onClick={() => setIsExpanded(true)}
					className="mx-auto w-full max-w-xl cursor-zoom-in rounded-xl border transition-opacity hover:opacity-90"
					loading="lazy"
				/>

				{alt && (
					<figcaption className="text-muted-foreground mt-2 text-center text-sm">
						{alt}
					</figcaption>
				)}
			</figure>

			{isExpanded && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label={alt || "Expanded image"}
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
					onClick={() => setIsExpanded(false)}
				>
					<button
						type="button"
						onClick={() => setIsExpanded(false)}
						aria-label="Close expanded image"
						className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
					>
						<X className="size-6" />
					</button>

					<img
						src={src}
						alt={alt || ""}
						className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
						onClick={(event) => event.stopPropagation()}
					/>
				</div>
			)}
		</>
	);
}

const components: Components = {
	h1: ({ children }) => (
		<h1 className="mb-5 text-3xl font-bold tracking-tight">{children}</h1>
	),
	h2: ({ children }) => (
		<h2 className="mt-10 mb-4 scroll-mt-24 border-b pb-2 text-xl font-semibold">
			{children}
		</h2>
	),
	h3: ({ children }) => (
		<h3 className="mt-7 mb-3 text-lg font-semibold">{children}</h3>
	),
	p: ({ children, node }) => {
		const imageCount =
			node?.children?.filter(
				(child) => child.type === "element" && child.tagName === "img"
			).length ?? 0;

		if (imageCount >= 2) {
			return (
				<div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
					{children}
				</div>
			);
		}

		return <p className="text-muted-foreground mb-4 leading-7">{children}</p>;
	},
	ul: ({ children }) => (
		<ul className="text-muted-foreground mb-5 ml-6 list-disc space-y-2">
			{children}
		</ul>
	),
	ol: ({ children }) => (
		<ol className="text-muted-foreground mb-5 ml-6 list-decimal space-y-2">
			{children}
		</ol>
	),
	li: ({ children }) => <li className="pl-1">{children}</li>,
	a: ({ href, children }) => (
		<a href={href} className="text-primary underline underline-offset-4">
			{children}
		</a>
	),
	hr: () => <hr className="border-border my-8" />,
	input: ({ checked }) => (
		<input
			type="checkbox"
			checked={checked}
			readOnly
			className="accent-primary mr-2"
		/>
	),
	strong: ({ children }) => (
		<strong className="text-foreground font-semibold">{children}</strong>
	),
	img: MarkdownImage,
};

function RouteComponent() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [activeSectionIndex, setActiveSectionIndex] = useState(0);

	const activeSection = sections[activeSectionIndex];
	const previousSection = sections[activeSectionIndex - 1];
	const nextSection = sections[activeSectionIndex + 1];

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Page header */}
			<div className="mb-10 border-b pb-8">
				<div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm">
					<BookOpen className="size-4" />
					Documentation
					<ChevronRight className="size-4" />
					Get Started
				</div>

				<h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
					Get Started with Metatrack
				</h1>

				<p className="text-muted-foreground max-w-3xl text-lg">
					Learn how to use the Metatrack to organize your research projects,
					register samples, manage sequencing data and collaborate with
					researchers.
				</p>
			</div>

			{/* Mobile sidebar toggle */}
			<div className="mb-5 lg:hidden">
				<button
					onClick={() => setSidebarOpen(!sidebarOpen)}
					className="flex w-full items-center justify-between rounded-lg border p-3 text-sm font-medium"
				>
					On this page
					{sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
				</button>
			</div>

			<div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
				{/* Sidebar */}
				<aside
					className={`lg:sticky lg:top-20 lg:block lg:h-fit ${
						sidebarOpen ? "block" : "hidden"
					}`}
				>
					<div className="space-y-6">
						<div>
							<h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
								Getting started
							</h2>

							<nav className="space-y-1">
								{sections.map((section, index) => {
									const isActive = index === activeSectionIndex;

									return (
										<button
											key={section.id}
											onClick={() => {
												setActiveSectionIndex(index);
												setSidebarOpen(false);
											}}
											className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
												isActive
													? "bg-primary/10 text-primary font-medium"
													: "text-muted-foreground hover:bg-muted"
											}`}
										>
											<span className="text-xs opacity-70">
												{String(index + 1).padStart(2, "0")}
											</span>

											{section.title}
										</button>
									);
								})}
							</nav>
						</div>

						<div className="bg-muted/30 rounded-lg border p-4">
							<div className="mb-2 flex items-center gap-2">
								<BookOpen className="text-primary size-4" />
								<span className="text-sm font-semibold">Need help?</span>
							</div>
							<p className="text-muted-foreground text-xs leading-5">
								Contact the{" "}
								<Link
									to="/help-and-support"
									className="text-blue-600 hover:underline"
								>
									Metatrack support team
								</Link>{" "}
								if you need assistance using the platform.
							</p>
						</div>
					</div>
				</aside>

				{/* Main content */}
				<main className="min-w-0">
					<div className="mb-8 flex items-center justify-between">
						<div className="text-muted-foreground flex items-center gap-2 text-sm">
							<ClipboardList className="size-4" />
							Getting started guide
						</div>
						<span className="text-muted-foreground text-xs">
							Last updated: 3 November 2026
						</span>
					</div>

					{/* Markdown content */}
					<article className="max-w-none">
						<ReactMarkdown components={components}>
							{activeSection.content}
						</ReactMarkdown>
					</article>

					{/* Next chapter */}
					<div className="mt-12 flex items-center justify-between border-t pt-6">
						{previousSection ? (
							<button
								onClick={() => setActiveSectionIndex(activeSectionIndex - 1)}
								className="hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium"
							>
								<ChevronLeft className="size-4" />
								{previousSection.title}
							</button>
						) : (
							<div />
						)}

						{nextSection && (
							<div className="text-right">
								<span className="text-muted-foreground mb-2 block text-xs">
									NEXT SECTION
								</span>

								<button
									onClick={() => setActiveSectionIndex(activeSectionIndex + 1)}
									className="hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium"
								>
									{nextSection.title}
									<ChevronRight className="size-4" />
								</button>
							</div>
						)}
					</div>
				</main>
			</div>
		</div>
	);
}
