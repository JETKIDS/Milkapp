import React from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '../components/FormTextField';
import { apiGet, apiJson } from '../lib/api';
import { getDataTyped, postDataTyped, putDataTyped, deleteVoid } from '../lib/typedApi';
import { useToast } from '../components/Toast';
import { FormSelect } from '../components/FormSelect';

const contractSchema = z.object({ productId: z.coerce.number().int().positive(), startDate: z.string().min(1), isActive: z.boolean().optional() });
type ContractValues = z.infer<typeof contractSchema>;

const patternSchema = z.object({ contractId: z.coerce.number().int().positive(), dayOfWeek: z.coerce.number().int().min(0).max(6), quantity: z.coerce.number().int().positive() });
type PatternValues = z.infer<typeof patternSchema>;

const days = [
	{ value: 0, label: '日' },{ value: 1, label: '月' },{ value: 2, label: '火' },{ value: 3, label: '水' },{ value: 4, label: '木' },{ value: 5, label: '金' },{ value: 6, label: '土' },
];

export function ContractsPage() {
	const { id } = useParams();
	const customerId = Number(id);
	const toast = useToast();
	const [contracts, setContracts] = React.useState<any[]>([]);
	const [products, setProducts] = React.useState<any[]>([]);
	const [patterns, setPatterns] = React.useState<any[]>([]);
	const [selectedContract, setSelectedContract] = React.useState<number | null>(null);

	const cForm = useForm<ContractValues>({ resolver: zodResolver(contractSchema) });
	const pForm = useForm<PatternValues>({ resolver: zodResolver(patternSchema) });

    const load = async () => {
        const cs = await getDataTyped<any[]>(`/api/customers/${customerId}/contracts`);
        setContracts(cs);
        setProducts(await getDataTyped<any[]>(`/api/products`));
        if (selectedContract) setPatterns(await getDataTyped<any[]>(`/api/customers/${customerId}/delivery-patterns/${selectedContract}`));
    };
	React.useEffect(() => { void load(); }, [selectedContract]);

    const createContract = async (v: ContractValues) => {
        await postDataTyped<typeof v, any>(`/api/customers/${customerId}/contracts`, v);
		toast.notify('success', '契約を作成しました');
		cForm.reset();
		await load();
	};
    const updateContract = async (contractId: number, data: Partial<ContractValues>) => {
        await putDataTyped<typeof data, any>(`/api/customers/${customerId}/contracts/${contractId}`, data);
		toast.notify('success', '契約を更新しました');
		await load();
	};
    const deleteContract = async (contractId: number) => {
        await deleteVoid(`/api/customers/${customerId}/contracts/${contractId}`);
		toast.notify('success', '契約を削除しました');
		if (selectedContract === contractId) setSelectedContract(null);
		await load();
	};

    const createPattern = async (v: PatternValues) => {
        await postDataTyped<typeof v, any>(`/api/customers/${customerId}/delivery-patterns`, v);
		toast.notify('success', 'パターンを作成しました');
		pForm.reset();
		await load();
	};
    const updatePattern = async (patternId: number, data: Partial<PatternValues>) => {
        await putDataTyped<typeof data, any>(`/api/customers/${customerId}/delivery-patterns/${patternId}`, data);
		toast.notify('success', 'パターンを更新しました');
		await load();
	};
    const deletePattern = async (patternId: number) => {
        await deleteVoid(`/api/customers/${customerId}/delivery-patterns/${patternId}`);
		toast.notify('success', 'パターンを削除しました');
		await load();
	};

	return (
		<div className="card">
			<div className="toolbar"><h2 style={{ margin: 0 }}>Contracts & Patterns</h2></div>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
				<div>
					<h3>契約</h3>
					<form onSubmit={cForm.handleSubmit(createContract)} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
						<FormSelect label="商品" {...cForm.register('productId')} error={cForm.formState.errors.productId} options={products.map((p:any)=>({ value: p.id, label: p.name }))} />
						<FormTextField label="開始日(ISO)" placeholder="2025-08-01T00:00:00.000Z" {...cForm.register('startDate')} error={cForm.formState.errors.startDate} />
						<div><button type="submit">追加</button></div>
					</form>

					<table>
						<thead><tr><th>ID</th><th>商品</th><th>開始日</th><th /></tr></thead>
						<tbody>
							{contracts.map((c:any)=> (
								<tr key={c.id}>
									<td>{c.id}</td>
									<td>{c.product?.name ?? c.productId}</td>
									<td>{new Date(c.startDate).toISOString()}</td>
									<td style={{ display: 'flex', gap: 8 }}>
										<button className="ghost" onClick={()=>setSelectedContract(c.id)}>パターン</button>
										<button className="ghost" onClick={()=>updateContract(c.id, { isActive: !c.isActive })}>{c.isActive ? '停止' : '有効化'}</button>
										<button className="ghost" onClick={()=>deleteContract(c.id)}>削除</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div>
					<h3>配達パターン {selectedContract ? `(#${selectedContract})` : ''}</h3>
					<form onSubmit={pForm.handleSubmit(createPattern)} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
						<FormSelect label="契約ID" {...pForm.register('contractId')} error={pForm.formState.errors.contractId} options={contracts.map((c:any)=>({ value: c.id, label: String(c.id) }))} />
						<FormSelect label="曜日" {...pForm.register('dayOfWeek')} error={pForm.formState.errors.dayOfWeek} options={days} />
						<FormTextField label="数量" type="number" {...pForm.register('quantity')} error={pForm.formState.errors.quantity} />
						<div><button type="submit">追加</button></div>
					</form>

					{selectedContract && (
						<table>
							<thead><tr><th>ID</th><th>曜日</th><th>数量</th><th /></tr></thead>
							<tbody>
								{patterns.map((p:any)=> (
									<tr key={p.id}>
										<td>{p.id}</td><td>{p.dayOfWeek}</td><td>{p.quantity}</td>
										<td style={{ display: 'flex', gap: 8 }}>
											<button className="ghost" onClick={()=>updatePattern(p.id, { quantity: p.quantity + 1 })}>+1</button>
											<button className="ghost" onClick={()=>deletePattern(p.id)}>削除</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
}


