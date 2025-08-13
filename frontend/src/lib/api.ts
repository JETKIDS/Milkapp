export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: { code: string; message: string; details?: unknown };
}

export async function apiGet<T>(path: string): Promise<T> {
	const res = await fetch(path);
	const json = (await res.json()) as ApiResponse<T>;
	if (!res.ok || !json.success) throw new Error(json.error?.message ?? `Request failed: ${res.status}`);
	return json.data as T;
}

export async function apiJson<TReq, TRes>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: TReq): Promise<TRes> {
	const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
	if (method === 'DELETE') return undefined as unknown as TRes;
	const json = (await res.json()) as ApiResponse<TRes>;
	if (!res.ok || !json.success) throw new Error(json.error?.message ?? `Request failed: ${res.status}`);
	return json.data as TRes;
}

export async function postPdf(path: string, body: unknown): Promise<Blob> {
	const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
	if (!res.ok) throw new Error(`Request failed: ${res.status}`);
	return await res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	URL.revokeObjectURL(url);
	document.body.removeChild(a);
}


