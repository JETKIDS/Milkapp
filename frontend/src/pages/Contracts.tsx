import React from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormTextField } from '../components/FormTextField';
import { FormNumberField } from '../components/FormNumberField';
import { apiGet, apiJson } from '../lib/api';
import { getDataTyped, postDataTyped, putDataTyped, deleteVoid } from '../lib/typedApi';
import { useToast } from '../components/Toast';
import { FormSelect } from '../components/FormSelect';

// 新しい契約スキーマ（画像に基づく）
const contractSchema = z.object({
	productId: z.coerce.number().int().positive(),
	startDate: z.string().min(1),
	unitPrice: z.coerce.number().min(0),
	patternType: z.enum(['1', '2', '3', '4', '5']).default('1'), // 1:定期 2:隔週 3:月間 4:その他(日) 5:その他(週)
	// 各曜日の数量
	sunday: z.coerce.number().min(0).optional(),
	monday: z.coerce.number().min(0).optional(),
	tuesday: z.coerce.number().min(0).optional(),
	wednesday: z.coerce.number().min(0).optional(),
	thursday: z.coerce.number().min(0).optional(),
	friday: z.coerce.number().min(0).optional(),
	saturday: z.coerce.number().min(0).optional(),
});
type ContractValues = z.infer<typeof contractSchema>;

// パターン種別の選択肢
const patternTypes = [
	{ value: '1', label: '1: 定期' },
	{ value: '2', label: '2: 隔週' },
	{ value: '3', label: '3: 月間' },
	{ value: '4', label: '4: その他(日)' },
	{ value: '5', label: '5: その他(週)' },
];

