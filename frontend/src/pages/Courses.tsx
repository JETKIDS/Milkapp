import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '../components/FormTextField';
import { apiGet, apiJson } from '../lib/api';
import { getDataTyped, postDataTyped, deleteVoid } from '../lib/typedApi';
import { paginate, sortBy, SortDir } from '../lib/paging';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { Loading } from '../components/Loading';
import { Modal } from '../components/Modal';
import { putDataTyped } from '../lib/typedApi';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '../lib/hooks';

const schema = z.object({ name: z.string().min(1, '必須です') });
type FormValues = z.infer<typeof schema>;

export function CoursesPage() {
    const toast = useToast();
    const [items, setItems] = React.useState<any[]>([]);
    const [sp, setSp] = useSearchParams();
    const [q, setQ] = React.useState(sp.get('q') ?? '');
    const [sortKey, setSortKey] = React.useState<'id'|'name'>((sp.get('sortKey') as any) ?? 'id');
    const [sortDir, setSortDir] = React.useState<SortDir>((sp.get('sortDir') as SortDir) ?? 'asc');
    const [page, setPage] = React.useState(Number(sp.get('page') ?? '1'));
	const [pageSize] = React.useState(10);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
    const eForm = useForm<FormValues>({ resolver: zodResolver(schema) });
    const [editOpen, setEditOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<any | null>(null);

    const [loading, setLoading] = React.useState(false);
    const load = async () => { setLoading(true); try { setItems(await getDataTyped<any[]>('/api/delivery-courses')); } catch { toast.notify('error','コース取得に失敗'); } finally { setLoading(false); } };
	React.useEffect(() => { void load(); }, []);
    const qDebounced = useDebounce(q, 300);
    React.useEffect(() => {
        const next = new URLSearchParams(sp);
        next.set('q', qDebounced);
        next.set('sortKey', sortKey);
        next.set('sortDir', sortDir);
        next.set('page', String(page));
        setSp(next, { replace: true });
    }, [qDebounced, sortKey, sortDir, page]);

    const onSubmit = async (v: FormValues) => { try { await postDataTyped<typeof v, any>('/api/delivery-courses', v); toast.notify('success','作成しました'); reset(); await load(); } catch { toast.notify('error','作成に失敗'); } };
    const onDelete = async (id: number) => { try { await deleteVoid(`/api/delivery-courses/${id}`); toast.notify('success','削除しました'); await load(); } catch { toast.notify('error','削除に失敗'); } };

	return (
		<div className="card">
            <div className="toolbar">
                <h2 style={{ margin: 0 }}>Delivery Courses</h2>
                {loading && <Loading />}
				<input className="searchbox" placeholder="検索（コース名）" value={q} onChange={(e)=>setQ(e.target.value)} />
			</div>
			<form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
				<FormTextField label="コース名" {...register('name')} error={errors.name} />
				<div><button type="submit" disabled={isSubmitting}>作成</button></div>
			</form>
			{(() => {
				const filtered = items.filter((c:any)=>String(c.name).includes(q));
				const sorted = sortBy(filtered, (x:any)=>x[sortKey], sortDir);
				const { items: rows, total, totalPages, currentPage } = paginate(sorted, page, pageSize);
				const onSort = (key: 'id'|'name') => { if (sortKey === key) setSortDir(sortDir==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('asc'); } };
				return (
					<>
						<table>
							<thead><tr><th onClick={()=>onSort('id')}>ID</th><th onClick={()=>onSort('name')}>コース名</th><th /></tr></thead>
							<tbody>
                                {rows.map((c:any)=>(
                                    <tr key={c.id}><td>{c.id}</td><td>{c.name}</td><td style={{ display: 'flex', gap: 8 }}><button className="ghost" onClick={()=>{ setEditing(c); eForm.reset({ name: c.name }); setEditOpen(true); }}>編集</button><button className="ghost" onClick={()=>onDelete(c.id)}>削除</button></td></tr>
								))}
							</tbody>
						</table>
						<div className="toolbar" style={{ marginTop: 12 }}>
							<div>全{total}件</div>
							<Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
        <Modal open={editOpen} title={editing ? `コース編集 #${editing.id}` : ''} onClose={()=>{ setEditOpen(false); setEditing(null); }}>
            <form onSubmit={eForm.handleSubmit(async v => { if (!editing) return; try { await putDataTyped(`/api/delivery-courses/${editing.id}`, v); toast.notify('success','更新しました'); setEditOpen(false); setEditing(null); await load(); } catch { toast.notify('error','更新に失敗'); } })} style={{ display: 'grid', gap: 8 }}>
                <FormTextField label="コース名" {...eForm.register('name')} error={eForm.formState.errors.name} />
                <div><button type="submit">更新</button></div>
            </form>
        </Modal>
					</>
				);
			})()}
		</div>
	);
}


