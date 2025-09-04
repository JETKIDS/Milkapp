import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '../components/FormTextField';
import { FormSelect } from '../components/FormSelect';
import { deleteVoid, putDataTyped } from '../lib/typedApi';
import { apiGetWithHeaders } from '../lib/api';
import { Modal } from '../components/Modal';
import { sortBy, SortDir } from '../lib/paging';
import { useToast } from '../components/Toast';
import { Loading } from '../components/Loading';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useDebounce } from '../lib/hooks';

const schema = z.object({
	name: z.string().min(1, '必須です'),
	address: z.string().min(1, '必須です'),
	phone: z.string().optional(),
	collectionMethod: z.string().optional(),
});
 type FormValues = z.infer<typeof schema>;

export function CustomersPage() {
	const toast = useToast();
	const [items, setItems] = React.useState<any[]>([]);
    const [sp, setSp] = useSearchParams();
    const nav = useNavigate();
    const [idSearch, setIdSearch] = React.useState(sp.get('idSearch') ?? '');
    const [nameSearch, setNameSearch] = React.useState(sp.get('nameSearch') ?? '');
    const [phoneSearch, setPhoneSearch] = React.useState(sp.get('phoneSearch') ?? '');
    const [addressSearch, setAddressSearch] = React.useState(sp.get('addressSearch') ?? '');
    const [sortKey, setSortKey] = React.useState<'id'|'name'|'address'|'phone'>((sp.get('sortKey') as any) ?? 'id');
    const [sortDir, setSortDir] = React.useState<SortDir>((sp.get('sortDir') as SortDir) ?? 'asc');
    // ページングは廃止
    const [loading, setLoading] = React.useState(false);
    const [totalCount, setTotalCount] = React.useState<number | undefined>(undefined);

    const eForm = useForm<FormValues>({ resolver: zodResolver(schema) });
    const [editOpen, setEditOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<any | null>(null);

    const idSearchDebounced = useDebounce(idSearch, 300);
    const nameSearchDebounced = useDebounce(nameSearch, 300);
    const phoneSearchDebounced = useDebounce(phoneSearch, 300);
    const addressSearchDebounced = useDebounce(addressSearch, 300);

    const load = async () => {
		setLoading(true);
        try {
            const qs = new URLSearchParams({ 
                idSearch: idSearchDebounced,
                nameSearch: nameSearchDebounced,
                phoneSearch: phoneSearchDebounced,
                addressSearch: addressSearchDebounced,
                sortKey,
                sortDir,
                all: '1'
            }).toString();
            const { data, total } = await apiGetWithHeaders<any[]>(`/api/customers?${qs}`);
            setItems(data);
            setTotalCount(total);
        }
		catch { toast.notify('error', '顧客の取得に失敗しました'); }
		finally { setLoading(false); }
	};
	React.useEffect(() => { void load(); }, [idSearchDebounced, nameSearchDebounced, phoneSearchDebounced, addressSearchDebounced, sortKey, sortDir]);
    React.useEffect(() => {
        const next = new URLSearchParams(sp);
        next.set('idSearch', idSearchDebounced);
        next.set('nameSearch', nameSearchDebounced);
        next.set('phoneSearch', phoneSearchDebounced);
        next.set('addressSearch', addressSearchDebounced);
        next.set('sortKey', sortKey);
        next.set('sortDir', sortDir);
        setSp(next, { replace: true });
    }, [idSearchDebounced, nameSearchDebounced, phoneSearchDebounced, addressSearchDebounced, sortKey, sortDir]);



    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [deleteId, setDeleteId] = React.useState<number | null>(null);
    const onDelete = async (id: number) => {
        try { await deleteVoid(`/api/customers/${id}`); toast.notify('success', '削除しました'); await load(); }
        catch { toast.notify('error', '削除に失敗しました'); }
    };

	return (
		<div className="card">
			<div className="toolbar">
				<h2 style={{ margin: 0 }}>👥 顧客</h2>
                {loading && <Loading />}
            </div>
            <div style={{ marginBottom: 16, padding: '0 8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: 'var(--text)' }}>
                            ID検索
                        </label>
                        <input 
                            className="searchbox" 
                            placeholder="IDを入力..."
                            value={idSearch} 
                            onChange={(e)=>setIdSearch(e.target.value)} 
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: 'var(--text)' }}>
                            名前検索
                        </label>
                        <input 
                            className="searchbox" 
                            placeholder="名前を入力..."
                            value={nameSearch} 
                            onChange={(e)=>setNameSearch(e.target.value)} 
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: 'var(--text)' }}>
                            電話番号検索
                        </label>
                        <input 
                            className="searchbox" 
                            placeholder="電話番号を入力..."
                            value={phoneSearch} 
                            onChange={(e)=>setPhoneSearch(e.target.value)} 
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: 'var(--text)' }}>
                            住所検索
                        </label>
                        <input 
                            className="searchbox" 
                            placeholder="住所を入力..."
                            value={addressSearch} 
                            onChange={(e)=>setAddressSearch(e.target.value)} 
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
            </div>
            {(() => {
                const rows = items;
                const total = totalCount ?? rows.length;
                const onSort = (key: 'id'|'name'|'address'|'phone') => {
                    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('asc'); }
                };
                return (
                    <>
                    <div style={{ maxHeight: 520, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th className="sortable" onClick={()=>onSort('id')}>ID <span className="indicator">{sortKey==='id' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                                    <th className="sortable" onClick={()=>onSort('name')}>名前 <span className="indicator">{sortKey==='name' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                                    <th className="sortable" onClick={()=>onSort('phone')}>電話番号 <span className="indicator">{sortKey==='phone' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                                    <th className="sortable" onClick={()=>onSort('address')}>住所 <span className="indicator">{sortKey==='address' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((c:any) => (
                        <tr key={c.id} className="clickable" onClick={()=>nav(`/customers/${c.id}/detail`)}>
                            <td>{c.id}</td><td>{c.name}</td><td>{c.phone || '-'}</td><td>{c.address}</td>
                            <td style={{ display: 'flex', gap: 8 }} onClick={(e)=>e.stopPropagation()}>
                                            <button className="ghost" onClick={()=>{ setEditing(c); eForm.reset({ name: c.name, address: c.address, phone: c.phone || '', collectionMethod: c.collectionMethod || '' }); setEditOpen(true); }}>編集</button>
                                <Link className="ghost" to={`/customers/${c.id}/detail`}>詳細</Link>
                                <Link className="ghost" to={`/customers/${c.id}/contracts`}>契約</Link>
                                <button className="ghost" onClick={() => { setDeleteId(c.id); setConfirmOpen(true); }}>削除</button>
                            </td>
                        </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="toolbar" style={{ marginTop: 12 }}>
                        <div>全{total}件</div>
                    </div>
                    </>
                );
            })()}
            
        <ConfirmDialog open={confirmOpen} onCancel={()=>{ setConfirmOpen(false); setDeleteId(null); }} onConfirm={async ()=>{ if (deleteId!=null) { await onDelete(deleteId); } setConfirmOpen(false); setDeleteId(null); }}>本当に削除しますか？</ConfirmDialog>
        <Modal open={editOpen} title={editing ? `顧客編集 #${editing.id}` : ''} onClose={()=>{ setEditOpen(false); setEditing(null); }}>
            <form onSubmit={eForm.handleSubmit(async v => { if (!editing) return; try { await putDataTyped(`/api/customers/${editing.id}`, v); toast.notify('success','更新しました'); setEditOpen(false); setEditing(null); await load(); } catch { toast.notify('error','更新に失敗'); } })} style={{ display: 'grid', gap: 8 }}>
                <FormTextField label="名前" {...eForm.register('name')} error={eForm.formState.errors.name} />
                <FormTextField label="住所" {...eForm.register('address')} error={eForm.formState.errors.address} />
                <FormTextField label="電話番号" {...eForm.register('phone')} error={(eForm.formState as any).errors?.phone} />
                <FormSelect label="集金方法" {...eForm.register('collectionMethod')} name="collectionMethod" options={[
                    { value: 'cash', label: '現金' },
                    { value: 'direct_debit', label: '口座引き落とし' },
                    { value: 'credit', label: 'クレジット払い' },
                ]} />
                <div><button type="submit">更新</button></div>
            </form>
        </Modal>
		</div>
	);
}


