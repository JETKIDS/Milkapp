import React, { ReactNode } from 'react';

interface Props {
	open: boolean;
	title?: string;
	children?: ReactNode;
	onClose: () => void;
}

export function Modal({ open, title, children, onClose }: Props) {
	if (!open) return null;
	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal" onClick={(e)=>e.stopPropagation()}>
				<div className="modal-header">
					<h3 style={{ margin: 0 }}>{title}</h3>
					<button className="ghost" onClick={onClose}>×</button>
				</div>
				<div className="modal-body">{children}</div>
			</div>
		</div>
	);
}


