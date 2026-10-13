import { toast } from "sonner";

type ToastOptions = Parameters<typeof toast.success>[1];

const persistentOptions: ToastOptions = {
	duration: Infinity,
	action: {
		label: "OK",
		onClick: () => {},
	},
};

function formatMessage(message: string) {
	return (
		<div className="flex flex-col gap-1">
			{message.split(/\r?\n/).map((line, index) => (
				<div key={index}>{line}</div>
			))}
		</div>
	);
}

export function toastSuccess(message: string, options?: ToastOptions) {
	toast.success(formatMessage(message), {
		...options,
		...persistentOptions,
	});
}

export function toastError(message: string, options?: ToastOptions) {
	toast.error(formatMessage(message), {
		...options,
		...persistentOptions,
	});
}
