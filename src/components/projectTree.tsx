// ProjectTree.tsx

import { useEffect, useRef } from "react";
import dagre from "@dagrejs/dagre";

export interface GraphNode {
	id: string;
	name: string;
	type: "project" | "sample" | "assay";
}

export interface GraphLink {
	source: string;
	target: string;
}

export interface ProjectGraph {
	nodes: GraphNode[];
	links: GraphLink[];
}

interface ProjectTreeProps {
	data: ProjectGraph;
	width?: number;
	onAssayClick?: (assayId: string) => void;
}

interface PositionedNode extends GraphNode {
	x: number;
	y: number;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 40;

export function ProjectTree({
	data,
	width = 1200,
	onAssayClick,
}: ProjectTreeProps) {
	const svgRef = useRef<SVGSVGElement | null>(null);

	useEffect(() => {
		if (!svgRef.current) {
			return;
		}

		const svg = svgRef.current;

		while (svg.firstChild) {
			svg.removeChild(svg.firstChild);
		}

		if (!data.nodes.length) {
			svg.setAttribute("width", "0");
			svg.setAttribute("height", "0");
			svg.setAttribute("viewBox", "0 0 0 0");
			svg.setAttribute("style", "display: none;");
			return;
		}

		svg.setAttribute("style", "max-width: 100%; height: auto; display: block;");

		const graph = new dagre.graphlib.Graph();

		graph.setGraph({
			rankdir: "LR",
			ranksep: 120,
			nodesep: 50,
			marginx: 40,
			marginy: 40,
		});

		graph.setDefaultEdgeLabel(() => ({}));

		/*
		 * Nodes
		 */

		for (const node of data.nodes) {
			graph.setNode(node.id, {
				width: NODE_WIDTH,
				height: NODE_HEIGHT,
			});
		}

		/*
		 * Links
		 */

		for (const link of data.links) {
			if (graph.hasNode(link.source) && graph.hasNode(link.target)) {
				graph.setEdge(link.source, link.target);
			}
		}

		/*
		 * Dagre layout
		 */

		dagre.layout(graph);

		const positionedNodes: PositionedNode[] = data.nodes.map((node) => {
			const position = graph.node(node.id);

			return {
				...node,
				x: position.x,
				y: position.y,
			};
		});

		const nodeMap = new Map<string, PositionedNode>();

		for (const node of positionedNodes) {
			nodeMap.set(node.id, node);
		}

		const graphWidth = (graph.graph().width ?? width) + 80;

		const graphHeight = (graph.graph().height ?? 200) + 80;

		svg.setAttribute("width", String(Math.max(width, graphWidth)));

		svg.setAttribute("height", String(graphHeight));

		svg.setAttribute(
			"viewBox",
			`0 0 ${Math.max(width, graphWidth)} ${graphHeight}`
		);

		svg.setAttribute("style", "max-width: 100%; height: auto; display: block;");

		const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

		group.setAttribute("transform", "translate(40, 40)");

		svg.appendChild(group);

		/*
		 * Links
		 */

		const linksGroup = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"g"
		);

		linksGroup.setAttribute("fill", "none");

		linksGroup.setAttribute("stroke", "#888");

		linksGroup.setAttribute("stroke-width", "1.5");

		linksGroup.setAttribute("stroke-opacity", "0.6");

		group.appendChild(linksGroup);

		for (const link of data.links) {
			const source = nodeMap.get(link.source);
			const target = nodeMap.get(link.target);

			if (!source || !target) {
				continue;
			}

			const sourceX = source.x + NODE_WIDTH / 2;

			const sourceY = source.y;

			const targetX = target.x - NODE_WIDTH / 2;

			const targetY = target.y;

			const middleX = sourceX + (targetX - sourceX) / 2;

			const path = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"path"
			);

			path.setAttribute(
				"d",
				`M ${sourceX} ${sourceY}
				 C ${middleX} ${sourceY},
					   ${middleX} ${targetY},
					   ${targetX} ${targetY}`
			);

			group.querySelector("g")?.appendChild(path);
		}

		/*
		 * Nodes
		 */

		const nodesGroup = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"g"
		);

		group.appendChild(nodesGroup);

		for (const node of positionedNodes) {
			const nodeGroup = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"g"
			);

			if (node.type === "assay" && onAssayClick) {
				nodeGroup.style.cursor = "pointer";
				nodeGroup.setAttribute("role", "button");
				nodeGroup.setAttribute("tabindex", "0");
				nodeGroup.setAttribute("aria-label", `Open assay ${node.name}`);

				const handleClick = () => {
					onAssayClick(node.id.replace(/^assay-/, ""));
				};

				nodeGroup.addEventListener("click", handleClick);

				nodeGroup.addEventListener("keydown", (event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						handleClick();
					}
				});
			}

			nodeGroup.setAttribute(
				"transform",
				`translate(
					${node.x - NODE_WIDTH / 2},
					${node.y - NODE_HEIGHT / 2}
				)`
			);

			const rect = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"rect"
			);

			rect.setAttribute("width", String(NODE_WIDTH));

			rect.setAttribute("height", String(NODE_HEIGHT));

			rect.setAttribute("rx", "6");

			rect.setAttribute("fill", getNodeColor(node.type));

			rect.setAttribute("stroke", "#555");

			nodeGroup.appendChild(rect);

			const text = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"text"
			);

			text.setAttribute("x", String(NODE_WIDTH / 2));

			text.setAttribute("y", String(NODE_HEIGHT / 2));

			text.setAttribute("text-anchor", "middle");

			text.setAttribute("dominant-baseline", "middle");

			text.setAttribute("font-size", "13");

			text.setAttribute("fill", "#111");

			const maxLength = 22;

			text.textContent =
				node.name.length > maxLength
					? `${node.name.slice(0, maxLength)}…`
					: node.name;

			nodeGroup.appendChild(text);

			if (node.type === "assay") {
				const icon = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"svg"
				);

				icon.setAttribute("width", "14");
				icon.setAttribute("height", "14");
				icon.setAttribute("viewBox", "0 0 24 24");
				icon.setAttribute("fill", "none");
				icon.setAttribute("stroke", "#166534");
				icon.setAttribute("stroke-width", "2");
				icon.setAttribute("stroke-linecap", "round");
				icon.setAttribute("stroke-linejoin", "round");

				icon.setAttribute("x", String(NODE_WIDTH - 22));
				icon.setAttribute("y", String((NODE_HEIGHT - 14) / 2));

				const path = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"path"
				);

				path.setAttribute("d", "M 15 3 h 6 v 6 M 10 14 L 21 3");

				icon.appendChild(path);

				const rect = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"path"
				);

				rect.setAttribute(
					"d",
					"M 18 13 v 6 a 2 2 0 0 1 -2 2 H 5 a 2 2 0 0 1 -2 -2 V 8 a 2 2 0 0 1 2 -2 h 6"
				);

				icon.appendChild(rect);
				nodeGroup.appendChild(icon);
			}

			const title = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"title"
			);

			title.textContent = node.name;

			nodeGroup.appendChild(title);

			nodesGroup.appendChild(nodeGroup);
		}
	}, [data, width, onAssayClick]);

	return (
		<div className="w-full overflow-x-auto">
			<div className="flex min-w-full justify-center">
				<svg ref={svgRef} />
			</div>
		</div>
	);
}

function getNodeColor(type: GraphNode["type"]) {
	switch (type) {
		case "project":
			return "#e5e7eb";

		case "sample":
			return "#dbeafe";

		case "assay":
			return "#dcfce7";

		default:
			return "#f3f4f6";
	}
}