// 曜日ラベル
const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export function ContractsPage() {
	const { id } = useParams();
	const customerId = Number(id);
	const toast = useToast();
	const [contracts, setContracts] = React.useState<any[]>([]);
	const [products, setProducts] = React.useState<any[]>([]);

	const contractForm = useForm<ContractValues>({ 
		resolver: zodResolver(contractSchema),
		defaultValues: {
			patternType: '1',
			unitPrice: 0,
			sunday: 0,
			monday: 0,
			tuesday: 0,
			wednesday: 0,
			thursday: 0,
			friday: 0,
			saturday: 0,
		}
	});

	// 商品選択時に単価を自動設定
	const selectedProductId = contractForm.watch('productId');
	React.useEffect(() => {
		if (selectedProductId && products.length > 0) {
			const selectedProduct = products.find(p => p.id === Number(selectedProductId));
			if (selectedProduct && selectedProduct.price) {
				contractForm.setValue('unitPrice', selectedProduct.price);
			}
		}
	}, [selectedProductId, products, contractForm]);

    const load = async () => {
        try {
            const cs = await getDataTyped<any[]>(`/api/customers/${customerId}/contracts`);
            setContracts(cs);
            setProducts(await getDataTyped<any[]>(`/api/products`));
        } catch (error) {
            toast.notify('error', 'データの取得に失敗しました');
        }
    };
	React.useEffect(() => { void load(); }, [customerId]);

    const createContract = async (v: ContractValues) => {
        try {
            await postDataTyped<typeof v, any>(`/api/customers/${customerId}/contracts`, v);
            toast.notify('success', '契約を作成しました');
            contractForm.reset();
            await load();
        } catch (error) {
            toast.notify('error', '契約の作成に失敗しました');
        }
    };
    const deleteContract = async (contractId: number) => {
        try {
            await deleteVoid(`/api/customers/${customerId}/contracts/${contractId}`);
            toast.notify('success', '契約を削除しました');
            await load();
        } catch (error) {
            toast.notify('error', '契約の削除に失敗しました');
        }
    };

	return (
		<div className="card">
			<div className="toolbar">
				<h2 style={{ margin: 0, background: '#4A90E2', color: 'white', padding: '8px 16px', borderRadius: '4px' }}>
					契約商品の新規追加
				</h2>
			</div>

			{/* 新規契約作成フォーム */}
			<form onSubmit={contractForm.handleSubmit(createContract)} style={{ padding: '20px', maxWidth: '600px' }}>
				{/* 商品コード */}
				<div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
					<label style={{ minWidth: '100px', fontWeight: 'bold' }}>商品コード:</label>
					<FormSelect 
						label=""
						{...contractForm.register('productId')} 
						error={contractForm.formState.errors.productId}
						options={[
							{ value: '', label: '商品を選択してください' },
							...products.map((p: any) => ({ 
								value: p.id, 
								label: `${p.id}: ${p.name}` 
							}))
						]}
						style={{ minWidth: '300px' }}
					/>
				</div>

				{/* 開始日 */}
				<div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
					<label style={{ minWidth: '100px', fontWeight: 'bold' }}>開始日:</label>
					<FormTextField 
						label=""
						type="date"
						{...contractForm.register('startDate')} 
						error={contractForm.formState.errors.startDate}
						style={{ minWidth: '200px' }}
					/>
				</div>

				{/* 単価 */}
				<div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
					<label style={{ minWidth: '100px', fontWeight: 'bold' }}>単価:</label>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
						<FormNumberField 
							label=""
							{...contractForm.register('unitPrice')} 
							error={contractForm.formState.errors.unitPrice}
							style={{ minWidth: '120px' }}
						/>
						<div style={{ fontSize: '12px', color: '#666' }}>
							※ 商品選択時に自動設定されます（変更可能）
						</div>
					</div>
				</div>

				{/* 配達パターン */}
				<div style={{ marginBottom: '16px' }}>
					<label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>配達パターン:</label>
					<div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
						{dayLabels.map((dayLabel, index) => (
							<div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
								<span style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
									{dayLabel}
								</span>
								<FormNumberField
									label=""
									{...contractForm.register(dayKeys[index])}
									error={contractForm.formState.errors[dayKeys[index]]}
									style={{ width: '50px', textAlign: 'center' }}
									min={0}
								/>
							</div>
						))}
					</div>
				</div>

				{/* パターン種別 */}
				<div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
					<label style={{ minWidth: '100px', fontWeight: 'bold' }}>パターン種別:</label>
					<FormSelect 
						label=""
						{...contractForm.register('patternType')} 
						error={contractForm.formState.errors.patternType}
						options={patternTypes}
						style={{ minWidth: '200px' }}
					/>
				</div>

				{/* ボタン */}
				<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
					<button 
						type="button" 
						className="ghost"
						onClick={() => contractForm.reset()}
					>
						リセット
					</button>
					<button 
						type="submit" 
						disabled={contractForm.formState.isSubmitting}
						style={{ minWidth: '100px' }}
					>
						{contractForm.formState.isSubmitting ? '登録中...' : '登録する'}
					</button>
				</div>
			</form>

			{/* 既存契約一覧 */}
			{contracts.length > 0 && (
				<div style={{ marginTop: '32px', padding: '0 20px 20px' }}>
					<h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '8px' }}>既存契約一覧</h3>
					<table style={{ width: '100%', marginTop: '16px' }}>
						<thead>
							<tr>
								<th>ID</th>
								<th>商品</th>
								<th>開始日</th>
								<th>単価</th>
								<th>状態</th>
								<th>操作</th>
							</tr>
						</thead>
						<tbody>
							{contracts.map((contract: any) => (
								<tr key={contract.id}>
									<td>{contract.id}</td>
									<td>{contract.product?.name || `商品ID: ${contract.productId}`}</td>
									<td>{new Date(contract.startDate).toLocaleDateString('ja-JP')}</td>
									<td>¥{contract.unitPrice || 0}</td>
									<td>
										<span style={{ 
											color: contract.isActive ? 'green' : 'red',
											fontWeight: 'bold' 
										}}>
											{contract.isActive ? '有効' : '停止'}
										</span>
									</td>
									<td>
										<button 
											className="ghost" 
											onClick={() => deleteContract(contract.id)}
											style={{ color: 'red' }}
										>
											削除
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}


