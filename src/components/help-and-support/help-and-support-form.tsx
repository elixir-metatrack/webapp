"use client";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import contactUsFormSchema, {
	type HelpAndSupportFormSchema,
} from "./helpAndSupportFormSchema";
import { sendEmailToElixir } from "./actions";
import { useForm } from "react-hook-form";
import { toastError, toastSuccess } from "#/lib/toast";

export default function HelpAndSupportForm() {
	const form = useForm<HelpAndSupportFormSchema>({
		resolver: zodResolver(contactUsFormSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			subject: "",
			message: "",
		},
	});

	const onSubmit = async (values: HelpAndSupportFormSchema) => {
		const serverResponse = await sendEmailToElixir(values);

		if (!serverResponse.error) {
			toastSuccess("Message sent successfully!", {
				description: "We’ll get back to you soon.",
			});
			form.reset();
		} else {
			let errorMessage: string;

			if (
				typeof serverResponse.error === "object" &&
				"message" in serverResponse.error
			) {
				errorMessage = String(
					(serverResponse.error as { message: string }).message
				);
			} else {
				errorMessage = String(serverResponse.error);
			}

			toastError("Message has not been sent", {
				description: errorMessage,
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="firstName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>First Name</FormLabel>
							<FormControl>
								<Input placeholder="Jane" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="lastName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Last Name</FormLabel>
							<FormControl>
								<Input placeholder="Doe" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email ID</FormLabel>
							<FormControl>
								<Input placeholder="jane.doe@example.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="subject"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Subject</FormLabel>
							<FormControl>
								<Input placeholder="" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="message"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Message</FormLabel>
							<FormControl>
								<Textarea placeholder="" {...field} />
							</FormControl>
							<FormDescription>How can we help you?</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting ? "Sending..." : "Submit"}
				</Button>
			</form>
		</Form>
	);
}
