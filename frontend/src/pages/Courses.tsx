import React from 'react';
import { apiGet, apiJson } from '../lib/api';
import { getDataTyped, deleteVoid } from '../lib/typedApi';
import { apiGetWithHeaders } from '../lib/api';
import { paginate, sortBy, SortDir } from '../lib/paging';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { Loading } from '../components/Loading';
// 編集機能も新規登録ページに移動
import { useSearchParams, Link } from 'react-router-dom';
import { useDebounce } from '../lib/hooks';

// 登録機能は新規登録ページに移動

export function CoursesPage() {
    const toast = useToast();
    const [items, setItems] = React.useState<any[]>([]);
    const [sp, setSp] = useSearchParams();
    // 検索機能は削除済み
    // 登録機能は新規登録ページに移動したため、検索モードのみ
    const [sortKey, setSortKey] = React.useState<'id'|'name'>((sp.get('sortKey') as any) ?? 'id');
    const [sortDir, setSortDir] = React.useState<SortDir>((sp.get('sortDir') as SortDir) ?? 'asc');
    const [page, setPage] = React.useState(Number(sp.get('page') ?? '1'));
	const [pageSize] = React.useState(10);
    // 登録・編集機能は削除

    const [loading, setLoading] = React.useState(false);
    const [totalCount, setTotalCount] = React.useState<number | undefined>(undefined);
    // デバウンス機能は削除済み
    const load = async () => { setLoading(true); try { const qs = new URLSearchParams({ sortKey, sortDir, page: String(page), pageSize: String(pageSize) }).toString(); const { data, total } = await apiGetWithHeaders<any[]>(`/api/delivery-courses?${qs}`); setItems(data); setTotalCount(total); } catch { toast.notify('error','コース取得に失敗'); } finally { setLoading(false); } };
	React.useEffect(() => { void load(); }, [sortKey, sortDir, page]);
    React.useEffect(() => {
        const next = new URLSearchParams(sp);
        next.set('sortKey', sortKey);
        next.set('sortDir', sortDir);
        next.set('page', String(page));
        setSp(next, { replace: true });
    }, [sortKey, sortDir, page]);

    const onDelete = async (id: number) => { try { await deleteVoid(`/api/delivery-courses/${id}`); toast.notify('success','削除しました'); await load(); } catch { toast.notify('error','削除に失敗'); } };

	return (
		<div className="card">
			<div className="toolbar">
				<h2 style={{ margin: 0 }}>🗺️ 配達コース</h2>
                {loading && <Loading />}
            </div>
            {(() => {
                const rows = items;
                const total = totalCount ?? rows.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const currentPage = page;
				const onSort = (key: 'id'|'name') => { if (sortKey === key) setSortDir(sortDir==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('asc'); } };
				return (
					<>
                        {/* 検索機能は削除済み */}
                        <table>
                            <thead><tr><th className="sortable" onClick={()=>onSort('id')}>ID <span className="indicator">{sortKey==='id' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th><th className="sortable" onClick={()=>onSort('name')}>コース名 <span className="indicator">{sortKey==='name' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th><th>操作</th></tr></thead>
							<tbody>
                                {rows.map((c:any)=>(
                                    <tr key={c.id}>
                                        <td>{c.id}</td>
                                        <td>{c.name}</td>
                                        <td style={{ display: 'flex', gap: 8 }}>
                                            <Link to={`/courses/${c.id}`}>
                                                <button className="ghost" style={{ color: 'var(--primary)' }}>
                                                    詳細・管理
                                                </button>
                                            </Link>
                                            <button className="ghost" onClick={()=>onDelete(c.id)} style={{ color: 'red' }}>
                                                削除
                                            </button>
                                        </td>
                                    </tr>
								))}
							</tbody>
						</table>
						<div className="toolbar" style={{ marginTop: 12 }}>
							<div>全{total}件</div>
							<Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
        {/* 編集機能は新規登録ページに移動 */}
					</>
				);
            })()}
		</div>
	);
}


