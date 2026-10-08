import * as React from "react";

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";

interface VocabularyComboboxProps {
	name?: string;
	value: string;
	terms: string[];
	placeholder?: string;
	onChange?: (value: string) => void;
}

export function VocabularyCombobox({
	name,
	value,
	terms,
	placeholder = "Select a value...",
	onChange,
}: VocabularyComboboxProps) {
	const [selectedValue, setSelectedValue] = React.useState(value);
	const [inputValue, setInputValue] = React.useState(value);

	React.useEffect(() => {
		setSelectedValue(value);
		setInputValue(value);
	}, [value]);

	const handleChange = (newValue: string | null) => {
		const nextValue = newValue ?? "";

		setSelectedValue(nextValue);
		setInputValue(nextValue);

		onChange?.(nextValue);
	};

	return (
		<>
			{name && (
				<input type="hidden" name={name} value={selectedValue} readOnly />
			)}

			<Combobox
				items={terms}
				value={selectedValue}
				onValueChange={handleChange}
				inputValue={inputValue}
				onInputValueChange={setInputValue}
			>
				<ComboboxInput placeholder={placeholder} />

				<ComboboxContent
					onWheel={(e) => e.stopPropagation()}
					className="pointer-events-auto"
				>
					<ComboboxList>
						{(term) => (
							<ComboboxItem key={term} value={term}>
								{term}
							</ComboboxItem>
						)}
					</ComboboxList>

					<ComboboxEmpty>No values found.</ComboboxEmpty>
				</ComboboxContent>
			</Combobox>
		</>
	);
}
