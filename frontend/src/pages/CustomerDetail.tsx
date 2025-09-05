import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { downloadBlob, postPdf } from '../lib/api';
import { getDataTyped, putDataTyped } from '../lib/typedApi';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { FormTextField } from '../components/FormTextField';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export function CustomerDetailPage() {
	const { id } = useParams();
	const customerId = Number(id);
	const toast = useToast();
	const [detail, setDetail] = React.useState<any>(null);
	const [contracts, setContracts] = React.useState<any[]>([]);
	const [currentDate, setCurrentDate] = React.useState(new Date());
	const [loading, setLoading] = React.useState<boolean>(false);

	// カレンダー用の状態
	const [calendarData, setCalendarData] = React.useState<any[]>([]);
	
	// 請求書用の状態
	const [invoiceHistory, setInvoiceHistory] = React.useState<any[]>([]);
	const [invoiceLoading, setInvoiceLoading] = React.useState(false);
	
	// コース変更用の状態
	const [showCourseModal, setShowCourseModal] = React.useState(false);
	const [availableCourses, setAvailableCourses] = React.useState<any[]>([]);
	const [selectedCourse, setSelectedCourse] = React.useState<number | null>(null);
	const [courseLoading, setCourseLoading] = React.useState(false);
	const [coursePosition, setCoursePosition] = React.useState<number | null>(null);
	const dayRowRef = React.useRef<HTMLDivElement | null>(null);
	const [dayCellWidth, setDayCellWidth] = React.useState<number | null>(null);
	const sidebarDragRef = React.useRef<{ isDragging: boolean; startX: number; startY: number }>({ isDragging: false, startX: 0, startY: 0 });
	const [sidebarDragOffset, setSidebarDragOffset] = React.useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
	React.useEffect(() => {
		const onMove = (e: MouseEvent) => {
			if (!sidebarDragRef.current.isDragging) return;
			setSidebarDragOffset({
				dx: e.clientX - sidebarDragRef.current.startX,
				dy: e.clientY - sidebarDragRef.current.startY,
			});
		};
		const onUp = () => {
			if (sidebarDragRef.current.isDragging) sidebarDragRef.current.isDragging = false;
		};
		window.addEventListener('mousemove', onMove as any);
		window.addEventListener('mouseup', onUp);
		return () => {
			window.removeEventListener('mousemove', onMove as any);
			window.removeEventListener('mouseup', onUp);
		};
	}, []);

	// bank modal state and handlers
	const bankSchema = z.object({
		bankBranchCode7: z.string().regex(/^\d{7}$/).optional(),
		accountNumber7: z.string().regex(/^\d{7}$/).optional(),
		accountHolderKana: z.string().regex(/^[\u30A0-\u30FF\uFF65-\uFF9F\s]+$/).optional(),
		customerCode7: z.string().regex(/^\d{7}$/).optional(),
	});
	type BankForm = z.infer<typeof bankSchema>;
	const bankForm = useForm<BankForm>({ resolver: zodResolver(bankSchema) });
	const [bankOpen, setBankOpen] = React.useState(false);
	const toHalfWidthKana = (input: string): string => {
		if (!input) return '';
		const toKatakana = input.replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
		const s = toKatakana.replace(/\u3000/g, ' ');
		const map: Record<string, string> = { 'ァ':'ｧ','ア':'ｱ','ィ':'ｨ','イ':'ｲ','ゥ':'ｩ','ウ':'ｳ','ェ':'ｪ','エ':'ｴ','ォ':'ｫ','オ':'ｵ','カ':'ｶ','ガ':'ｶﾞ','キ':'ｷ','ギ':'ｷﾞ','ク':'ｸ','グ':'ｸﾞ','ケ':'ｹ','ゲ':'ｹﾞ','コ':'ｺ','ゴ':'ｺﾞ','サ':'ｻ','ザ':'ｻﾞ','シ':'ｼ','ジ':'ｼﾞ','ス':'ｽ','ズ':'ｽﾞ','セ':'ｾ','ゼ':'ｾﾞ','ソ':'ｿ','ゾ':'ｿﾞ','タ':'ﾀ','ダ':'ﾀﾞ','チ':'ﾁ','ヂ':'ﾁﾞ','ッ':'ｯ','ツ':'ﾂ','ヅ':'ﾂﾞ','テ':'ﾃ','デ':'ﾃﾞ','ト':'ﾄ','ド':'ﾄﾞ','ナ':'ﾅ','ニ':'ﾆ','ヌ':'ﾇ','ネ':'ﾈ','ノ':'ﾉ','ハ':'ﾊ','バ':'ﾊﾞ','パ':'ﾊﾟ','ヒ':'ﾋ','ビ':'ﾋﾞ','ピ':'ﾋﾟ','フ':'ﾌ','ブ':'ﾌﾞ','プ':'ﾌﾟ','ヘ':'ﾍ','ベ':'ﾍﾞ','ペ':'ﾍﾟ','ホ':'ﾎ','ボ':'ﾎﾞ','ポ':'ﾎﾟ','マ':'ﾏ','ミ':'ﾐ','ム':'ﾑ','メ':'ﾒ','モ':'ﾓ','ャ':'ｬ','ヤ':'ﾔ','ュ':'ｭ','ユ':'ﾕ','ョ':'ｮ','ヨ':'ﾖ','ラ':'ﾗ','リ':'ﾘ','ル':'ﾙ','レ':'ﾚ','ロ':'ﾛ','ワ':'ﾜ','ヲ':'ｦ','ン':'ﾝ','・':'･','ー':'ｰ','ヴ':'ｳﾞ', };
		let out = '';
		for (const ch of s) out += map[ch] ?? ch;
		return out;
	};
	const openBank = () => {
		const padded = String(customerId).padStart(7, '0');
		bankForm.reset({
			bankBranchCode7: detail?.data?.bankBranchCode7 ?? '',
			accountNumber7: detail?.data?.accountNumber7 ?? '',
			accountHolderKana: detail?.data?.accountHolderKana ?? '',
			customerCode7: detail?.data?.customerCode7 ?? padded,
		});
		setBankOpen(true);
	};
	const saveBank = async (v: BankForm) => {
		try { await putDataTyped(`/api/customers/${customerId}`, v); setDetail((prev:any)=> prev?{ data:{...prev.data, ...v}}:prev); setBankOpen(false); toast.notify('success','口座情報を保存しました'); }
		catch { toast.notify('error','保存に失敗しました'); }
	};
	React.useEffect(()=>{
		const handler = () => setBankOpen(true);
		window.addEventListener('open-bank-modal', handler as any);
		return () => window.removeEventListener('open-bank-modal', handler as any);
	},[]);

	// 初期データ読み込み
	React.useEffect(() => { (async () => {
		setLoading(true);
		try {
			// 顧客詳細（コース名・順位含むメタ）を取得
			const detailData = await getDataTyped(`/api/customers/${customerId}/detail`) as any;
			setDetail({ data: detailData?.customer });
			setCoursePosition(detailData?.position ?? null);
			
			// 契約一覧を取得
			const contractsData = await getDataTyped(`/api/customers/${customerId}/contracts`) as any;
			
			// APIレスポンスの構造に応じて処理
			let contractsArray;
			if (Array.isArray(contractsData)) {
				contractsArray = contractsData;
			} else if (contractsData && contractsData.data) {
				contractsArray = contractsData.data;
			} else {
				contractsArray = [];
			}
			

			setContracts(contractsArray);
			
			// カレンダーデータを生成
			generateCalendarData(contractsArray);
			
			// 請求履歴を取得
			try {
				const historyData = await getDataTyped(`/api/reports/invoice-history/${customerId}`) as any;
				setInvoiceHistory(historyData || []);
			} catch (e) {
				console.log('請求履歴の取得に失敗しました:', e);
			}
			
			// 配達コース一覧を取得
			try {
				const coursesData = await getDataTyped(`/api/delivery-courses`) as any;
				setAvailableCourses(coursesData || []);
			} catch (e) {
				console.log('配達コースの取得に失敗しました:', e);
			}

			// コース内の順番を取得（優先: コース顧客一覧から自分のposition）
			if (detailData?.customer?.deliveryCourseId) {
				try {
					const list = await getDataTyped(`/api/delivery-courses/${detailData.customer.deliveryCourseId}/customers`) as any;
					const self = Array.isArray(list) ? list.find((c: any) => c.id === customerId) : (list?.data ?? []).find((c: any) => c.id === customerId);
					setCoursePosition(self?.position ?? null);
				} catch (e) {
					// フォールバック: 直接 position テーブルから
					try {
						const positions = await getDataTyped(`/api/customers/${customerId}/course-position`) as any[];
						const posEntry = positions?.find((p: any) => p.deliveryCourseId === detailData.customer.deliveryCourseId);
						setCoursePosition(posEntry ? posEntry.position : null);
					} catch {}
				}
			}
		} catch (error) {
			console.error('Error loading customer detail:', error);
			toast.notify('error','顧客詳細の取得に失敗しました');
		} finally {
			setLoading(false);
		}
	})().catch(()=>{}); }, [customerId]);

	// 月が変わった時にカレンダーデータを再生成
	React.useEffect(() => {
		if (contracts.length > 0) {
			generateCalendarData(contracts);
		}
	}, [currentDate, contracts]);

	// 前半（日付行）の1セル幅を測定し、後半にも適用
	React.useEffect(() => {
		if (dayRowRef.current) {
			const firstCell = dayRowRef.current.querySelector('.day-cell') as HTMLElement | null;
			if (firstCell) {
				setDayCellWidth(firstCell.getBoundingClientRect().width);
			}
		}
	}, [calendarData, currentDate, contracts]);

	// カレンダーデータ生成
	const generateCalendarData = (contractsData: any[]) => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		
		// 月の最初と最後の日を取得
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		
		// カレンダー用データを生成
		const calendar = [];
		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, month, day);
			const dayOfWeek = date.getDay(); // 0=日曜, 1=月曜, ...
			
			// その日の配達予定を計算
			const deliveries: any[] = [];
			contractsData.forEach(contract => {
				// 契約開始日をチェック（時間を除いて日付のみで比較）
				const contractStartDate = new Date(contract.startDate);
				contractStartDate.setHours(0, 0, 0, 0); // 時間をリセット
				
				const currentDayDate = new Date(year, month, day);
				currentDayDate.setHours(0, 0, 0, 0); // 時間をリセット
				
				// 契約開始日以降の場合のみ配達を表示
				if (currentDayDate >= contractStartDate && contract.patterns) {
					contract.patterns.forEach((pattern: any) => {
						if (pattern.dayOfWeek === dayOfWeek && pattern.quantity > 0) {
							deliveries.push({
								productName: contract.product?.name || `商品ID: ${contract.productId}`,
								quantity: pattern.quantity,
								unitPrice: contract.unitPrice || 0
							});
						}
					});
				}
			});
			
			calendar.push({
				day,
				dayOfWeek,
				deliveries,
				total: deliveries.reduce((sum, d) => sum + (d.quantity * d.unitPrice), 0)
			});
		}
		
		setCalendarData(calendar);
	};

	// 月を変更
	const changeMonth = (direction: number) => {
		const newDate = new Date(currentDate);
		newDate.setMonth(newDate.getMonth() + direction);
		setCurrentDate(newDate);
	};

	const formatCurrency = (n: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n);
	const getDayName = (dayOfWeek: number) => ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek];

	// コース変更モーダルを開く
	const openCourseModal = () => {
		setSelectedCourse(detail?.data?.deliveryCourseId || null);
		setShowCourseModal(true);
	};

	// コース変更を実行
	const changeCourse = async () => {
		if (!selectedCourse) {
			toast.notify('error', 'コースを選択してください');
			return;
		}

		try {
			setCourseLoading(true);
			await putDataTyped(`/api/customers/${customerId}`, {
				deliveryCourseId: selectedCourse
			});
			
			// 顧客データを更新
			const updatedCustomer = { ...detail.data, deliveryCourseId: selectedCourse };
			setDetail({ data: updatedCustomer });
			// コース順位を再取得
			try {
				const positions = await getDataTyped(`/api/customers/${customerId}/course-position`) as any[];
				const posEntry = positions?.find((p: any) => p.deliveryCourseId === selectedCourse);
				setCoursePosition(posEntry ? posEntry.position : null);
			} catch {}
			
			toast.notify('success', 'コースを変更しました');
			setShowCourseModal(false);
		} catch (error) {
			console.error('コース変更エラー:', error);
			toast.notify('error', 'コース変更に失敗しました');
		} finally {
			setCourseLoading(false);
		}
	};

	// 今月の請求書を作成
	const createMonthlyInvoice = async () => {
		try {
			setInvoiceLoading(true);
			
			// 今月の開始日と終了日を計算
			const now = new Date();
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
			const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
			
			const payload = {
				startDate: startOfMonth.toISOString(),
				endDate: endOfMonth.toISOString()
			};
			
			toast.notify('info', '請求書を作成中...');
			const blob = await postPdf(`/api/reports/invoice/${customerId}`, payload);
			
			const filename = `invoice_${detail?.data?.name || 'customer'}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.pdf`;
			downloadBlob(blob, filename);
			
			toast.notify('success', '請求書PDFをダウンロードしました');
			
			// 請求履歴を更新
			const historyData = await getDataTyped(`/api/reports/invoice-history/${customerId}`) as any;
			setInvoiceHistory(historyData || []);
		} catch (e: any) {
			console.error('請求書作成エラー:', e);
			toast.notify('error', e?.message ?? '請求書作成に失敗しました');
		} finally {
			setInvoiceLoading(false);
		}
	};

	return (
		<div className="customer-detail-scale" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f5f5f5' }}>
			<style>{`.customer-detail-scale{font-size:1.1em;}`}</style>
				{/* ヘッダー部分 */}
				<div style={{ 
					backgroundColor: 'white', 
					padding: '16px', 
					marginBottom: '16px', 
					border: '1px solid #ccc',
					fontSize: '14px'
				}}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
						<div>
							<div style={{ fontSize: '24px', fontWeight: 'bold' }}>{detail?.data?.name || '顧客名'} 様</div>
							<div style={{ fontSize: '12px', color: '#666' }}>{detail?.data?.address || '-'}</div>
							<div style={{ fontSize: '12px', color: '#666' }}>TEL: {detail?.data?.phone || '-'}</div>
							<div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
								<span>
									集金方法: {(() => {
									const m = detail?.data?.collectionMethod as string | undefined;
									if (m === 'cash') return '現金';
									if (m === 'direct_debit') return '口座引き落とし';
									if (m === 'credit') return 'クレジット払い';
									return '-';
									})()}
								</span>
								{detail?.data?.collectionMethod === 'direct_debit' && (
									<button
										onClick={(e) => {
											e.preventDefault();
											openBank();
										}}
										style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: 4 }}
									>
										口座情報
									</button>
								)}
							</div>
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '6px' }}>
								<Link to={`/customers/${customerId}/contracts`} style={{ textDecoration: 'none' }}>
									<button
										className="ghost"
										style={{
											backgroundColor: '#4CAF50',
											color: 'white',
											border: 'none',
											padding: '8px 16px',
											borderRadius: '4px',
											fontSize: '12px',
											cursor: 'pointer'
										}}
									>
										商品追加
									</button>
								</Link>
								<button
									onClick={openCourseModal}
									style={{
										backgroundColor: '#4CAF50',
										color: 'white',
										border: 'none',
										padding: '8px 16px',
										borderRadius: '4px',
										fontSize: '12px',
										cursor: 'pointer'
									}}
								>
									コース変更
								</button>
							</div>
							<div>配達コース: {availableCourses.find(c => c.id === detail?.data?.deliveryCourseId)?.name || 'コース未設定'}</div>
							<div>順位: {coursePosition != null ? `${coursePosition}番` : '未設定'}</div>
						</div>
					</div>
					
					{/* ここにあった重複ヘッダーは削除 */}
				</div>

				{/* 月間ナビゲーション */}
				<div style={{ 
					backgroundColor: 'white', 
					padding: '16px', 
					marginBottom: '16px', 
					border: '1px solid #ccc',
					textAlign: 'center'
				}}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
						<button 
							onClick={() => changeMonth(-1)}
							style={{ 
								padding: '8px 16px', 
								backgroundColor: '#4CAF50', 
								color: 'white', 
								border: 'none', 
								borderRadius: '4px',
								cursor: 'pointer'
							}}
						>
							◀◀
						</button>
						<div style={{ 
							fontSize: '18px', 
							fontWeight: 'bold',
							backgroundColor: '#e8f5e8',
							padding: '8px 24px',
							borderRadius: '4px'
						}}>
							{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月度 (当月)
						</div>
						<button 
							onClick={() => changeMonth(1)}
							style={{ 
								padding: '8px 16px', 
								backgroundColor: '#4CAF50', 
								color: 'white', 
								border: 'none', 
								borderRadius: '4px',
								cursor: 'pointer'
							}}
						>
							▶▶
						</button>
					</div>
				</div>

				{/* カレンダー部分 */}
				<div style={{ backgroundColor: 'white', border: '1px solid #ccc', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans JP", "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", Meiryo, sans-serif' }}>
					{/* 商品名を左側に表示 */}
					<div style={{ display: 'flex' }}>
						{/* 商品名列 */}
						<div style={{ minWidth: '225px', borderRight: '1px solid #ccc' }}>
							<div style={{ 
								padding: '2px', 
								border: '1px solid #ccc', 
								backgroundColor: '#f0f0f0', 
								textAlign: 'center',
								fontWeight: 'bold',
								height: '58px',
								boxSizing: 'border-box',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center'
							}}>
								商品名
							</div>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
							{contracts.map((contract, index) => (
								<div key={contract.id} style={{ 
									padding: 0, 
									border: '1px solid #ccc', 
									height: '30px',
									boxSizing: 'border-box',
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'center'
								}}>
									<div style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: '14px', height: '14px', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', padding: '0 4px' }}>
										{contract.product?.name || `商品ID: ${contract.productId}`}
									</div>
									{/* 単価表示は非表示 */}
								</div>
							))}
							</div>
						</div>

						{/* 右側：前半/後半の2段表示 */}
						<div style={{ flex: 1, display: 'grid', gap: 12 }}>
							{(() => {
								const firstHalf = calendarData.filter(d => d.day <= 15);
								const secondHalf = calendarData.filter(d => d.day > 15);

								const renderSection = (daysArr: any[], tight?: boolean, rowRef?: any, isSecondHalf?: boolean) => (
									<>
										{/* カレンダーヘッダー（曜日） */}
										<div style={{ display: 'grid', gridTemplateColumns: (isSecondHalf && dayCellWidth ? `repeat(${daysArr.length}, ${dayCellWidth}px)` : `repeat(${daysArr.length}, 1fr)`), fontWeight: 'bold' }}>
											{daysArr.map((dayData, idx) => (
												<div key={idx} style={{ padding: '2px', height: '24px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
													{getDayName(dayData.dayOfWeek)}
												</div>
											))}
										</div>
										{/* 日付行 */}
										<div ref={rowRef} style={{ display: 'grid', gridTemplateColumns: (isSecondHalf && dayCellWidth ? `repeat(${daysArr.length}, ${dayCellWidth}px)` : `repeat(${daysArr.length}, 1fr)`), fontWeight: 'bold' }}>
											{daysArr.map((dayData, idx) => (
												<div key={idx} className="day-cell" style={{ padding: (tight ? '0 2px 0 2px' : '0 2px 8px 2px'), height: '19px', border: '1px solid #ccc', textAlign: 'center', backgroundColor: (dayData.dayOfWeek === 0 ? '#ffebee' : (dayData.dayOfWeek === 6 ? '#e3f2fd' : 'white')), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
													{dayData.day}
												</div>
											))}
										</div>
										{/* 各商品の配達数量行 */}
										{contracts.map((contract: any) => (
											<div key={contract.id} style={{ display: 'grid', gridTemplateColumns: (isSecondHalf && dayCellWidth ? `repeat(${daysArr.length}, ${dayCellWidth}px)` : `repeat(${daysArr.length}, 1fr)`) }}>
												{daysArr.map((dayData: any, dayIndex: number) => {
													const contractStartDate = new Date(contract.startDate);
													contractStartDate.setHours(0, 0, 0, 0);
													const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayData.day);
													currentDayDate.setHours(0, 0, 0, 0);
													const pattern = contract.patterns?.find((p: any) => p.dayOfWeek === dayData.dayOfWeek);
													const quantity = (currentDayDate >= contractStartDate && pattern) ? pattern.quantity || 0 : 0;
													const hasDelivery = quantity > 0;
													return (
														<div key={dayIndex} style={{ padding: 0, height: '30px', boxSizing: 'border-box', border: '1px solid #ccc', textAlign: 'center', backgroundColor: hasDelivery ? '#ffffcc' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'normal' }}>
															{hasDelivery ? (
																<span style={{ color: '#111', letterSpacing: '0.2px', fontFeatureSettings: '"tnum"', fontSize: '18px', lineHeight: 1 }}>{quantity}</span>
															) : ''}
														</div>
													);
												})}
											</div>
										))}
									</>
								);

								return (
									<>
										<div>
											{renderSection(firstHalf, false, dayRowRef, false)}
										</div>
										{secondHalf.length > 0 && (
											<div style={{ marginTop: 16, position: 'relative', transform: 'translateX(-225px)', width: '100%', paddingRight: '225px' }}>
												{renderSection(secondHalf, false)}
												{/* 右サイド: 単価と月本数（16日以降表示横） */}
												<div
													onMouseDown={(e)=>{ sidebarDragRef.current.isDragging = true; sidebarDragRef.current.startX = e.clientX - sidebarDragOffset.dx; sidebarDragRef.current.startY = e.clientY - sidebarDragOffset.dy; }}
													style={{ position: 'absolute', top: 0, right: -20, width: '180px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: 4, padding: '16px 12px 16px 12px', textAlign: 'left', cursor: 'move', transform: `translate(${sidebarDragOffset.dx}px, ${sidebarDragOffset.dy}px)` }}
												>
													<div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: 8 }}>単価 / 月本数</div>
													<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
														{contracts.map((contract: any) => {
															const monthlyQuantity = calendarData.reduce((sum, day) => {
																const pattern = contract.patterns?.find((p: any) => p.dayOfWeek === day.dayOfWeek);
																return sum + (pattern?.quantity || 0);
															}, 0);
															const unitPrice = contract.unitPrice || contract.product?.price || 0;
															return (
																<div key={`second-half-sidebar-${contract.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, fontSize: '12px', padding: '4px 0', borderBottom: '1px dashed #eee' }}>
																	<span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '100%' }}>{contract.product?.name ?? `#${contract.productId}`}</span>
																	<span style={{ color: '#111' }}>{formatCurrency(unitPrice)} / {monthlyQuantity}{contract.product?.unit}</span>
																</div>
															);
														})}
													</div>
												</div>
											</div>
										)}
									</>
								);
							})()}
						</div>
					</div>

					{/* 月間サマリー */}
					<div style={{ 
						padding: '16px', 
						borderTop: '2px solid #ccc', 
						backgroundColor: '#f0f8ff'
					}}>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '16px' }}>
							{/* 商品別サマリー */}
							<div>
								<h4 style={{ margin: '0 0 8px 0', color: '#333' }}>商品別月間合計</h4>
								{contracts.map((contract, index) => {
									const monthlyQuantity = calendarData.reduce((sum, day) => {
										const pattern = contract.patterns?.find((p: any) => p.dayOfWeek === day.dayOfWeek);
										return sum + (pattern?.quantity || 0);
									}, 0);
									const unitPrice = contract.unitPrice || contract.product?.price || 0;
									const monthlyAmount = monthlyQuantity * unitPrice;
									
									return (
										<div key={contract.id} style={{ fontSize: '11px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
											<span>{contract.product?.name}</span>
											<span>{monthlyQuantity}{contract.product?.unit} × {formatCurrency(unitPrice)} = {formatCurrency(monthlyAmount)}</span>
										</div>
									);
								})}
							</div>

							{/* 配達パターン */}
							<div>
								<h4 style={{ margin: '0 0 8px 0', color: '#333' }}>配達パターン</h4>
								{contracts.map((contract, index) => (
									<div key={contract.id} style={{ fontSize: '11px', marginBottom: '8px' }}>
										<div style={{ fontWeight: 'bold' }}>{contract.product?.name}</div>
										<div style={{ color: '#666', marginLeft: '8px' }}>
											{contract.patterns?.map((pattern: any) => (
												<div key={pattern.id}>
													{getDayName(pattern.dayOfWeek)}曜日: {pattern.quantity}{contract.product?.unit}
												</div>
											)) || '配達パターンなし'}
										</div>
									</div>
								))}
							</div>

							{/* 月間合計 */}
							<div>
								<h4 style={{ margin: '0 0 8px 0', color: '#333' }}>月間合計</h4>
								<div style={{ fontSize: '14px', marginBottom: '8px' }}>
									<div>契約商品数: {contracts.length}件</div>
									<div>配達予定日数: {calendarData.filter(day => {
										return contracts.some(contract => 
											contract.patterns?.some((p: any) => p.dayOfWeek === day.dayOfWeek && p.quantity > 0)
										);
									}).length}日</div>
									<div>月間配達本数: {calendarData.reduce((sum, day) => {
										let dayTotal = 0;
										contracts.forEach(contract => {
											const pattern = contract.patterns?.find((p: any) => p.dayOfWeek === day.dayOfWeek);
											dayTotal += pattern?.quantity || 0;
										});
										return sum + dayTotal;
									}, 0)}個</div>
								</div>
								<div style={{ 
									fontSize: '18px', 
									fontWeight: 'bold', 
									color: '#d32f2f',
									borderTop: '1px solid #ccc',
									paddingTop: '8px'
								}}>
									{formatCurrency(calendarData.reduce((sum, day) => {
										let dayTotal = 0;
										contracts.forEach(contract => {
											const pattern = contract.patterns?.find((p: any) => p.dayOfWeek === day.dayOfWeek);
											const quantity = pattern?.quantity || 0;
											const unitPrice = contract.unitPrice || contract.product?.price || 0;
											dayTotal += quantity * unitPrice;
										});
										return sum + dayTotal;
									}, 0))}
								</div>
							</div>

							{/* 請求書セクション */}
							<div style={{ marginTop: '24px', borderTop: '2px solid #1976d2', paddingTop: '16px' }}>
								<h4 style={{ margin: '0 0 16px 0', color: '#1976d2', fontSize: '16px' }}>📄 請求書</h4>
								
								{/* 今月の請求書作成ボタン */}
								<div style={{ marginBottom: '16px' }}>
									<button
										onClick={createMonthlyInvoice}
										disabled={invoiceLoading}
										style={{
											backgroundColor: invoiceLoading ? '#ccc' : '#1976d2',
											color: 'white',
											border: 'none',
											padding: '12px 24px',
											borderRadius: '6px',
											fontSize: '14px',
											fontWeight: 'bold',
											cursor: invoiceLoading ? 'not-allowed' : 'pointer',
											transition: 'background-color 0.2s'
										}}
									>
										{invoiceLoading ? '作成中...' : `${new Date().getMonth() + 1}月分請求書作成`}
									</button>
									<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
										契約内容に基づいて今月の請求書を作成します
									</div>
								</div>

								{/* 請求履歴 */}
								<div>
									<h5 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '14px' }}>請求履歴</h5>
									{invoiceHistory.length > 0 ? (
										<div style={{ maxHeight: '200px', overflowY: 'auto' }}>
											{invoiceHistory.map((invoice: any) => (
												<div
													key={invoice.id}
													style={{
														display: 'flex',
														justifyContent: 'space-between',
														alignItems: 'center',
														padding: '8px 12px',
														backgroundColor: '#f8f9fa',
														border: '1px solid #e9ecef',
														borderRadius: '4px',
														marginBottom: '4px',
														fontSize: '13px'
													}}
												>
													<div>
														<div style={{ fontWeight: 'bold' }}>
															{new Date(invoice.invoicePeriodStart).toLocaleDateString('ja-JP')} 
															～ {new Date(invoice.invoicePeriodEnd).toLocaleDateString('ja-JP')}
														</div>
														<div style={{ color: '#666', fontSize: '11px' }}>
															発行日: {new Date(invoice.issuedDate).toLocaleDateString('ja-JP')}
														</div>
													</div>
													<div style={{ 
														fontWeight: 'bold', 
														color: '#d32f2f',
														fontSize: '14px'
													}}>
														{formatCurrency(invoice.totalAmount)}
													</div>
												</div>
											))}
										</div>
									) : (
										<div style={{ 
											fontSize: '12px', 
											color: '#666', 
											fontStyle: 'italic',
											padding: '8px',
											backgroundColor: '#f8f9fa',
											borderRadius: '4px'
										}}>
											請求履歴がありません
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			

			{/* コース変更モーダル */}
			{showCourseModal && (
				<div style={{ 
					position: 'fixed', 
					top: 0, 
					left: 0, 
					width: '100%', 
					height: '100%', 
					backgroundColor: 'rgba(0,0,0,0.5)', 
					display: 'flex', 
					alignItems: 'center', 
					justifyContent: 'center',
					zIndex: 1000
				}}>
					<div style={{
						backgroundColor: 'white',
						padding: '24px',
						borderRadius: '8px',
						minWidth: '400px',
						maxWidth: '500px'
					}}>
						<h3 style={{ margin: '0 0 16px 0', color: '#333' }}>配達コース変更</h3>
						
						<div style={{ marginBottom: '16px' }}>
							<label style={{ 
								display: 'block', 
								marginBottom: '8px', 
								fontWeight: 'bold',
								color: '#333'
							}}>
								新しいコースを選択してください:
							</label>
							<select
								value={selectedCourse || ''}
								onChange={(e) => setSelectedCourse(Number(e.target.value) || null)}
								style={{
									width: '100%',
									padding: '8px 12px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px'
								}}
							>
								<option value="">コースを選択...</option>
								{availableCourses.map((course: any) => (
									<option key={course.id} value={course.id}>
										{course.name} {course.description ? `(${course.description})` : ''}
									</option>
								))}
							</select>
						</div>

						<div style={{ 
							display: 'flex', 
							gap: '12px', 
							justifyContent: 'flex-end' 
						}}>
							<button
								onClick={() => setShowCourseModal(false)}
								style={{
									backgroundColor: '#ccc',
									color: '#333',
									border: 'none',
									padding: '8px 16px',
									borderRadius: '4px',
									cursor: 'pointer'
								}}
							>
								キャンセル
							</button>
							<button
								onClick={changeCourse}
								disabled={courseLoading || !selectedCourse}
								style={{
									backgroundColor: courseLoading || !selectedCourse ? '#ccc' : '#4CAF50',
									color: 'white',
									border: 'none',
									padding: '8px 16px',
									borderRadius: '4px',
									cursor: courseLoading || !selectedCourse ? 'not-allowed' : 'pointer'
								}}
							>
								{courseLoading ? '変更中...' : '変更'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 口座情報モーダル */}
			<Modal open={bankOpen} title="🏦 口座情報" onClose={() => setBankOpen(false)}>
				<form onSubmit={bankForm.handleSubmit(saveBank)} style={{ display: 'grid', gap: 8 }}>
					<FormTextField label="銀行コード+支店コード（7桁）" placeholder="0001234" {...bankForm.register('bankBranchCode7')} error={bankForm.formState.errors.bankBranchCode7 as any} />
					<FormTextField label="口座番号（7桁）" placeholder="0012345" {...bankForm.register('accountNumber7')} error={bankForm.formState.errors.accountNumber7 as any} />
					<FormTextField label="口座名義（半角カタカナ）" placeholder="ﾔﾏﾀﾞ ﾀﾛｳ"
						{...bankForm.register('accountHolderKana', {
							onBlur: (e) => {
								const v = toHalfWidthKana(e.target.value);
								bankForm.setValue('accountHolderKana', v, { shouldValidate: true, shouldDirty: true });
							},
						})}
						onCompositionEnd={(e) => {
							const v = toHalfWidthKana((e.target as HTMLInputElement).value);
							bankForm.setValue('accountHolderKana', v, { shouldValidate: true, shouldDirty: true });
						}}
						error={bankForm.formState.errors.accountHolderKana as any}
					/>
					<FormTextField label="顧客コード（7桁）" readOnly {...bankForm.register('customerCode7')} error={bankForm.formState.errors.customerCode7 as any} />
					<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
						<button type="button" className="ghost" onClick={() => setBankOpen(false)}>閉じる</button>
						<button type="submit">保存</button>
					</div>
				</form>
			</Modal>
		</div>
	);
}


