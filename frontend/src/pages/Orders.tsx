import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '../components/FormTextField';
import { FormNumberField } from '../components/FormNumberField';
import { FormDateTimeField } from '../components/FormDateTimeField';
import { FormSelect } from '../components/FormSelect';
import { apiGet, apiJson, apiGetWithHeaders } from '../lib/api';
import { getDataTyped, postDataTyped } from '../lib/typedApi';
import { paginate, sortBy, SortDir } from '../lib/paging';
import { Pagination } from '../components/Pagination';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { putDataTyped } from '../lib/typedApi';
import { useToast } from '../components/Toast';

const schema = z.object({
	customerId: z.coerce.number().int().positive({ message: '必須です' }),
	productId: z.coerce.number().int().positive({ message: '必須です' }),
	quantity: z.coerce.number().int().positive(),
	unitPrice: z.coerce.number().int().positive(),
});
type FormValues = z.infer<typeof schema>;

export function OrdersPage() {
	const [items, setItems] = React.useState<any[]>([]);
    const toast = useToast();
    const [sp, setSp] = useSearchParams();
    const [sortKey, setSortKey] = React.useState<'id'|'customerId'|'productId'|'quantity'|'unitPrice'>((sp.get('sortKey') as any) ?? 'id');
    const [sortDir, setSortDir] = React.useState<SortDir>((sp.get('sortDir') as SortDir) ?? 'asc');
    const [page, setPage] = React.useState(Number(sp.get('page') ?? '1'));
	const [pageSize] = React.useState(10);
	const [customers, setCustomers] = React.useState<any[]>([]);
	const [products, setProducts] = React.useState<any[]>([]);
	const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
    const eForm = useForm<FormValues & { orderDate?: string }>({ resolver: zodResolver(schema.extend({ orderDate: z.string().optional() })) });
    const [editOpen, setEditOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<any | null>(null);

    const [totalCount, setTotalCount] = React.useState<number | undefined>(undefined);
    const load = async () => {
        const qs = new URLSearchParams({ sortKey, sortDir, page: String(page), pageSize: String(pageSize) }).toString();
        const { data, total } = await apiGetWithHeaders<any[]>(`/api/orders?${qs}`);
        setItems(data);
        setTotalCount(total);
        setCustomers(await apiGet<any[]>('/api/customers'));
        setProducts(await apiGet<any[]>('/api/products'));
    };
	React.useEffect(() => { void load(); }, [sortKey, sortDir, page]);
    React.useEffect(() => {
        const next = new URLSearchParams(sp);
        next.set('sortKey', sortKey);
        next.set('sortDir', sortDir);
        next.set('page', String(page));
        setSp(next, { replace: true });
    }, [sortKey, sortDir, page]);

    const onSubmit = async (v: FormValues) => {
        try {
            await postDataTyped<typeof v & { orderDate: string }, any>('/api/orders', { ...v, orderDate: new Date().toISOString() });
            toast.notify('success', '注文を作成しました');
            reset();
            await load();
        } catch {
            toast.notify('error', '注文の作成に失敗しました');
        }
    };

	return (
		<div className="card">
			<div className="toolbar"><h2 style={{ margin: 0 }}>Orders</h2></div>
			<form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
				<FormSelect label="顧客" {...register('customerId')} error={errors.customerId} options={customers.map((c:any)=>({ value: c.id, label: c.name }))} />
				<FormSelect label="商品" {...register('productId')} error={errors.productId} options={products.map((p:any)=>({ value: p.id, label: p.name }))} />
                <FormNumberField label="数量" {...register('quantity')} error={errors.quantity} />
                <FormNumberField label="単価" {...register('unitPrice')} error={errors.unitPrice} />
				<div><button type="submit" disabled={isSubmitting}>作成</button></div>
			</form>
			{(() => {
                const sorted = sortBy(items, (x:any)=>x[sortKey], sortDir);
                const rows = sorted;
                const total = totalCount ?? rows.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const currentPage = page;
				const onSort = (key: typeof sortKey) => { if (sortKey === key) setSortDir(sortDir==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('asc'); } };
				return (
					<>
						<table>
							<thead><tr>
								<th onClick={()=>onSort('id')}>ID</th>
								<th onClick={()=>onSort('customerId')}>顧客</th>
								<th onClick={()=>onSort('productId')}>商品</th>
								<th onClick={()=>onSort('quantity')}>数量</th>
								<th onClick={()=>onSort('unitPrice')}>単価</th>
                                <th>操作</th>
							</tr></thead>
							<tbody>
								{rows.map((o:any)=>(
                                    <tr key={o.id}><td>{o.id}</td><td>{o.customerId}</td><td>{o.productId}</td><td>{o.quantity}</td><td>{o.unitPrice}</td><td><button className="ghost" onClick={()=>{ setEditing(o); eForm.reset({ customerId: o.customerId, productId: o.productId, quantity: o.quantity, unitPrice: o.unitPrice }); setEditOpen(true); }}>編集</button></td></tr>
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
            <Modal open={editOpen} title={editing ? `注文編集 #${editing.id}` : ''} onClose={()=>{ setEditOpen(false); setEditing(null); }}>
                <form onSubmit={eForm.handleSubmit(async v => {
                    if (!editing) return;
                    try {
                        const payload: any = { quantity: v.quantity, unitPrice: v.unitPrice };
                        const od = (v as any).orderDate;
                        if (od) payload.orderDate = new Date(od).toISOString();
                        await putDataTyped(`/api/orders/${editing.id}`, payload);
                        toast.notify('success', '注文を更新しました');
                        setEditOpen(false);
                        setEditing(null);
                        await load();
                    } catch {
                        toast.notify('error', '注文の更新に失敗しました');
                    }
                })} style={{ display: 'grid', gap: 8 }}>
                    <FormNumberField label="数量" {...eForm.register('quantity')} error={(eForm.formState.errors as any).quantity} />
                    <FormNumberField label="単価" {...eForm.register('unitPrice')} error={(eForm.formState.errors as any).unitPrice} />
                    <FormDateTimeField label="注文日時（任意）" {...(eForm.register as any)('orderDate')} />
                    <div><button type="submit">更新</button></div>
                </form>
            </Modal>
		</div>
	);
}


