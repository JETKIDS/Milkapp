import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '../components/FormTextField';
import { deleteVoid } from '../lib/typedApi';
import { apiGetWithHeaders } from '../lib/api';
import { paginate, sortBy, SortDir } from '../lib/paging';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { Loading } from '../components/Loading';
import { Modal } from '../components/Modal';
import { putDataTyped } from '../lib/typedApi';
import { useDebounce } from '../lib/hooks';
import { useSearchParams } from 'react-router-dom';

const schema = z.object({ name: z.string().min(1, '必須です') });
type FormValues = z.infer<typeof schema>;

export function ManufacturersPage() {
    const toast = useToast();
    const [items, setItems] = React.useState<any[]>([]);
    const [sp, setSp] = useSearchParams();
    const [q, setQ] = React.useState(sp.get('q') ?? '');

    const [sortKey, setSortKey] = React.useState<'id'|'name'>((sp.get('sortKey') as any) ?? 'id');
    const [sortDir, setSortDir] = React.useState<SortDir>((sp.get('sortDir') as SortDir) ?? 'asc');
    const [page, setPage] = React.useState(Number(sp.get('page') ?? '1'));
	const [pageSize] = React.useState(10);

    const eForm = useForm<FormValues>({ resolver: zodResolver(schema) });
    const [editOpen, setEditOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<any | null>(null);

    const [loading, setLoading] = React.useState(false);
    const [totalCount, setTotalCount] = React.useState<number | undefined>(undefined);
    const qDebounced = useDebounce(q, 300);
    const load = async () => { setLoading(true); try { const qs = new URLSearchParams({ q: qDebounced, sortKey, sortDir, page: String(page), pageSize: String(pageSize) }).toString(); const { data, total } = await apiGetWithHeaders<any[]>(`/api/manufacturers?${qs}`); setItems(data); setTotalCount(total); } catch { toast.notify('error', 'メーカー取得に失敗'); } finally { setLoading(false); } };
	React.useEffect(() => { void load(); }, [qDebounced, sortKey, sortDir, page]);
    React.useEffect(() => {
        const next = new URLSearchParams(sp);
        next.set('q', qDebounced);
        next.set('sortKey', sortKey);
        next.set('sortDir', sortDir);
        next.set('page', String(page));

        setSp(next, { replace: true });
    }, [qDebounced, sortKey, sortDir, page]);


    const onDelete = async (id: number) => { try { await deleteVoid(`/api/manufacturers/${id}`); toast.notify('success','削除しました'); await load(); } catch { toast.notify('error','削除に失敗'); } };

	return (
		<div className="card">
			<div className="toolbar">
				<h2 style={{ margin: 0 }}>🏭 メーカー</h2>
                {loading && <Loading />}
            </div>
            <div className="toolbar" style={{ padding: 0, marginBottom: 12 }}>
                <input className="searchbox" placeholder="検索（メーカー名）" value={q} onChange={(e)=>setQ(e.target.value)} />
            </div>
            {(() => {
                const rows = items;
                const total = totalCount ?? rows.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const currentPage = page;
				const onSort = (key: 'id'|'name') => { if (sortKey === key) setSortDir(sortDir==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('asc'); } };
				return (
					<>
                        <table>
                            <thead><tr><th className="sortable" onClick={()=>onSort('id')}>ID <span className="indicator">{sortKey==='id' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th><th className="sortable" onClick={()=>onSort('name')}>メーカー名 <span className="indicator">{sortKey==='name' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th><th /></tr></thead>
							<tbody>
                                {rows.map((m:any)=>(
                                    <tr key={m.id}><td>{m.id}</td><td>{m.name}</td><td style={{ display: 'flex', gap: 8 }}><button className="ghost" onClick={()=>{ setEditing(m); eForm.reset({ name: m.name }); setEditOpen(true); }}>編集</button><button className="ghost" onClick={()=>onDelete(m.id)}>削除</button></td></tr>
								))}
							</tbody>
						</table>
						<div className="toolbar" style={{ marginTop: 12 }}>
							<div>全{total}件</div>
							<Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
        <Modal open={editOpen} title={editing ? `メーカー編集 #${editing.id}` : ''} onClose={()=>{ setEditOpen(false); setEditing(null); }}>
            <form onSubmit={eForm.handleSubmit(async v => { if (!editing) return; try { await putDataTyped(`/api/manufacturers/${editing.id}`, v); toast.notify('success','更新しました'); setEditOpen(false); setEditing(null); await load(); } catch { toast.notify('error','更新に失敗'); } })} style={{ display: 'grid', gap: 8 }}>
                <FormTextField label="メーカー名" {...eForm.register('name')} error={eForm.formState.errors.name} />
                <div><button type="submit">更新</button></div>
            </form>
        </Modal>
					</>
				);
            })()}
		</div>
	);
}


