import { FieldError } from 'react-hook-form';
import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	name: string;
	error?: FieldError;
}

export function FormNumberField({ label, name, error, ...rest }: Props) {
	return (
		<label style={{ display: 'block', marginBottom: 12 }}>
			<div style={{ marginBottom: 4 }}>{label}</div>
			<input name={name} type="number" {...rest} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4, width: 180 }} />
			{error && <div style={{ color: 'crimson', marginTop: 4 }}>{error.message}</div>}
		</label>
	);
}


