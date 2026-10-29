import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Copy, Check } from "lucide-react";

import howToCiteUs from "@/content/how-to-cite-us.md?raw";

export const Route = createFileRoute("/how-to-cite-us")({
	component: RouteComponent,
});

function RouteComponent() {
	const [copied, setCopied] = useState<string | null>(null);

	const handleCopy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(text);
			window.setTimeout(() => setCopied(null), 2000);
		} catch (error) {
			console.error("Failed to copy citation:", error);
		}
	};

	const markdownComponents: Components = {
		h4: ({ ...props }) => <h4 className="mb-4" {...props} />,
		p: ({ ...props }) => <p className="mb-4" {...props} />,
		a: ({ ...props }) => (
			<a
				className="text-blue-600 hover:underline"
				target="_blank"
				rel="noopener noreferrer"
				{...props}
			/>
		),
		ul: ({ ...props }) => <ul className="mb-4 ml-6 list-disc" {...props} />,
		li: ({ ...props }) => <li className="my-2" {...props} />,
		hr: ({ ...props }) => <hr className="my-6 border-gray-300" {...props} />,
		pre: ({ children }) => {
			const codeText = React.Children.toArray(children)
				.map((child) => {
					if (!React.isValidElement(child)) return "";

					const childProps = child.props as {
						children?: React.ReactNode;
					};

					return typeof childProps.children === "string"
						? childProps.children
						: "";
				})
				.join("");

			const isCopied = copied === codeText;

			return (
				<div className="bg-muted relative my-4 overflow-hidden rounded-lg border">
					<div className="flex items-center justify-between border-b px-4 py-2">
						<span className="text-muted-foreground text-xs">Citation</span>
						<button
							type="button"
							onClick={() => void handleCopy(codeText)}
							className="hover:bg-accent inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm"
							aria-label="Copy citation"
						>
							{isCopied ? (
								<>
									<Check className="size-4" />
									Copied!
								</>
							) : (
								<>
									<Copy className="size-4" />
									Copy
								</>
							)}
						</button>
					</div>
					<pre className="overflow-x-auto p-4 text-sm break-words whitespace-pre-wrap">
						<code>{codeText}</code>
					</pre>
				</div>
			);
		},
	};

	return (
		<div className="mx-auto max-w-6xl px-6 py-12">
			<article className="max-w-none">
				<ReactMarkdown components={markdownComponents}>
					{howToCiteUs}
				</ReactMarkdown>
			</article>
		</div>
	);
}
