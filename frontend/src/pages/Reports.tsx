import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSelect } from '../components/FormSelect';
import { FormTextField } from '../components/FormTextField';
import { FormNumberField } from '../components/FormNumberField';
import { CourseSelector } from '../components/CourseSelector';
import { apiGet, downloadBlob, postPdf } from '../lib/api';
import { getDataTyped } from '../lib/typedApi';
import { useToast } from '../components/Toast';

const filterSchema = z.object({
    courseIds: z.array(z.coerce.number().int().positive()).optional(),
    // 上段: 開始日（datetime ISO）
    startDate: z.string().optional(),
    // 下段: 何日分
    days: z.coerce.number().int().min(1).max(365).optional(),
    // 互換のため従来 endDate も受ける
    endDate: z.string().optional(),
});
type FilterValues = z.infer<typeof filterSchema>;

// 新機能: 配達スケジュール用のスキーマ
const deliveryScheduleSchema = z.object({
    courseIds: z.array(z.coerce.number().int().positive()).min(1),
    targetDate: z.string().min(1),
    days: z.coerce.number().int().min(1).max(365).optional(),
});
type DeliveryScheduleValues = z.infer<typeof deliveryScheduleSchema>;



function startOfDayUTC(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)); }
function endOfDayUTC(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999)); }
function startOfMonthUTC(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0)); }
function endOfMonthUTC(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999)); }

