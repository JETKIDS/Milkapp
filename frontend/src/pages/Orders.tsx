import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '../components/FormTextField';
import { FormNumberField } from '../components/FormNumberField';
import { FormDateTimeField } from '../components/FormDateTimeField';
import { FormSelect } from '../components/FormSelect';
import { apiGet, apiJson } from '../lib/api';
import { getDataTyped, postDataTyped } from '../lib/typedApi';
import { paginate, sortBy, SortDir } from '../lib/paging';
import { Pagination } from '../components/Pagination';
import { useSearchParams } from 'react-router-dom';

const schema = z.object({
	customerId: z.coerce.number().int().positive({ message: '必須です' }),
	productId: z.coerce.number().int().positive({ message: '必須です' }),
	quantity: z.coerce.number().int().positive(),
	unitPrice: z.coerce.number().int().positive(),
});
type FormValues = z.infer<typeof schema>;

export function OrdersPage() {
	const [items, setItems] = React.useState<any[]>([]);
    const [sp, setSp] = useSearchParams();
    const [sortKey, setSortKey] = React.useState<'id'|'customerId'|'productId'|'quantity'|'unitPrice'>((sp.get('sortKey') as any) ?? 'id');
    const [sortDir, setSortDir] = React.useState<SortDir>((sp.get('sortDir') as SortDir) ?? 'asc');
    const [page, setPage] = React.useState(Number(sp.get('page') ?? '1'));
	const [pageSize] = React.useState(10);
	const [customers, setCustomers] = React.useState<any[]>([]);
	const [products, setProducts] = React.useState<any[]>([]);
	const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const load = async () => {
		setItems(await apiGet<any[]>('/api/orders'));
		setCustomers(await apiGet<any[]>('/api/customers'));
		setProducts(await apiGet<any[]>('/api/products'));
	};
	React.useEffect(() => { void load(); }, []);
    React.useEffect(() => {
        const next = new URLSearchParams(sp);
        next.set('sortKey', sortKey);
        next.set('sortDir', sortDir);
        next.set('page', String(page));
        setSp(next, { replace: true });
    }, [sortKey, sortDir, page]);

    const onSubmit = async (v: FormValues) => { await postDataTyped<typeof v & { orderDate: string }, any>('/api/orders', { ...v, orderDate: new Date().toISOString() }); reset(); await load(); };

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
				const { items: rows, total, totalPages, currentPage } = paginate(sorted, page, pageSize);
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
							</tr></thead>
							<tbody>
								{rows.map((o:any)=>(
									<tr key={o.id}><td>{o.id}</td><td>{o.customerId}</td><td>{o.productId}</td><td>{o.quantity}</td><td>{o.unitPrice}</td></tr>
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
		</div>
	);
}


