import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '../components/FormTextField';
import { FormNumberField } from '../components/FormNumberField';
import { FormSelect } from '../components/FormSelect';
import { apiGet, apiJson } from '../lib/api';
import { getDataTyped, postDataTyped, deleteVoid } from '../lib/typedApi';
import { paginate, sortBy, SortDir } from '../lib/paging';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { Loading } from '../components/Loading';
import { useDebounce } from '../lib/hooks';
import { useSearchParams } from 'react-router-dom';

const schema = z.object({
	name: z.string().min(1, '必須です'),
	manufacturerId: z.coerce.number().int().positive({ message: '必須です' }),
	price: z.coerce.number().int().min(0),
	unit: z.string().min(1, '必須です'),
});
type FormValues = z.infer<typeof schema>;

export function ProductsPage() {
    const toast = useToast();
    const [items, setItems] = React.useState<any[]>([]);
    const [sp, setSp] = useSearchParams();
    const [q, setQ] = React.useState(sp.get('q') ?? '');
    const [sortKey, setSortKey] = React.useState<'id'|'name'|'price'>((sp.get('sortKey') as any) ?? 'id');
    const [sortDir, setSortDir] = React.useState<SortDir>((sp.get('sortDir') as SortDir) ?? 'asc');
    const [page, setPage] = React.useState(Number(sp.get('page') ?? '1'));
	const [pageSize] = React.useState(10);
	const [mans, setMans] = React.useState<any[]>([]);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
    const [editOpen, setEditOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<any | null>(null);

    const [loading, setLoading] = React.useState(false);
    const load = async () => {
        setLoading(true);
        try {
            setItems(await getDataTyped<any[]>('/api/products'));
            setMans(await getDataTyped<any[]>('/api/manufacturers'));
        } catch { toast.notify('error', '商品/メーカーの取得に失敗'); }
        finally { setLoading(false); }
    };
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

    const onSubmit = async (v: FormValues) => { try { await postDataTyped<typeof v, any>('/api/products', v); toast.notify('success','作成しました'); reset(); await load(); } catch { toast.notify('error','作成に失敗'); } };
    const onUpdate = async (id: number, v: FormValues) => { try { await postDataTyped<typeof v, any>(`/api/products/${id}`, v as any); toast.notify('success','更新しました'); setEditOpen(false); setEditing(null); await load(); } catch { toast.notify('error','更新に失敗'); } };
    const onDelete = async (id: number) => { try { await deleteVoid(`/api/products/${id}`); toast.notify('success','削除しました'); await load(); } catch { toast.notify('error','削除に失敗'); } };

	return (
		<div className="card">
            <div className="toolbar">
                <h2 style={{ margin: 0 }}>Products</h2>
                {loading && <Loading />}
				<input className="searchbox" placeholder="検索（商品名/メーカー）" value={q} onChange={(e)=>setQ(e.target.value)} />
			</div>
			<form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
				<FormTextField label="商品名" {...register('name')} error={errors.name} />
				<FormSelect label="メーカー" {...register('manufacturerId')} error={errors.manufacturerId} options={mans.map((m:any)=>({ value: m.id, label: m.name }))} />
				<FormTextField label="価格" type="number" {...register('price')} error={errors.price} />
				<FormTextField label="単位" {...register('unit')} error={errors.unit} />
				<div><button type="submit" disabled={isSubmitting}>作成</button></div>
			</form>
			{(() => {
				const filtered = items.filter((p:any)=>[p.name,p.manufacturer?.name].join(' ').includes(q));
				const sorted = sortBy(filtered, (x:any)=>x[sortKey], sortDir);
				const { items: rows, total, totalPages, currentPage } = paginate(sorted, page, pageSize);
				const onSort = (key: 'id'|'name'|'price') => { if (sortKey === key) setSortDir(sortDir==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('asc'); } };
				return (
					<>
						<table>
							<thead><tr><th onClick={()=>onSort('id')}>ID</th><th onClick={()=>onSort('name')}>商品名</th><th>メーカー</th><th onClick={()=>onSort('price')}>価格</th><th /></tr></thead>
							<tbody>
								{rows.map((p:any)=>(
                            <tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.manufacturer?.name}</td><td>{p.price}</td><td style={{ display: 'flex', gap: 8 }}><button className="ghost" onClick={()=>{ setEditing(p); setEditOpen(true); }}>編集</button><button className="ghost" onClick={()=>onDelete(p.id)}>削除</button></td></tr>
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
        {editOpen && editing && (
            <div className="modal-backdrop" onClick={()=>{ setEditOpen(false); setEditing(null); }}>
                <div className="modal" onClick={(e)=>e.stopPropagation()}>
                    <div className="modal-header">
                        <h3 style={{ margin: 0 }}>商品編集 #{editing.id}</h3>
                        <button className="ghost" onClick={()=>{ setEditOpen(false); setEditing(null); }}>×</button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit(v=>onUpdate(editing.id, v))} style={{ display: 'grid', gap: 8 }}>
                            <FormTextField label="商品名" defaultValue={editing.name} {...register('name')} error={errors.name} />
                            <FormSelect label="メーカー" defaultValue={editing.manufacturerId} {...register('manufacturerId')} error={errors.manufacturerId} options={mans.map((m:any)=>({ value: m.id, label: m.name }))} />
                            <FormNumberField label="価格" defaultValue={editing.price} {...register('price')} error={errors.price} />
                            <FormTextField label="単位" defaultValue={editing.unit} {...register('unit')} error={errors.unit} />
                            <div><button type="submit" disabled={isSubmitting}>更新</button></div>
                        </form>
                    </div>
                </div>
            </div>
        )}
		</div>
	);
}


