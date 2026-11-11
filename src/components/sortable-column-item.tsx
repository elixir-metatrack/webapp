import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableColumnItemProps {
	id: string;
	children: ReactNode;
}

export function SortableColumnItem({ id, children }: SortableColumnItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				position: "relative",
				zIndex: isDragging ? 10 : undefined,
			}}
			className={isDragging ? "bg-muted rounded-md opacity-70" : ""}
		>
			<div className="flex w-full items-center gap-1">
				<button
					type="button"
					{...attributes}
					{...listeners}
					className="text-muted-foreground hover:text-foreground flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md active:cursor-grabbing"
					aria-label={`Drag to reorder ${id}`}
					onClick={(event) => event.stopPropagation()}
				>
					<GripVertical className="size-4" />
				</button>

				<div className="min-w-0 flex-1">{children}</div>
			</div>
		</div>
	);
}
