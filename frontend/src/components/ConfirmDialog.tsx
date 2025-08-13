import React, { ReactNode } from 'react';

interface Props {
	open: boolean;
	title?: string;
	children?: ReactNode;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({ open, title = '確認', children, onConfirm, onCancel }: Props) {
	if (!open) return null;
	return (
		<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center' }}>
			<div style={{ background: '#fff', padding: 16, borderRadius: 8, minWidth: 320 }}>
				<h3 style={{ marginTop: 0 }}>{title}</h3>
				<div style={{ margin: '12px 0' }}>{children}</div>
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
					<button onClick={onCancel}>キャンセル</button>
					<button onClick={onConfirm} style={{ background: '#1976d2', color: '#fff' }}>OK</button>
				</div>
			</div>
		</div>
	);
}


