import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSelect } from '../components/FormSelect';
import { FormTextField } from '../components/FormTextField';
import { FormNumberField } from '../components/FormNumberField';
import { apiGet, downloadBlob, postPdf } from '../lib/api';
import { getDataTyped } from '../lib/typedApi';
import { useToast } from '../components/Toast';

const filterSchema = z.object({
    courseId: z.coerce.number().int().positive().optional(),
    // 上段: 開始日（datetime ISO）
    startDate: z.string().optional(),
    // 下段: 何日分
    days: z.coerce.number().int().min(1).max(365).optional(),
    // 互換のため従来 endDate も受ける
    endDate: z.string().optional(),
});
type FilterValues = z.infer<typeof filterSchema>;

const invoiceSchema = z.object({ customerId: z.coerce.number().int().positive(), startDate: z.string(), endDate: z.string() });
type InvoiceValues = z.infer<typeof invoiceSchema>;

function startOfDayUTC(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)); }
function endOfDayUTC(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999)); }
function startOfMonthUTC(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0)); }
function endOfMonthUTC(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999)); }

export function ReportsPage() {
	const toast = useToast();
	const [courses, setCourses] = React.useState<any[]>([]);
	const [customers, setCustomers] = React.useState<any[]>([]);

	const now = React.useMemo(()=>new Date(), []);
	const defaultStartMonth = React.useMemo(()=> startOfMonthUTC(now).toISOString(), [now]);
	const defaultEndMonth = React.useMemo(()=> endOfMonthUTC(now).toISOString(), [now]);

    const dateOptions = React.useMemo(() => {
        const thisMonthStart = startOfMonthUTC(now).toISOString();
        const thisMonthEnd = endOfMonthUTC(now).toISOString();
        return [
            { value: thisMonthStart, label: '今月（開始ISO）' },
            { value: thisMonthEnd, label: '今月（終了ISO）' },
        ];
    }, [now]);

    const listForm = useForm<FilterValues>({ resolver: zodResolver(filterSchema) });
	const invForm = useForm<InvoiceValues>({ resolver: zodResolver(invoiceSchema), defaultValues: { startDate: defaultStartMonth, endDate: defaultEndMonth } });

    React.useEffect(() => { (async () => {
        setCourses(await getDataTyped<any[]>('/api/delivery-courses'));
        setCustomers(await getDataTyped<any[]>('/api/customers'));
    })().catch(()=>toast.notify('error','初期データ取得に失敗しました')); }, []);

    const parseYmd = (s?: string): Date | null => {
        if (!s) return null;
        let v = String(s).trim();
        // 全角→半角
        v = v.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
        v = v.replace(/[／－．]/g, (ch) => (ch === '／' ? '/' : ch === '－' ? '-' : '.'));
        // 区切りを統一
        v = v.replace(/[\.\-]/g, '/');
        const m = v.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
        if (!m) return null;
        const y = Number(m[1]); const mm = Number(m[2]); const d = Number(m[3]);
        if (!y || mm < 1 || mm > 12 || d < 1 || d > 31) return null;
        return new Date(Date.UTC(y, mm - 1, d, 0, 0, 0, 0));
    };

    const downloadDeliveryList = async (v: FilterValues) => {
        if (!v.startDate) { toast.notify('error','開始年月日を入力してください（yyyy/mm/dd）'); return; }
        if (!v.days || v.days <= 0) { toast.notify('error','何日分を入力してください'); return; }
        const start = parseYmd(v.startDate);
        if (!start) { toast.notify('error','開始年月日は yyyy/mm/dd 形式で入力してください'); return; }
        const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + (v.days - 1), 23, 59, 59, 999));
        const payload: any = { courseId: v.courseId, startDate: start.toISOString(), endDate: end.toISOString() };
        try {
            const blob = await postPdf('/api/reports/delivery-list', payload);
            downloadBlob(blob, 'delivery-list.pdf');
            toast.notify('success', '配達リストPDFをダウンロードしました');
        } catch (e:any) {
            toast.notify('error', e?.message ?? '配達リストPDFの出力に失敗しました');
        }
    };
    const downloadProductList = async (v: FilterValues) => {
        if (!v.startDate) { toast.notify('error','開始年月日を入力してください（yyyy/mm/dd）'); return; }
        if (!v.days || v.days <= 0) { toast.notify('error','何日分を入力してください'); return; }
        const start = parseYmd(v.startDate);
        if (!start) { toast.notify('error','開始年月日は yyyy/mm/dd 形式で入力してください'); return; }
        const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + (v.days - 1), 23, 59, 59, 999));
        const payload: any = { startDate: start.toISOString(), endDate: end.toISOString() };
        try {
            const blob = await postPdf('/api/reports/product-list', payload);
            downloadBlob(blob, 'product-list.pdf');
            toast.notify('success', '商品リストPDFをダウンロードしました');
        } catch (e:any) {
            toast.notify('error', e?.message ?? '商品リストPDFの出力に失敗しました');
        }
    };
	const downloadInvoice = async (v: InvoiceValues) => {
        try {
            const blob = await postPdf(`/api/reports/invoice/${v.customerId}`, { startDate: v.startDate, endDate: v.endDate });
            downloadBlob(blob, 'invoice.pdf');
            toast.notify('success', '請求書PDFをダウンロードしました');
        } catch (e:any) {
            toast.notify('error', e?.message ?? '請求書PDFの出力に失敗しました');
        }
	};

	return (
		<div className="card">
			<div className="toolbar"><h2 style={{ margin: 0 }}>Reports</h2></div>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
				<div>
					<h3>配達リスト</h3>
                    <form onSubmit={listForm.handleSubmit(downloadDeliveryList)} style={{ display: 'grid', gap: 8 }}>
                        <FormSelect label="コース" {...listForm.register('courseId')} options={courses.map((c:any)=>({ value: c.id, label: c.name }))} />
                        <FormTextField label="開始年月日 (yyyy/mm/dd)" placeholder="2025/08/14" {...listForm.register('startDate')} />
                        <FormNumberField label="何日分" {...(listForm.register as any)('days')} />
                        <div><button type="submit">PDF出力</button></div>
                    </form>
				</div>

				<div>
					<h3>商品リスト</h3>
                    <form onSubmit={listForm.handleSubmit(downloadProductList)} style={{ display: 'grid', gap: 8 }}>
                        <FormTextField label="開始年月日 (yyyy/mm/dd)" placeholder="2025/08/14" {...listForm.register('startDate')} />
                        <FormNumberField label="何日分" {...(listForm.register as any)('days')} />
                        <div><button type="submit">PDF出力</button></div>
                    </form>
				</div>

				<div>
					<h3>請求書</h3>
					<form onSubmit={invForm.handleSubmit(downloadInvoice)} style={{ display: 'grid', gap: 8 }}>
						<FormSelect label="顧客" {...invForm.register('customerId')} options={customers.map((c:any)=>({ value: c.id, label: c.name }))} />
						<FormSelect label="開始" {...invForm.register('startDate')} options={dateOptions} />
						<FormSelect label="終了" {...invForm.register('endDate')} options={dateOptions} />
						<div><button type="submit">PDF出力</button></div>
					</form>
				</div>
			</div>
		</div>
	);
}


