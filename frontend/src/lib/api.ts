export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: { code: string; message: string; details?: unknown };
}

const API_BASE: string = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE) ? (import.meta as any).env.VITE_API_BASE : '';

function withBase(path: string): string {
    // `path` は基本的に `/api/...` で渡される想定
    if (!API_BASE) return path;
    if (API_BASE.endsWith('/') && path.startsWith('/')) return API_BASE + path.slice(1);
    return API_BASE + path;
}

export async function apiGet<T>(path: string): Promise<T> {
	const res = await fetch(withBase(path));
	
	// レスポンスがJSONでない場合（HTMLエラーページなど）の処理
	const contentType = res.headers.get('content-type');
	if (!contentType || !contentType.includes('application/json')) {
		throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
	}
	
	const json = (await res.json()) as ApiResponse<T>;
	if (!res.ok || !json.success) {
		const errorMessage = json.error?.message ?? `Request failed: ${res.status}`;
		throw new Error(errorMessage);
	}
	return json.data as T;
}

export async function apiGetWithHeaders<T>(path: string): Promise<{ data: T; total?: number }> {
	const res = await fetch(withBase(path));
	
	// レスポンスがJSONでない場合（HTMLエラーページなど）の処理
	const contentType = res.headers.get('content-type');
	if (!contentType || !contentType.includes('application/json')) {
		throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
	}
	
	const json = (await res.json()) as ApiResponse<T>;
	if (!res.ok || !json.success) {
		const errorMessage = json.error?.message ?? `Request failed: ${res.status}`;
		throw new Error(errorMessage);
	}
	const totalHeader = res.headers.get('X-Total-Count') || res.headers.get('x-total-count');
	return { data: json.data as T, total: totalHeader ? Number(totalHeader) : undefined };
}

export async function apiJson<TReq, TRes>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: TReq): Promise<TRes> {
	const res = await fetch(withBase(path), { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
	if (method === 'DELETE') return undefined as unknown as TRes;
	
	// レスポンスがJSONでない場合（HTMLエラーページなど）の処理
	const contentType = res.headers.get('content-type');
	if (!contentType || !contentType.includes('application/json')) {
		throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
	}
	
	const json = (await res.json()) as ApiResponse<TRes>;
	if (!res.ok || !json.success) {
		const errorMessage = json.error?.message ?? `Request failed: ${res.status}`;
		throw new Error(errorMessage);
	}
	return json.data as TRes;
}

export async function postPdf(path: string, body: unknown): Promise<Blob> {
	const res = await fetch(withBase(path), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
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


