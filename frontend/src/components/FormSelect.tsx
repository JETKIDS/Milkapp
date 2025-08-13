import { FieldError } from 'react-hook-form';
import React from 'react';

interface Option { value: string | number; label: string }

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label: string;
	name: string;
	error?: FieldError;
	options: Option[];
}

export function FormSelect({ label, name, error, options, ...rest }: Props) {
	return (
		<label style={{ display: 'block', marginBottom: 12 }}>
			<div style={{ marginBottom: 4 }}>{label}</div>
			<select name={name} {...rest} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4, width: 320 }}>
				<option value="">選択してください</option>
				{options.map(opt => (
					<option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
				))}
			</select>
			{error && <div style={{ color: 'crimson', marginTop: 4 }}>{error.message}</div>}
		</label>
	);
}


