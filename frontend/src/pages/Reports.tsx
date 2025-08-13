import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSelect } from '../components/FormSelect';
import { FormTextField } from '../components/FormTextField';
import { apiGet, downloadBlob, postPdf } from '../lib/api';
import { getDataTyped } from '../lib/typedApi';
import { useToast } from '../components/Toast';

const filterSchema = z.object({ courseId: z.coerce.number().int().positive().optional(), startDate: z.string().optional(), endDate: z.string().optional() });
type FilterValues = z.infer<typeof filterSchema>;

const invoiceSchema = z.object({ customerId: z.coerce.number().int().positive(), startDate: z.string(), endDate: z.string() });
type InvoiceValues = z.infer<typeof invoiceSchema>;

export function ReportsPage() {
	const toast = useToast();
	const [courses, setCourses] = React.useState<any[]>([]);
	const [customers, setCustomers] = React.useState<any[]>([]);
	const listForm = useForm<FilterValues>({ resolver: zodResolver(filterSchema) });
	const invForm = useForm<InvoiceValues>({ resolver: zodResolver(invoiceSchema) });

    React.useEffect(() => { (async () => {
        setCourses(await getDataTyped<any[]>('/api/delivery-courses'));
        setCustomers(await getDataTyped<any[]>('/api/customers'));
    })().catch(()=>toast.notify('error','初期データ取得に失敗しました')); }, []);

	const downloadDeliveryList = async (v: FilterValues) => {
		const blob = await postPdf('/api/reports/delivery-list', v);
		downloadBlob(blob, 'delivery-list.pdf');
		toast.notify('success', '配達リストPDFをダウンロードしました');
	};
	const downloadProductList = async (v: FilterValues) => {
		const blob = await postPdf('/api/reports/product-list', v);
		downloadBlob(blob, 'product-list.pdf');
		toast.notify('success', '商品リストPDFをダウンロードしました');
	};
	const downloadInvoice = async (v: InvoiceValues) => {
		const blob = await postPdf(`/api/reports/invoice/${v.customerId}`, { startDate: v.startDate, endDate: v.endDate });
		downloadBlob(blob, 'invoice.pdf');
		toast.notify('success', '請求書PDFをダウンロードしました');
	};

	return (
		<div className="card">
			<div className="toolbar"><h2 style={{ margin: 0 }}>Reports</h2></div>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
				<div>
					<h3>配達リスト</h3>
					<form onSubmit={listForm.handleSubmit(downloadDeliveryList)} style={{ display: 'grid', gap: 8 }}>
						<FormSelect label="コース" {...listForm.register('courseId')} options={courses.map((c:any)=>({ value: c.id, label: c.name }))} />
						<FormTextField label="開始(ISO)" {...listForm.register('startDate')} />
						<FormTextField label="終了(ISO)" {...listForm.register('endDate')} />
						<div><button type="submit">PDF出力</button></div>
					</form>
				</div>

				<div>
					<h3>商品リスト</h3>
					<form onSubmit={listForm.handleSubmit(downloadProductList)} style={{ display: 'grid', gap: 8 }}>
						<FormTextField label="開始(ISO)" {...listForm.register('startDate')} />
						<FormTextField label="終了(ISO)" {...listForm.register('endDate')} />
						<div><button type="submit">PDF出力</button></div>
					</form>
				</div>

				<div>
					<h3>請求書</h3>
					<form onSubmit={invForm.handleSubmit(downloadInvoice)} style={{ display: 'grid', gap: 8 }}>
						<FormSelect label="顧客" {...invForm.register('customerId')} options={customers.map((c:any)=>({ value: c.id, label: c.name }))} />
						<FormTextField label="開始(ISO)" {...invForm.register('startDate')} />
						<FormTextField label="終了(ISO)" {...invForm.register('endDate')} />
						<div><button type="submit">PDF出力</button></div>
					</form>
				</div>
			</div>
		</div>
	);
}


