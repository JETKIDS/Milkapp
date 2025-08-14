import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '../components/FormTextField';
import { apiGet, apiJson } from '../lib/api';
import { getDataTyped, postDataTyped, deleteVoid, putDataTyped } from '../lib/typedApi';
import { apiGetWithHeaders } from '../lib/api';
import { Modal } from '../components/Modal';
import { paginate, sortBy, SortDir } from '../lib/paging';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { Loading } from '../components/Loading';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDebounce } from '../lib/hooks';

const schema = z.object({
	name: z.string().min(1, '必須です'),
	address: z.string().min(1, '必須です'),
});
type FormValues = z.infer<typeof schema>;

export function CustomersPage() {
	const toast = useToast();
	const [items, setItems] = React.useState<any[]>([]);
    const [sp, setSp] = useSearchParams();
    const nav = useNavigate();
    const [q, setQ] = React.useState(sp.get('q') ?? '');
    const [sortKey, setSortKey] = React.useState<'id'|'name'|'address'>((sp.get('sortKey') as any) ?? 'id');
    const [sortDir, setSortDir] = React.useState<SortDir>((sp.get('sortDir') as SortDir) ?? 'asc');
    const [page, setPage] = React.useState(Number(sp.get('page') ?? '1'));
	const [pageSize] = React.useState(10);
    const [loading, setLoading] = React.useState(false);
    const [totalCount, setTotalCount] = React.useState<number | undefined>(undefined);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
    const eForm = useForm<FormValues>({ resolver: zodResolver(schema) });
    const [editOpen, setEditOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<any | null>(null);

    const qDebounced = useDebounce(q, 300);

    const load = async () => {
		setLoading(true);
        try {
            const qs = new URLSearchParams({ q: qDebounced, sortKey, sortDir, page: String(page), pageSize: String(pageSize) }).toString();
            const { data, total } = await apiGetWithHeaders<any[]>(`/api/customers?${qs}`);
            setItems(data);
            setTotalCount(total);
        }
		catch { toast.notify('error', '顧客の取得に失敗しました'); }
		finally { setLoading(false); }
	};
	React.useEffect(() => { void load(); }, [qDebounced, sortKey, sortDir, page]);
    React.useEffect(() => {
        const next = new URLSearchParams(sp);
        next.set('q', qDebounced);
        next.set('sortKey', sortKey);
        next.set('sortDir', sortDir);
        next.set('page', String(page));
        setSp(next, { replace: true });
    }, [qDebounced, sortKey, sortDir, page]);

	const onSubmit = async (v: FormValues) => {
        try {
            await postDataTyped<typeof v, any>('/api/customers', v);
			toast.notify('success', '顧客を作成しました');
			reset();
			await load();
		} catch { toast.notify('error', '作成に失敗しました'); }
	};

    const onDelete = async (id: number) => {
        try { await deleteVoid(`/api/customers/${id}`); toast.notify('success', '削除しました'); await load(); }
		catch { toast.notify('error', '削除に失敗しました'); }
	};

	return (
		<div className="card">
			<div className="toolbar">
				<h2 style={{ margin: 0 }}>Customers</h2>
				{loading && <Loading />}
				<input className="searchbox" placeholder="検索（名前/住所）" value={q} onChange={(e)=>setQ(e.target.value)} />
			</div>
			<form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
				<FormTextField label="名前" {...register('name')} error={errors.name} />
				<FormTextField label="住所" {...register('address')} error={errors.address} />
				<div><button type="submit" disabled={isSubmitting}>作成</button></div>
			</form>
			{(() => {
                const rows = items;
                const total = totalCount ?? rows.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const currentPage = page;
                const onSort = (key: 'id'|'name'|'address') => {
					if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('asc'); }
				};
				return (
					<>
						<table>
							<thead>
								<tr>
									<th onClick={()=>onSort('id')}>ID</th>
									<th onClick={()=>onSort('name')}>名前</th>
									<th onClick={()=>onSort('address')}>住所</th>
									<th />
								</tr>
							</thead>
							<tbody>
                                {rows.map((c:any) => (
						<tr key={c.id}>
							<td>{c.id}</td><td>{c.name}</td><td>{c.address}</td>
							<td style={{ display: 'flex', gap: 8 }}>
                                            <button className="ghost" onClick={()=>{ setEditing(c); eForm.reset({ name: c.name, address: c.address }); setEditOpen(true); }}>編集</button>
								<Link className="ghost" to={`/customers/${c.id}/detail`}>詳細</Link>
								<Link className="ghost" to={`/customers/${c.id}/contracts`}>契約</Link>
								<button className="ghost" onClick={() => onDelete(c.id)}>削除</button>
							</td>
						</tr>
								))}
							</tbody>
						</table>
                        <div className="toolbar" style={{ marginTop: 12 }}>
                            <div>全{total}件</div>
                            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
                        </div>
					</>
				);
			})()}
        <Modal open={editOpen} title={editing ? `顧客編集 #${editing.id}` : ''} onClose={()=>{ setEditOpen(false); setEditing(null); }}>
            <form onSubmit={eForm.handleSubmit(async v => { if (!editing) return; try { await putDataTyped(`/api/customers/${editing.id}`, v); toast.notify('success','更新しました'); setEditOpen(false); setEditing(null); await load(); } catch { toast.notify('error','更新に失敗'); } })} style={{ display: 'grid', gap: 8 }}>
                <FormTextField label="名前" {...eForm.register('name')} error={eForm.formState.errors.name} />
                <FormTextField label="住所" {...eForm.register('address')} error={eForm.formState.errors.address} />
                <div><button type="submit">更新</button></div>
            </form>
        </Modal>
		</div>
	);
}


