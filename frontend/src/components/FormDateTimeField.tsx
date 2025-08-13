import { FieldError } from 'react-hook-form';
import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	name: string;
	error?: FieldError;
}

export function FormDateTimeField({ label, name, error, ...rest }: Props) {
	return (
		<label style={{ display: 'block', marginBottom: 12 }}>
			<div style={{ marginBottom: 4 }}>{label}</div>
			<input name={name} type="datetime-local" {...rest} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4, width: 260 }} />
			{error && <div style={{ color: 'crimson', marginTop: 4 }}>{error.message}</div>}
		</label>
	);
}


