import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSelect } from '../components/FormSelect';
import { downloadBlob, postPdf } from '../lib/api';
import { getDataTyped } from '../lib/typedApi';
import { useToast } from '../components/Toast';

const invoiceSchema = z.object({ 
  customerId: z.coerce.number().int().positive({ message: '顧客を選択してください' }), 
  startDate: z.string().min(1, { message: '開始日を選択してください' }), 
  endDate: z.string().min(1, { message: '終了日を選択してください' }) 
});
type InvoiceValues = z.infer<typeof invoiceSchema>;

function startOfMonthUTC(d: Date) { 
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0)); 
}
function endOfMonthUTC(d: Date) { 
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999)); 
}

export function InvoicesPage() {
	const toast = useToast();
	const [customers, setCustomers] = React.useState<any[]>([]);
	const [loading, setLoading] = React.useState(true);

	const now = React.useMemo(() => new Date(), []);
	const defaultStartMonth = React.useMemo(() => startOfMonthUTC(now).toISOString(), [now]);
	const defaultEndMonth = React.useMemo(() => endOfMonthUTC(now).toISOString(), [now]);

    const dateOptions = React.useMemo(() => {
        const thisMonthStart = startOfMonthUTC(now).toISOString();
        const thisMonthEnd = endOfMonthUTC(now).toISOString();
        return [
            { value: thisMonthStart, label: '今月（開始ISO）' },
            { value: thisMonthEnd, label: '今月（終了ISO）' },
        ];
    }, [now]);

	const invForm = useForm<InvoiceValues>({ 
		resolver: zodResolver(invoiceSchema), 
		defaultValues: { 
			customerId: 0, // デフォルト値を明示的に設定
			startDate: defaultStartMonth, 
			endDate: defaultEndMonth 
		} 
	});

    React.useEffect(() => { 
		(async () => {
			try {
				setLoading(true);
				const customersData = await getDataTyped<any[]>('/api/customers');
				console.log('顧客データを取得しました:', customersData);
				setCustomers(customersData);
			} catch (error) {
				console.error('顧客データ取得エラー:', error);
				toast.notify('error','顧客データの取得に失敗しました');
			} finally {
				setLoading(false);
			}
		})(); 
	}, [toast]);

	const downloadInvoice = async (v: InvoiceValues) => {
        try {
			// バリデーション
			if (!v.customerId || v.customerId <= 0) {
				toast.notify('error', '顧客を選択してください');
				return;
			}

			console.log('請求書作成開始:', v);
            const blob = await postPdf(`/api/reports/invoice/${v.customerId}`, { 
				startDate: v.startDate, 
				endDate: v.endDate 
			});
            
			const selectedCustomer = customers.find(c => c.id === v.customerId);
			const customerName = selectedCustomer ? selectedCustomer.name : 'unknown';
			const filename = `invoice_${customerName}_${new Date().toISOString().split('T')[0]}.pdf`;
			
			downloadBlob(blob, filename);
            toast.notify('success', `${customerName}様の請求書PDFをダウンロードしました`);
        } catch (e: any) {
			console.error('請求書作成エラー:', e);
            toast.notify('error', e?.message ?? '請求書PDFの出力に失敗しました');
        }
	};

	return (
		<div className="card">
			<div className="toolbar">
				<h2 style={{ margin: 0 }}>📄 請求書管理</h2>
			</div>
			
			<div style={{ 
				maxWidth: '600px', 
				margin: '0 auto',
				padding: '32px'
			}}>
				{/* 請求書作成セクション */}
				<div style={{ 
					padding: '32px',
					border: '2px solid #ffc107',
					borderRadius: '12px',
					backgroundColor: '#fffdf0',
					marginBottom: '32px'
				}}>
					<h3 style={{ 
						color: '#856404',
						textAlign: 'center',
						marginTop: 0,
						marginBottom: '32px',
						fontSize: '24px',
						fontWeight: 'bold'
					}}>
						📄 請求書作成
					</h3>
					
					<form onSubmit={invForm.handleSubmit(downloadInvoice)} style={{ 
						display: 'grid', 
						gap: 24 
					}}>
						<div>
							<FormSelect 
								label="請求先顧客" 
								{...invForm.register('customerId')} 
								options={customers.map((c: any) => ({ 
									value: c.id, 
									label: c.name 
								}))} 
								style={{ fontSize: '16px' }}
								disabled={loading}
								error={invForm.formState.errors.customerId}
							/>
							{loading && (
								<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
									顧客データを読み込み中...
								</div>
							)}
							{!loading && customers.length === 0 && (
								<div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
									顧客データが見つかりません
								</div>
							)}
							{!loading && customers.length > 0 && (
								<div style={{ fontSize: '12px', color: '#28a745', marginTop: '4px' }}>
									{customers.length}件の顧客が見つかりました
								</div>
							)}
						</div>
						
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
							<FormSelect 
								label="請求期間（開始）" 
								{...invForm.register('startDate')} 
								options={dateOptions} 
								style={{ fontSize: '16px' }}
								error={invForm.formState.errors.startDate}
							/>
							<FormSelect 
								label="請求期間（終了）" 
								{...invForm.register('endDate')} 
								options={dateOptions} 
								style={{ fontSize: '16px' }}
								error={invForm.formState.errors.endDate}
							/>
						</div>
						
						<div style={{ 
							fontSize: '12px', 
							color: '#856404', 
							backgroundColor: 'white',
							padding: '16px',
							borderRadius: '8px',
							border: '1px solid #ffc107'
						}}>
							<div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>📋 請求書について</div>
							• 指定期間内の顧客の注文履歴を集計して請求書を作成します<br/>
							• 請求金額、請求期間、発行日が記載されます<br/>
							• PDFファイルとしてダウンロードされます
						</div>
						
						<div style={{ textAlign: 'center', marginTop: '16px' }}>
							<button 
								type="submit" 
								disabled={loading || customers.length === 0}
								style={{
									backgroundColor: loading || customers.length === 0 ? '#6c757d' : '#ffc107',
									color: loading || customers.length === 0 ? '#fff' : '#212529',
									padding: '16px 48px',
									fontSize: '18px',
									fontWeight: 'bold',
									border: 'none',
									borderRadius: '8px',
									cursor: loading || customers.length === 0 ? 'not-allowed' : 'pointer',
									boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
									transition: 'transform 0.1s, box-shadow 0.1s',
									minWidth: '200px',
									opacity: loading || customers.length === 0 ? 0.6 : 1
								}}
								onMouseEnter={(e) => {
									if (!loading && customers.length > 0) {
										e.currentTarget.style.transform = 'translateY(-2px)';
										e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
									}
								}}
								onMouseLeave={(e) => {
									if (!loading && customers.length > 0) {
										e.currentTarget.style.transform = 'translateY(0)';
										e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
									}
								}}
							>
								{loading ? '⏳ 読み込み中...' : '📄 請求書PDF作成'}
							</button>
						</div>
					</form>
				</div>

				{/* 今後の機能拡張用スペース */}
				<div style={{
					padding: '24px',
					border: '1px dashed #ddd',
					borderRadius: '8px',
					backgroundColor: '#f8f9fa',
					textAlign: 'center',
					color: '#6c757d'
				}}>
					<h4 style={{ margin: '0 0 12px 0' }}>🚧 今後の機能</h4>
					<p style={{ margin: 0, fontSize: '14px' }}>
						• 請求書履歴の表示<br/>
						• 一括請求書作成<br/>
						• 請求書テンプレートの選択<br/>
						• 支払い状況の管理
					</p>
				</div>
			</div>
		</div>
	);
}
