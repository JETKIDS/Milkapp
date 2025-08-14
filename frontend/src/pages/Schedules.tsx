import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
    const toast = useToast();
    const [sp, setSp] = useSearchParams();
    const [sortKey, setSortKey] = React.useState<'id'|'customerId'|'dayOfWeek'>((sp.get('sortKey') as any) ?? 'id');
    const [sortDir, setSortDir] = React.useState<SortDir>((sp.get('sortDir') as SortDir) ?? 'asc');
    const [page, setPage] = React.useState(Number(sp.get('page') ?? '1'));
	const [pageSize] = React.useState(10);
	const [customers, setCustomers] = React.useState<any[]>([]);
	const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
    const eForm = useForm<FormValues>({ resolver: zodResolver(schema) });
    const [editOpen, setEditOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<any | null>(null);

    const [totalCount, setTotalCount] = React.useState<number | undefined>(undefined);
    const load = async () => {
        const qs = new URLSearchParams({ sortKey, sortDir, page: String(page), pageSize: String(pageSize) }).toString();
        const { data, total } = await apiGetWithHeaders<any[]>(`/api/schedules?${qs}`);
        setItems(data);
        setTotalCount(total);
        setCustomers(await getDataTyped<any[]>('/api/customers'));
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
        try { await postDataTyped<typeof v, any>('/api/schedules', v); toast.notify('success','スケジュールを作成しました'); reset(); await load(); }
        catch { toast.notify('error','スケジュールの作成に失敗しました'); }
    };
    const complete = async (id: number) => {
        try { await postDataTyped<{ date: string }, any>(`/api/schedules/complete/${id}`, { date: new Date().toISOString() }); toast.notify('success','完了にしました'); await load(); }
        catch { toast.notify('error','完了処理に失敗しました'); }
    };

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
                const rows = sorted;
                const total = totalCount ?? rows.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const currentPage = page;
				const onSort = (key: typeof sortKey) => { if (sortKey === key) setSortDir(sortDir==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('asc'); } };
				return (
					<>
						<table>
							<thead><tr><th onClick={()=>onSort('id')}>ID</th><th onClick={()=>onSort('customerId')}>顧客</th><th onClick={()=>onSort('dayOfWeek')}>曜日</th><th>操作</th></tr></thead>
							<tbody>
								{rows.map((s:any)=>(
                                    <tr key={s.id}><td>{s.id}</td><td>{s.customerId}</td><td>{s.dayOfWeek}</td><td style={{ display: 'flex', gap: 8 }}><button className="ghost" onClick={()=>{ setEditing(s); eForm.reset({ customerId: s.customerId, dayOfWeek: s.dayOfWeek }); setEditOpen(true); }}>編集</button><button className="secondary" onClick={()=>complete(s.id)}>完了</button></td></tr>
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
            <Modal open={editOpen} title={editing ? `スケジュール編集 #${editing.id}` : ''} onClose={()=>{ setEditOpen(false); setEditing(null); }}>
                <form onSubmit={eForm.handleSubmit(async v => {
                    if (!editing) return;
                    try { await putDataTyped(`/api/schedules/${editing.id}`, { customerId: editing.customerId, dayOfWeek: v.dayOfWeek }); toast.notify('success','スケジュールを更新しました'); setEditOpen(false); setEditing(null); await load(); }
                    catch { toast.notify('error','スケジュールの更新に失敗しました'); }
                })} style={{ display: 'grid', gap: 8 }}>
                    <FormSelect label="曜日" {...eForm.register('dayOfWeek')} error={eForm.formState.errors.dayOfWeek} options={days} />
                    <div><button type="submit">更新</button></div>
                </form>
            </Modal>
		</div>
	);
}


