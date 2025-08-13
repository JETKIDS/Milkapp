import { apiGet, apiJson } from './api';

// シンプルな型付きラッパー（呼び出し側でopenapiの型を指定）
export async function getDataTyped<T>(path: string): Promise<T> {
	return apiGet<T>(path);
}

export async function postDataTyped<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
	return apiJson<TReq, TRes>(path, 'POST', body);
}

export async function putDataTyped<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
	return apiJson<TReq, TRes>(path, 'PUT', body);
}

export async function deleteVoid(path: string): Promise<void> {
	await apiJson<undefined, void>(path, 'DELETE');
}


