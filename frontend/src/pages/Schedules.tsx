import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSelect } from '../components/FormSelect';
import { apiGet, apiJson } from '../lib/api';
import { getDataTyped, postDataTyped } from '../lib/typedApi';
import { paginate, sortBy, SortDir } from '../lib/paging';
import { Pagination } from '../components/Pagination';
import { useSearchParams } from 'react-router-dom';

const schema = z.object({
	customerId: z.coerce.number().int().positive({ message: '必須です' }),
	dayOfWeek: z.coerce.number().int().min(0).max(6),
});
type FormValues = z.infer<typeof schema>;

const days = [
	{ value: 0, label: '日' },
	{ value: 1, label: '月' },
	{ value: 2, label: '火' },
	{ value: 3, label: '水' },
	{ value: 4, label: '木' },
	{ value: 5, label: '金' },
	{ value: 6, label: '土' },
];

export function SchedulesPage() {
	const [items, setItems] = React.useState<any[]>([]);
    const [sp, setSp] = useSearchParams();
    const [sortKey, setSortKey] = React.useState<'id'|'customerId'|'dayOfWeek'>((sp.get('sortKey') as any) ?? 'id');
    const [sortDir, setSortDir] = React.useState<SortDir>((sp.get('sortDir') as SortDir) ?? 'asc');
    const [page, setPage] = React.useState(Number(sp.get('page') ?? '1'));
	const [pageSize] = React.useState(10);
	const [customers, setCustomers] = React.useState<any[]>([]);
	const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const load = async () => {
        setItems(await getDataTyped<any[]>('/api/schedules'));
        setCustomers(await getDataTyped<any[]>('/api/customers'));
    };
	React.useEffect(() => { void load(); }, []);
    React.useEffect(() => {
        const next = new URLSearchParams(sp);
        next.set('sortKey', sortKey);
        next.set('sortDir', sortDir);
        next.set('page', String(page));
        setSp(next, { replace: true });
    }, [sortKey, sortDir, page]);

    const onSubmit = async (v: FormValues) => { await postDataTyped<typeof v, any>('/api/schedules', v); reset(); await load(); };
    const complete = async (id: number) => { await postDataTyped<{ date: string }, any>(`/api/schedules/complete/${id}`, { date: new Date().toISOString() }); await load(); };

	return (
		<div className="card">
			<div className="toolbar"><h2 style={{ margin: 0 }}>Schedules</h2></div>
			<form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
				<FormSelect label="顧客" {...register('customerId')} error={errors.customerId} options={customers.map((c:any)=>({ value: c.id, label: c.name }))} />
				<FormSelect label="曜日" {...register('dayOfWeek')} error={errors.dayOfWeek} options={days} />
				<div><button type="submit" disabled={isSubmitting}>作成</button></div>
			</form>
			{(() => {
				const sorted = sortBy(items, (x:any)=>x[sortKey], sortDir);
				const { items: rows, total, totalPages, currentPage } = paginate(sorted, page, pageSize);
				const onSort = (key: typeof sortKey) => { if (sortKey === key) setSortDir(sortDir==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('asc'); } };
				return (
					<>
						<table>
							<thead><tr><th onClick={()=>onSort('id')}>ID</th><th onClick={()=>onSort('customerId')}>顧客</th><th onClick={()=>onSort('dayOfWeek')}>曜日</th><th>操作</th></tr></thead>
							<tbody>
								{rows.map((s:any)=>(
									<tr key={s.id}><td>{s.id}</td><td>{s.customerId}</td><td>{s.dayOfWeek}</td><td><button className="secondary" onClick={()=>complete(s.id)}>完了</button></td></tr>
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


