import React from 'react';

export function Loading() {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
			<div className="spinner" />
			<span>読み込み中...</span>
		</div>
	);
}


