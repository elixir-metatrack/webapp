"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Project } from "@/lib/types";
import { ProjectGeneralTab } from "./tabs/project-general-tab";
import { ProjectMembersTab } from "./tabs/project-members-tab";
import { useState } from "react";

interface EditProjectDialogProps {
	project: Project | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialTab?: "general" | "members";
}

export function EditProjectDialog({
	project,
	open,
	onOpenChange,
	initialTab = "general",
}: EditProjectDialogProps) {
	const [activeTab, setActiveTab] = useState<"general" | "members">(initialTab);
	const [prevOpen, setPrevOpen] = useState(open);

	if (open && !prevOpen) {
		setPrevOpen(true);
		setActiveTab(initialTab);
	} else if (!open && prevOpen) {
		setPrevOpen(false);
	}

	if (!project) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="flex !h-[90vh] !max-h-[90vh] !w-[95vw] !max-w-[1200px] flex-col"
				aria-describedby={undefined}
			>
				<DialogHeader>
					<DialogTitle>Edit project</DialogTitle>
				</DialogHeader>

				<Tabs
					value={activeTab}
					onValueChange={(val: string) =>
						setActiveTab(val as "general" | "members")
					}
					className="mt-4 flex min-h-0 flex-1 flex-col"
				>
					<TabsList className="shrink-0">
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="members">Members</TabsTrigger>
					</TabsList>

					<TabsContent
						value="general"
						className="min-h-0 flex-1 overflow-y-auto"
					>
						<ProjectGeneralTab project={project} />
					</TabsContent>

					<TabsContent
						value="members"
						className="min-h-0 flex-1 overflow-y-auto"
					>
						<ProjectMembersTab project={project} />
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
