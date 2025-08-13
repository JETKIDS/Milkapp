export type SortDir = 'asc' | 'desc';

export function compareValues(a: unknown, b: unknown): number {
	if (a == null && b == null) return 0;
	if (a == null) return -1;
	if (b == null) return 1;
	if (typeof a === 'number' && typeof b === 'number') return a - b;
	const as = String(a);
	const bs = String(b);
	return as.localeCompare(bs, 'ja');
}

export function sortBy<T>(arr: T[], selector: (x: T) => unknown, dir: SortDir = 'asc'): T[] {
	const m = dir === 'asc' ? 1 : -1;
	return [...arr].sort((x, y) => compareValues(selector(x), selector(y)) * m);
}

export function paginate<T>(arr: T[], page: number, pageSize: number) {
	const total = arr.length;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const currentPage = Math.min(Math.max(1, page), totalPages);
	const start = (currentPage - 1) * pageSize;
	return { items: arr.slice(start, start + pageSize), total, totalPages, currentPage };
}


