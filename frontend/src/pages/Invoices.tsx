import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSelect } from '../components/FormSelect';
import { FormTextField } from '../components/FormTextField';
import { downloadBlob, postPdf } from '../lib/api';
import { getDataTyped } from '../lib/typedApi';
import { useToast } from '../components/Toast';

const invoiceSchema = z.object({ 
  customerId: z.coerce.number().int().positive({ message: '顧客を選択してください' }), 
  targetMonth: z.string().min(1, { message: '対象月を選択してください' }) 
});
type InvoiceValues = z.infer<typeof invoiceSchema>;

const courseInvoiceSchema = z.object({
  courseId: z.coerce.number().int().positive({ message: 'コースを選択してください' }),
  targetMonth: z.string().min(1, { message: '対象月を選択してください' })
});
type CourseInvoiceValues = z.infer<typeof courseInvoiceSchema>;

function startOfMonthUTC(d: Date) { 
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0)); 
}
function endOfMonthUTC(d: Date) { 
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999)); 
}

export function InvoicesPage() {
	const toast = useToast();
	const [customers, setCustomers] = React.useState<any[]>([]);
	const [courses, setCourses] = React.useState<any[]>([]);
	const [loading, setLoading] = React.useState(true);

	const now = React.useMemo(() => new Date(), []);
	const defaultTargetMonth = React.useMemo(() => {
		const y = now.getUTCFullYear();
		const m = String(now.getUTCMonth() + 1).padStart(2, '0');
		return `${y}-${m}`;
	}, [now]);

	const invForm = useForm<InvoiceValues>({ 
		resolver: zodResolver(invoiceSchema), 
		defaultValues: { 
			customerId: 0,
			targetMonth: defaultTargetMonth 
		} 
	});

	const courseForm = useForm<CourseInvoiceValues>({
		resolver: zodResolver(courseInvoiceSchema),
		defaultValues: {
			courseId: 0,
			targetMonth: defaultTargetMonth
		}
	});

    React.useEffect(() => { 
		(async () => {
			try {
				setLoading(true);
				const [customersData, coursesData] = await Promise.all([
					getDataTyped<any[]>('/api/customers'),
					getDataTyped<any[]>('/api/delivery-courses')
				]);
				setCustomers(customersData);
				setCourses(coursesData);
			} catch (error) {
				console.error('初期データ取得エラー:', error);
				toast.notify('error','初期データの取得に失敗しました');
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

			// 対象月から月初/月末を算出
			const [yy, mm] = v.targetMonth.split('-').map((n) => Number(n));
			const base = new Date(Date.UTC(yy, (mm || 1) - 1, 1, 0, 0, 0, 0));
			const startIso = startOfMonthUTC(base).toISOString();
			const endIso = endOfMonthUTC(base).toISOString();

			const blob = await postPdf(`/api/reports/invoice/${v.customerId}`, { 
				startDate: startIso, 
				endDate: endIso 
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

	const downloadCourseInvoices = async (v: CourseInvoiceValues) => {
		try {
			if (!v.courseId || v.courseId <= 0) {
				toast.notify('error', 'コースを選択してください');
				return;
			}

			// 対象月から月初/月末を算出
			const [yy, mm] = v.targetMonth.split('-').map((n) => Number(n));
			const base = new Date(Date.UTC(yy, (mm || 1) - 1, 1, 0, 0, 0, 0));
			const startIso = startOfMonthUTC(base).toISOString();
			const endIso = endOfMonthUTC(base).toISOString();

			const blob = await postPdf(`/api/reports/invoice-by-course`, {
				courseId: v.courseId,
				startDate: startIso,
				endDate: endIso,
			});
			const courseName = courses.find((c:any) => c.id === v.courseId)?.name ?? 'course';
			const filename = `invoices_course_${courseName}_${new Date().toISOString().split('T')[0]}.pdf`;
			downloadBlob(blob, filename);
			toast.notify('success', `コース「${courseName}」の請求書PDFをダウンロードしました`);
		} catch (e: any) {
			console.error('コース別請求書作成エラー:', e);
			toast.notify('error', e?.message ?? 'コース別請求書PDFの出力に失敗しました');
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
						
						<div>
							<FormTextField 
								label="対象月" 
								type="month" 
								{...invForm.register('targetMonth')} 
								style={{ fontSize: '16px' }}
								error={(invForm.formState.errors as any)?.targetMonth}
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
							• 対象月の注文履歴を集計して請求書を作成します<br/>
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

				{/* コース別請求書セクション */}
				<div style={{ 
					padding: '32px',
					border: '2px solid #17a2b8',
					borderRadius: '12px',
					backgroundColor: '#f0fdff',
					marginBottom: '32px'
				}}>
					<h3 style={{ 
						color: '#0c5460',
						textAlign: 'center',
						marginTop: 0,
						marginBottom: '32px',
						fontSize: '22px',
						fontWeight: 'bold'
					}}>
						🧾 コース別 請求書一括作成（1PDFにまとめて出力）
					</h3>

					<form onSubmit={courseForm.handleSubmit(downloadCourseInvoices)} style={{
						display: 'grid',
						gap: 24
					}}>
						<div>
							<FormSelect 
								label="対象コース"
								{...courseForm.register('courseId')}
								options={courses.map((c:any)=>({ value: c.id, label: c.name }))}
								style={{ fontSize: '16px' }}
								error={courseForm.formState.errors.courseId}
							/>
						</div>
						<div>
							<FormTextField 
								label="対象月"
								type="month"
								{...courseForm.register('targetMonth')}
								style={{ fontSize: '16px' }}
								error={(courseForm.formState.errors as any)?.targetMonth}
							/>
						</div>

						<div style={{ textAlign: 'center', marginTop: '16px' }}>
							<button 
								type="submit"
								disabled={loading || courses.length === 0}
								style={{
									backgroundColor: loading || courses.length === 0 ? '#6c757d' : '#17a2b8',
									color: '#fff',
									padding: '12px 36px',
									fontSize: '16px',
									fontWeight: 'bold',
									border: 'none',
									borderRadius: '8px',
									cursor: loading || courses.length === 0 ? 'not-allowed' : 'pointer',
									boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
									minWidth: '200px',
									opacity: loading || courses.length === 0 ? 0.6 : 1
								}}
							>
								{loading || courses.length === 0 ? '⏳ 読み込み中...' : '🧾 コース別請求書PDF作成'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
