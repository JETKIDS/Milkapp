import React from 'react';

interface Props {
	page: number;
	totalPages: number;
	onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props) {
	return (
		<div className="pagination">
			<button className="ghost" onClick={() => onChange(1)} disabled={page <= 1}>«</button>
			<button className="ghost" onClick={() => onChange(page - 1)} disabled={page <= 1}>前へ</button>
			<span>{page} / {totalPages}</span>
			<button className="ghost" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>次へ</button>
			<button className="ghost" onClick={() => onChange(totalPages)} disabled={page >= totalPages}>»</button>
		</div>
	);
}