export function ReportsPage() {
	const toast = useToast();
	const [courses, setCourses] = React.useState<any[]>([]);

	
	// 複数コース選択の状態管理
	const [selectedScheduleCourses, setSelectedScheduleCourses] = React.useState<number[]>([]);
	const [selectedProductCourses, setSelectedProductCourses] = React.useState<number[]>([]);
	
	// 商品リスト用の状態管理
	const [manufacturers, setManufacturers] = React.useState<any[]>([]);
	const [selectedManufacturers, setSelectedManufacturers] = React.useState<number[]>([]);
	const [productOutputType, setProductOutputType] = React.useState<'combined' | 'separate'>('combined');



    const listForm = useForm<FilterValues>({ resolver: zodResolver(filterSchema) });
    const scheduleForm = useForm<DeliveryScheduleValues>({ resolver: zodResolver(deliveryScheduleSchema) });

    React.useEffect(() => { (async () => {
        setCourses(await getDataTyped<any[]>('/api/delivery-courses'));
        setManufacturers(await getDataTyped<any[]>('/api/manufacturers'));
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


    const downloadProductList = async () => {
        const formData = listForm.getValues();
        
        if (!formData.startDate) { toast.notify('error','開始日を入力してください'); return; }
        if (!formData.days || formData.days <= 0) { toast.notify('error','何日分を入力してください'); return; }
        
        // 日付の形式を確認（YYYY-MM-DD形式かyyyy/mm/dd形式か）
        let start: Date;
        if (formData.startDate.includes('-')) {
            // YYYY-MM-DD形式（カレンダー入力）
            start = new Date(formData.startDate + 'T00:00:00.000Z');
        } else {
            // yyyy/mm/dd形式（テキスト入力）
            const parsedStart = parseYmd(formData.startDate);
            if (!parsedStart) { toast.notify('error','開始日は yyyy/mm/dd 形式で入力してください'); return; }
            start = parsedStart;
        }
        
        const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + (formData.days - 1), 23, 59, 59, 999));
        const payload: any = { 
            startDate: start.toISOString(), 
            endDate: end.toISOString(),
            courseIds: selectedProductCourses.length > 0 ? selectedProductCourses : undefined,
            manufacturerIds: selectedManufacturers.length > 0 ? selectedManufacturers : undefined,
            outputType: productOutputType
        };
        
        try {
            toast.notify('info', 'PDFを生成中...');
            const blob = await postPdf('/api/reports/product-list', payload);
            const dateStr = start.toISOString().split('T')[0];
            const filename = `product-list-${dateStr}-${formData.days}days.pdf`;
            downloadBlob(blob, filename);
            toast.notify('success', '商品リストPDFをダウンロードしました');
        } catch (e:any) {
            console.error('PDF generation error:', e);
            toast.notify('error', e?.message ?? '商品リストPDFの出力に失敗しました');
        }
    };

    // 新機能: 配達スケジュールPDF出力
    const downloadDeliverySchedule = async () => {
        const formData = scheduleForm.getValues();
        
        if (!selectedScheduleCourses.length) { toast.notify('error', 'コースを選択してください'); return; }
        if (!formData.targetDate) { toast.notify('error', '配達日を入力してください'); return; }
        if (!formData.days || formData.days <= 0) { toast.notify('error', '何日分を入力してください'); return; }
        
        // 日付の形式を確認（YYYY-MM-DD形式かyyyy/mm/dd形式か）
        let targetDate: Date;
        if (formData.targetDate.includes('-')) {
            // YYYY-MM-DD形式（カレンダー入力）
            targetDate = new Date(formData.targetDate + 'T00:00:00.000Z');
        } else {
            // yyyy/mm/dd形式（テキスト入力）
            const parsedTargetDate = parseYmd(formData.targetDate);
            if (!parsedTargetDate) { toast.notify('error', '配達日は yyyy/mm/dd 形式で入力してください'); return; }
            targetDate = parsedTargetDate;
        }
        
        const endDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate() + (formData.days - 1), 23, 59, 59, 999));
        const payload = { courseIds: selectedScheduleCourses, startDate: targetDate.toISOString(), endDate: endDate.toISOString() };
        
        try {
            const blob = await postPdf('/api/reports/delivery-schedule-multi', payload);
            const dateStr = targetDate.toISOString().split('T')[0];
            downloadBlob(blob, `delivery-schedule-${dateStr}-${formData.days}days.pdf`);
            toast.notify('success', '配達スケジュールPDFをダウンロードしました');
        } catch (e: any) {
            toast.notify('error', e?.message ?? '配達スケジュールPDFの出力に失敗しました');
        }
    };



	return (
		<div className="card">
			<div className="toolbar"><h2 style={{ margin: 0 }}>📈 レポート</h2></div>
			
			{/* メイン機能（配達スケジュールと商品リスト） */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: '32px' }}>
				{/* 配達スケジュール */}
				<div style={{ 
					padding: '24px',
					border: '2px solid var(--primary)',
					borderRadius: '8px',
					backgroundColor: '#f8f9ff',
					height: 'fit-content'
				}}>
					<h3 style={{ 
						color: 'var(--primary)', 
						textAlign: 'center',
						marginTop: 0,
						marginBottom: '24px',
						fontSize: '18px'
					}}>
						🚚 配達スケジュール（配達員用）
					</h3>
					
					<div style={{ display: 'grid', gap: 16 }}>
						<CourseSelector
							label="配達コース"
							courses={courses.map((c:any)=>({ id: c.id, name: c.name }))}
							selectedCourses={selectedScheduleCourses}
							onSelectionChange={setSelectedScheduleCourses}
							placeholder="スケジュールを出力するコースを選択してください"
						/>
						<FormTextField label="開始日" type="date" {...scheduleForm.register('targetDate')} />
						<FormNumberField label="何日分" {...(scheduleForm.register as any)('days')} />
						
						<div style={{ 
							fontSize: '11px', 
							color: 'var(--muted)', 
							backgroundColor: 'white',
							padding: '10px',
							borderRadius: '4px',
							border: '1px solid #e0e0e0'
						}}>
							<div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>📋 出力内容</div>
							• 顧客名、住所、商品名、数量をコース内順番通りに出力<br/>
							• 複数コース選択時は各コースごとにページが分かれて出力<br/>
							• 各ページのタイトルはコース名になります
						</div>
						
						<div style={{ textAlign: 'center', marginTop: '8px' }}>
							<button 
								type="button" 
								onClick={downloadDeliverySchedule} 
								style={{ 
									backgroundColor: 'var(--primary)', 
									color: 'white',
									padding: '10px 24px',
									fontSize: '14px',
									fontWeight: 'bold',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
									transition: 'transform 0.1s, box-shadow 0.1s',
									width: '100%'
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = 'translateY(-1px)';
									e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = 'translateY(0)';
									e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
								}}
							>
								📄 配達スケジュールPDF出力
							</button>
						</div>
					</div>
				</div>

				{/* 商品リスト */}
				<div style={{ 
					padding: '24px',
					border: '2px solid #28a745',
					borderRadius: '8px',
					backgroundColor: '#f8fff8',
					height: 'fit-content'
				}}>
					<h3 style={{ 
						color: '#28a745',
						textAlign: 'center',
						marginTop: 0,
						marginBottom: '24px',
						fontSize: '18px'
					}}>
						📦 商品リスト
					</h3>
					
					<div style={{ display: 'grid', gap: 16 }}>
						{/* 基本設定 */}
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
							<FormTextField label="開始日" type="date" {...listForm.register('startDate')} />
							<FormNumberField label="何日分" {...(listForm.register as any)('days')} />
						</div>
						
						{/* コース選択 */}
						<CourseSelector
							label="配達コース（任意）"
							courses={courses.map((c:any)=>({ id: c.id, name: c.name }))}
							selectedCourses={selectedProductCourses}
							onSelectionChange={setSelectedProductCourses}
							placeholder="全コースまたは特定コースを選択"
						/>
						
						{/* メーカー選択 */}
						<CourseSelector
							label="メーカー（任意）"
							courses={manufacturers.map((m:any)=>({ id: m.id, name: m.name }))}
							selectedCourses={selectedManufacturers}
							onSelectionChange={setSelectedManufacturers}
							placeholder="全メーカーまたは特定メーカーを選択"
						/>
						
						{/* 出力タイプ選択 */}
						{selectedProductCourses.length > 1 && (
							<div style={{ marginBottom: 8 }}>
								<label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: '14px' }}>
									出力形式
								</label>
								<div style={{ display: 'flex', gap: 12, fontSize: '13px' }}>
									<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
										<input
											type="radio"
											name="productOutputType"
											value="combined"
											checked={productOutputType === 'combined'}
											onChange={(e) => setProductOutputType(e.target.value as 'combined' | 'separate')}
											style={{ marginRight: 6 }}
										/>
										合算で出力
									</label>
									<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
										<input
											type="radio"
											name="productOutputType"
											value="separate"
											checked={productOutputType === 'separate'}
											onChange={(e) => setProductOutputType(e.target.value as 'combined' | 'separate')}
											style={{ marginRight: 6 }}
										/>
										コースごとに出力
									</label>
								</div>
							</div>
						)}
						
						<div style={{ 
							fontSize: '11px', 
							color: 'var(--muted)', 
							backgroundColor: 'white',
							padding: '10px',
							borderRadius: '4px',
							border: '1px solid #e0e0e0'
						}}>
							<div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>📋 出力内容</div>
							• 指定期間内に必要な商品とその数量を集計<br/>
							• コース指定時は該当コースの商品のみ<br/>
							• メーカー指定時は該当メーカーの商品のみ<br/>
							• 複数コース選択時は合算またはコース別で出力選択可能
						</div>
						
						<div style={{ textAlign: 'center', marginTop: '8px' }}>
							<button 
								type="button" 
								onClick={downloadProductList}
								style={{ 
									backgroundColor: '#28a745', 
									color: 'white',
									padding: '10px 24px',
									fontSize: '14px',
									fontWeight: 'bold',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
									transition: 'transform 0.1s, box-shadow 0.1s',
									width: '100%'
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = 'translateY(-1px)';
									e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = 'translateY(0)';
									e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
								}}
							>
								📦 商品リストPDF出力
							</button>
						</div>
					</div>
				</div>
			</div>


		</div>
	);
}


