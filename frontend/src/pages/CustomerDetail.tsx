import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { downloadBlob, postPdf } from '../lib/api';
import { getDataTyped, putDataTyped, postDataTyped, deleteVoid } from '../lib/typedApi';
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

	// 契約操作モーダル用の状態
	const [contractOpsOpen, setContractOpsOpen] = React.useState(false);
	const [selectedContractId, setSelectedContractId] = React.useState<number | null>(null);
	const [contractOpsTab, setContractOpsTab] = React.useState<'add'|'pause'|'cancel'|'patternChange'|'temporaryAdd'>('add');
	const [allProducts, setAllProducts] = React.useState<any[]>([]);
	const [addForm, setAddForm] = React.useState<{ productId?: number; startDate?: string; unitPrice?: number; days: Record<number, number> }>({ days: {0:0,1:0,2:0,3:0,4:0,5:0,6:0} });
	const selectedContract = React.useMemo(()=> contracts.find((c:any)=>c.id===selectedContractId), [contracts, selectedContractId]);
	const [pauseForm, setPauseForm] = React.useState<{ startDate?: string; endDate?: string }>({ startDate: undefined, endDate: undefined });
	const [cancelForm, setCancelForm] = React.useState<{ cancelDate?: string }>({ cancelDate: undefined });
	const [patternChangeForm, setPatternChangeForm] = React.useState<{ changeDate?: string; patterns: Record<number, number> }>({ 
		changeDate: undefined, 
		patterns: {0:0,1:0,2:0,3:0,4:0,5:0,6:0} 
	});
	const [temporaryAddForm, setTemporaryAddForm] = React.useState<{ productId?: number; deliveryDate?: string; quantity?: number; unitPrice?: number }>({});
	const [temporaryDeliveries, setTemporaryDeliveries] = React.useState<any[]>([]);
	const [clickedCalendarDate, setClickedCalendarDate] = React.useState<Date | null>(null);
	
	// パターン変更タブが選択された時に、クリックした日付をデフォルトで設定
	React.useEffect(() => {
		if (contractOpsTab === 'patternChange' && clickedCalendarDate) {
			const iso = toLocalYmd(clickedCalendarDate);
			setPatternChangeForm(prev => ({ ...prev, changeDate: iso }));
		}
	}, [contractOpsTab, clickedCalendarDate]);
	
	// 商品追加タブが選択された時に、クリックした日付を開始日欄にデフォルトで設定
	React.useEffect(() => {
		if (contractOpsTab === 'add' && clickedCalendarDate) {
			const iso = toLocalYmd(clickedCalendarDate);
			setAddForm(prev => ({ ...prev, startDate: iso }));
		}
	}, [contractOpsTab, clickedCalendarDate]);
	
	// 臨時商品追加タブが選択された時に、クリックした日付を追加日欄にデフォルトで設定
	React.useEffect(() => {
		if (contractOpsTab === 'temporaryAdd' && clickedCalendarDate) {
			const iso = toLocalYmd(clickedCalendarDate);
			setTemporaryAddForm(prev => ({ ...prev, deliveryDate: iso }));
		}
	}, [contractOpsTab, clickedCalendarDate]);
	
	// 商品リストを読み込み
	React.useEffect(() => {
		const loadProducts = async () => {
			try {
				const prods = await getDataTyped<any[]>('/api/products');
				const products = Array.isArray(prods) ? prods : (prods as any)?.data ?? [];
				setAllProducts(products);
			} catch (error) {
				console.error('商品リストの取得に失敗しました:', error);
			}
		};
		loadProducts();
	}, []);

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
			
			// 各契約のパターン変更履歴を取得
			for (const contract of contractsArray) {
				try {
					const patternChanges = await getDataTyped(`/api/customers/${customerId}/contracts/${contract.id}/pattern-changes`) as any;
					contract.patternChanges = Array.isArray(patternChanges) ? patternChanges : (patternChanges?.data || []);
				} catch (e) {
					console.log(`契約 ${contract.id} のパターン変更履歴の取得に失敗しました:`, e);
					contract.patternChanges = [];
				}
			}

			setContracts(contractsArray);
			
		// カレンダーデータを生成
		generateCalendarDataWithDate(contractsArray, new Date());
			
			// 請求履歴を取得
			try {
				const historyData = await getDataTyped(`/api/reports/invoice-history/${customerId}`) as any;
				setInvoiceHistory(historyData || []);
			} catch (e) {
				console.log('請求履歴の取得に失敗しました:', e);
			}

			// 臨時配達データを取得
			try {
				const tempDeliveries = await getDataTyped(`/api/customers/${customerId}/temporary-deliveries`) as any;
				setTemporaryDeliveries(Array.isArray(tempDeliveries) ? tempDeliveries : (tempDeliveries?.data || []));
			} catch (e) {
				console.log('臨時配達データの取得に失敗しました:', e);
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

	// 月が変わった時やデータが更新された時にカレンダーデータを再生成
	React.useEffect(() => {
		if (contracts.length > 0) {
			generateCalendarDataWithDate(contracts, currentDate, temporaryDeliveries);
		}
	}, [currentDate, contracts, temporaryDeliveries]);

	// 前半（日付行）の1セル幅を測定し、後半にも適用
	React.useEffect(() => {
		if (dayRowRef.current) {
			const firstCell = dayRowRef.current.querySelector('.day-cell') as HTMLElement | null;
			if (firstCell) {
				setDayCellWidth(firstCell.getBoundingClientRect().width);
			}
		}
	}, [calendarData, currentDate, contracts]);

	// カレンダーデータ生成（指定された日付で）
	const generateCalendarDataWithDate = (contractsData: any[], targetDate: Date, tempDeliveries: any[] = []) => {
		const year = targetDate.getFullYear();
		const month = targetDate.getMonth();
		
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
				
				// 解約日をチェック
				let isAfterCancelDate = false;
				if (contract.cancelDate) {
					const cancelDate = new Date(contract.cancelDate);
					cancelDate.setHours(0, 0, 0, 0);
					isAfterCancelDate = currentDayDate > cancelDate;
				}
				
				// 契約開始日以降かつ解約日以前の場合のみ配達を表示
				if (currentDayDate >= contractStartDate && !isAfterCancelDate && contract.patterns) {
					// パターン変更履歴をチェック
					let effectivePatterns = contract.patterns;
					if (contract.patternChanges && contract.patternChanges.length > 0) {
						// その日以降に適用される最新のパターン変更を取得
						const applicableChange = contract.patternChanges
							.filter((change: any) => {
								const changeDate = new Date(change.changeDate);
								changeDate.setHours(0, 0, 0, 0);
								return changeDate <= currentDayDate; // 変更日当日から適用
							})
							.sort((a: any, b: any) => new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime())[0];
						
						if (applicableChange) {
							// パターン変更履歴のパターンを使用
							const changePatterns = JSON.parse(applicableChange.patterns);
							effectivePatterns = Object.entries(changePatterns).map(([dayOfWeek, quantity]) => ({
								dayOfWeek: parseInt(dayOfWeek),
								quantity: quantity as number
							}));
						}
					}
					
					// 曜日が一致するパターンを探す
					effectivePatterns.forEach((pattern: any) => {
						if (pattern.dayOfWeek === dayOfWeek && pattern.quantity > 0) {
							deliveries.push({
								contractId: contract.id,
								productName: contract.product?.name || '不明な商品',
								quantity: pattern.quantity,
								unitPrice: contract.unitPrice || 0,
								totalPrice: (contract.unitPrice || 0) * pattern.quantity
							});
						}
					});
				}
			});
			
			// 臨時配達を追加
			tempDeliveries.forEach(tempDelivery => {
				const tempDeliveryDate = new Date(tempDelivery.deliveryDate);
				tempDeliveryDate.setHours(0, 0, 0, 0);
				const currentDayDate = new Date(year, month, day);
				currentDayDate.setHours(0, 0, 0, 0);
				if (tempDeliveryDate.getTime() === currentDayDate.getTime()) {
					deliveries.push({
						contractId: null, // 臨時配達は契約IDなし
						productName: tempDelivery.product?.name || '不明な商品',
						quantity: tempDelivery.quantity,
						unitPrice: tempDelivery.unitPrice || 0,
						totalPrice: (tempDelivery.unitPrice || 0) * tempDelivery.quantity,
						isTemporary: true // 臨時配達フラグ
					});
				}
			});
			
			calendar.push({
				day: day,
				date: date,
				dayOfWeek: dayOfWeek,
				deliveries: deliveries,
				totalQuantity: deliveries.reduce((sum, d) => sum + d.quantity, 0),
				totalPrice: deliveries.reduce((sum, d) => sum + d.totalPrice, 0)
			});
		}
		
		setCalendarData(calendar);
	};

	// 月を変更
	const changeMonth = (direction: number) => {
		const newDate = new Date(currentDate);
		newDate.setMonth(newDate.getMonth() + direction);
		setCurrentDate(newDate);
		// 月変更時にカレンダーデータを再生成（新しい日付で）
		if (contracts.length > 0) {
			generateCalendarDataWithDate(contracts, newDate, temporaryDeliveries);
		}
	};

	const formatCurrency = (n: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n);
	const getDayName = (dayOfWeek: number) => ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek];
	const toLocalYmd = (date: Date) => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	};

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

	const openContractOps = async (contractId: number | null, clickedDate?: Date) => {
		setSelectedContractId(contractId);
		setContractOpsOpen(true);
		// クリックした日付を保存
		setClickedCalendarDate(clickedDate || null);
		// 初期タブは商品追加
		setContractOpsTab('add');
		// 追加フォーム初期値
		const startDate = clickedDate ? toLocalYmd(clickedDate) : toLocalYmd(new Date());
		setAddForm({ days:{0:0,1:0,2:0,3:0,4:0,5:0,6:0}, startDate: startDate });
		const base = clickedDate ?? new Date();
		const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
		const iso = toLocalYmd(d);
		setPauseForm({ startDate: iso, endDate: iso });
		setCancelForm({ cancelDate: iso });
	};

	const closeContractOps = () => { setContractOpsOpen(false); setSelectedContractId(null); };

	const reloadContracts = async () => {
		try {
			const contractsData = await getDataTyped<any>(`/api/customers/${customerId}/contracts`);
			const contractsArray = Array.isArray(contractsData) ? contractsData : (contractsData?.data ?? []);
			
			// 各契約のパターン変更履歴を取得
			for (const contract of contractsArray) {
				try {
					const patternChanges = await getDataTyped(`/api/customers/${customerId}/contracts/${contract.id}/pattern-changes`) as any;
					contract.patternChanges = Array.isArray(patternChanges) ? patternChanges : (patternChanges?.data || []);
				} catch (e) {
					console.log(`契約 ${contract.id} のパターン変更履歴の取得に失敗しました:`, e);
					contract.patternChanges = [];
				}
			}
			
			setContracts(contractsArray);
			generateCalendarDataWithDate(contractsArray, new Date());
		} catch (error) {
			console.error('契約データの取得に失敗しました:', error);
		}
	};

	const reloadTemporaryDeliveries = async () => {
		try {
			const data = await getDataTyped<any[]>(`/api/customers/${customerId}/temporary-deliveries`);
			setTemporaryDeliveries(data);
			// カレンダーデータを再生成
			if (contracts.length > 0) {
				generateCalendarDataWithDate(contracts, currentDate, data);
			}
		} catch (error) {
			console.error('臨時配達データの取得に失敗しました:', error);
		}
	};

	const submitAddProduct = async () => {
		try {
			if (!addForm.productId || !addForm.startDate) return;
			const body:any = {
				productId: addForm.productId,
				startDate: addForm.startDate,
				unitPrice: addForm.unitPrice ?? 0,
				patternType: '1',
				sunday: addForm.days[0]||0,
				monday: addForm.days[1]||0,
				tuesday: addForm.days[2]||0,
				wednesday: addForm.days[3]||0,
				thursday: addForm.days[4]||0,
				friday: addForm.days[5]||0,
				saturday: addForm.days[6]||0,
				isActive: true,
			};
			await postDataTyped<typeof body, any>(`/api/customers/${customerId}/contracts`, body);
			await reloadContracts();
			setContractOpsOpen(false);
			toast.notify('success','商品を追加しました');
		} catch { toast.notify('error','商品追加に失敗しました'); }
	};


	const submitPause = async () => {
		if (!selectedContractId) return;
		try {
			if (pauseForm.startDate && pauseForm.endDate) {
				await postDataTyped(`/api/customers/${customerId}/contracts/${selectedContractId}/pauses`, {
					startDate: pauseForm.startDate,
					endDate: pauseForm.endDate
				});
			}
			await reloadContracts();
			setContractOpsOpen(false);
			const msg = pauseForm?.startDate && pauseForm?.endDate ? `休配にしました（${pauseForm.startDate} ～ ${pauseForm.endDate}）` : '休配にしました';
			toast.notify('success', msg);
		} catch { toast.notify('error','休配に失敗しました'); }
	};
	const submitCancel = async () => {
		if (!selectedContractId || !cancelForm.cancelDate) return;
		try { 
			await putDataTyped(`/api/customers/${customerId}/contracts/${selectedContractId}`, { 
				cancelDate: cancelForm.cancelDate,
				isActive: false 
			}); 
			await reloadContracts(); 
			setContractOpsOpen(false); 
			toast.notify('success',`解約しました（解約日: ${cancelForm.cancelDate}）`); 
		} catch { 
			toast.notify('error','解約に失敗しました'); 
		}
	};

	const submitPatternChange = async () => {
		if (!selectedContractId || !patternChangeForm.changeDate) return;
		try {
			await postDataTyped(`/api/customers/${customerId}/contracts/${selectedContractId}/pattern-changes`, {
				changeDate: patternChangeForm.changeDate,
				patterns: patternChangeForm.patterns
			});
			await reloadContracts();
			setContractOpsOpen(false);
			toast.notify('success', `パターン変更を登録しました（変更日: ${patternChangeForm.changeDate}）`);
		} catch {
			toast.notify('error', 'パターン変更の登録に失敗しました');
		}
	};

	const submitTemporaryAdd = async () => {
		if (!temporaryAddForm.productId || !temporaryAddForm.deliveryDate || !temporaryAddForm.quantity) {
			toast.notify('error', '商品、追加日、本数を入力してください');
			return;
		}
		try {
			await postDataTyped(`/api/customers/${customerId}/temporary-deliveries`, {
				productId: temporaryAddForm.productId,
				deliveryDate: temporaryAddForm.deliveryDate,
				quantity: temporaryAddForm.quantity,
				unitPrice: temporaryAddForm.unitPrice || 0
			});
			toast.notify('success', '臨時商品を追加しました');
			closeContractOps();
			await reloadContracts();
			await reloadTemporaryDeliveries();
		} catch (error) {
			console.error('臨時商品追加エラー:', error);
			toast.notify('error', '臨時商品の追加に失敗しました');
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
							{contracts
								.filter((contract: any) => {
									// 解約日チェック：解約日が設定されている場合、現在の月が解約月より前かどうか
									if (contract.cancelDate) {
										const cancelDate = new Date(contract.cancelDate);
										const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
										const cancelMonth = new Date(cancelDate.getFullYear(), cancelDate.getMonth(), 1);
										return currentMonth <= cancelMonth;
									}
									return true;
								})
								.map((contract, index) => (
								<div key={contract.id} style={{ 
									padding: 0, 
									border: '1px solid #ccc', 
									height: '30px',
									boxSizing: 'border-box',
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'center', cursor: 'pointer'
								}}>
									<div onClick={()=>openContractOps(contract.id)} style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: '14px', height: '14px', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', padding: '0 4px' }}>
										{contract.product?.name || `商品ID: ${contract.productId}`}
									</div>
									{/* 単価表示は非表示 */}
								</div>
							))}
							
							{/* 臨時配達商品名（現在の月のみ） */}
							{temporaryDeliveries
								.filter((tempDelivery: any) => {
									const tempDeliveryDate = new Date(tempDelivery.deliveryDate);
									return tempDeliveryDate.getFullYear() === currentDate.getFullYear() && 
										   tempDeliveryDate.getMonth() === currentDate.getMonth();
								})
								.map((tempDelivery: any) => (
								<div key={`temp-name-${tempDelivery.id}`} style={{ 
									padding: 0, 
									border: '1px solid #ccc', 
									height: '30px',
									boxSizing: 'border-box',
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'center',
									backgroundColor: '#f8f9fa'
								}}>
									<div style={{ 
										fontWeight: 'bold', 
										fontSize: '14px', 
										lineHeight: '14px', 
										height: '14px', 
										margin: 0, 
										overflow: 'hidden', 
										whiteSpace: 'nowrap', 
										textOverflow: 'ellipsis', 
										padding: '0 4px',
										color: '#1976d2'
									}}>
										{tempDelivery.product?.name || '不明な商品'} (臨時)
									</div>
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
										{/* 各商品の配達数量行（解約月以降は非表示） */}
										{contracts
											.filter((contract: any) => {
												// 解約日チェック：解約日が設定されている場合、現在の月が解約月より前かどうか
												if (contract.cancelDate) {
													const cancelDate = new Date(contract.cancelDate);
													const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
													const cancelMonth = new Date(cancelDate.getFullYear(), cancelDate.getMonth(), 1);
													return currentMonth <= cancelMonth;
												}
												return true;
											})
											.map((contract: any) => (
											<div key={contract.id} style={{ display: 'grid', gridTemplateColumns: (isSecondHalf && dayCellWidth ? `repeat(${daysArr.length}, ${dayCellWidth}px)` : `repeat(${daysArr.length}, 1fr)`) }}>
												{daysArr.map((dayData: any, dayIndex: number) => {
													const contractStartDate = new Date(contract.startDate);
													contractStartDate.setHours(0, 0, 0, 0);
													const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayData.day);
													currentDayDate.setHours(0, 0, 0, 0);
													// 解約日判定
													const cancelDate = contract.cancelDate ? new Date(contract.cancelDate) : null;
													cancelDate?.setHours(0, 0, 0, 0);
													const isCancelDate = cancelDate && currentDayDate.getTime() === cancelDate.getTime();
													const isAfterCancelDate = cancelDate && currentDayDate > cancelDate;
													
													// カレンダーデータから配達情報を取得
													const dayDeliveries = calendarData.find(d => d.day === dayData.day)?.deliveries || [];
													const contractDelivery = dayDeliveries.find(d => d.contractId === contract.id);
													const quantity = contractDelivery ? contractDelivery.quantity : 0;
													const hasDelivery = quantity > 0;
													
													return (
														<div key={dayIndex} onClick={()=>openContractOps(contract.id, currentDayDate)} style={{ padding: 0, height: '30px', boxSizing: 'border-box', border: '1px solid #ccc', textAlign: 'center', backgroundColor: hasDelivery ? '#ffffcc' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'normal', cursor: 'pointer' }}>
															{(() => {
																// 解約日判定：解約日に「解」を表示
																if (isCancelDate) return <span style={{ color: '#d32f2f', fontSize: 14, fontWeight: 'bold' }}>解</span>;
																
																// 休配判定：選択契約のpausesに現在日が含まれるか（契約データに含まれている想定）
																const paused = (contract.pauses ?? []).some((p:any)=>{
																	const ps = new Date(p.startDate); ps.setHours(0,0,0,0);
																	const pe = new Date(p.endDate); pe.setHours(23,59,59,999);
																	return ps <= currentDayDate && currentDayDate <= pe;
																});
																// 配達本数がある日に限り「休」を表示
																if (hasDelivery && paused) return <span style={{ color: '#d32f2f', fontSize: 14, fontWeight: 'bold' }}>休</span>;
																
																// 契約配達の本数を表示
																return hasDelivery ? <span style={{ color: '#111', letterSpacing: '0.2px', fontFeatureSettings: '"tnum"', fontSize: '18px', lineHeight: 1 }}>{quantity}</span> : '';
															})()}
														</div>
													);
												})}
											</div>
										))}
										
										{/* 臨時配達商品の行（現在の月のみ） */}
										{temporaryDeliveries
											.filter((tempDelivery: any) => {
												const tempDeliveryDate = new Date(tempDelivery.deliveryDate);
												return tempDeliveryDate.getFullYear() === currentDate.getFullYear() && 
													   tempDeliveryDate.getMonth() === currentDate.getMonth();
											})
											.map((tempDelivery: any) => (
											<div key={`temp-${tempDelivery.id}`} style={{ display: 'grid', gridTemplateColumns: (isSecondHalf && dayCellWidth ? `repeat(${daysArr.length}, ${dayCellWidth}px)` : `repeat(${daysArr.length}, 1fr)`) }}>
												{daysArr.map((dayData: any, dayIndex: number) => {
													const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayData.day);
													currentDayDate.setHours(0, 0, 0, 0);
													const tempDeliveryDate = new Date(tempDelivery.deliveryDate);
													tempDeliveryDate.setHours(0, 0, 0, 0);
													const isTempDeliveryDay = tempDeliveryDate.getTime() === currentDayDate.getTime();
													
													return (
														<div key={dayIndex} style={{ padding: 0, height: '30px', boxSizing: 'border-box', border: '1px solid #ccc', textAlign: 'center', backgroundColor: isTempDeliveryDay ? '#e3f2fd' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'normal' }}>
															{isTempDeliveryDay ? (
																<span style={{ color: '#1976d2', letterSpacing: '0.2px', fontFeatureSettings: '"tnum"', fontSize: '18px', lineHeight: 1, fontWeight: 'bold' }}>
																	{tempDelivery.quantity}
																</span>
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
																const dayDeliveries = day.deliveries || [];
																const contractDelivery = dayDeliveries.find(d => d.contractId === contract.id);
																return sum + (contractDelivery ? contractDelivery.quantity : 0);
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
							{/* 商品別サマリー（解約月以降は非表示） */}
							<div>
								<h4 style={{ margin: '0 0 8px 0', color: '#333' }}>商品別月間合計</h4>
								{contracts
									.filter((contract: any) => {
										// 解約日チェック：解約日が設定されている場合、現在の月が解約月より前かどうか
										if (contract.cancelDate) {
											const cancelDate = new Date(contract.cancelDate);
											const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
											const cancelMonth = new Date(cancelDate.getFullYear(), cancelDate.getMonth(), 1);
											return currentMonth <= cancelMonth;
										}
										return true;
									})
									.map((contract, index) => {
									const monthlyQuantity = calendarData.reduce((sum, day) => {
										const pattern = contract.patterns?.find((p: any) => p.dayOfWeek === day.dayOfWeek);
										const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day.day);
										dayDate.setHours(0, 0, 0, 0);
										
										// 解約日以降は配達を除外
										const cancelDate = contract.cancelDate ? new Date(contract.cancelDate) : null;
										cancelDate?.setHours(0, 0, 0, 0);
										const isAfterCancelDate = cancelDate && dayDate > cancelDate;
										
										return sum + ((pattern?.quantity || 0) * (isAfterCancelDate ? 0 : 1));
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

							{/* 配達パターン（解約月以降は非表示） */}
							<div>
								<h4 style={{ margin: '0 0 8px 0', color: '#333' }}>配達パターン</h4>
								{contracts
									.filter((contract: any) => {
										// 解約日チェック：解約日が設定されている場合、現在の月が解約月より前かどうか
										if (contract.cancelDate) {
											const cancelDate = new Date(contract.cancelDate);
											const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
											const cancelMonth = new Date(cancelDate.getFullYear(), cancelDate.getMonth(), 1);
											return currentMonth <= cancelMonth;
										}
										return true;
									})
									.map((contract, index) => (
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

							{/* 臨時配達商品（現在の月のみ） */}
							{temporaryDeliveries.filter((tempDelivery: any) => {
								const tempDeliveryDate = new Date(tempDelivery.deliveryDate);
								return tempDeliveryDate.getFullYear() === currentDate.getFullYear() && 
									   tempDeliveryDate.getMonth() === currentDate.getMonth();
							}).length > 0 && (
								<div>
									<h4 style={{ margin: '0 0 8px 0', color: '#333' }}>臨時配達商品</h4>
									{temporaryDeliveries
										.filter((tempDelivery: any) => {
											const tempDeliveryDate = new Date(tempDelivery.deliveryDate);
											return tempDeliveryDate.getFullYear() === currentDate.getFullYear() && 
												   tempDeliveryDate.getMonth() === currentDate.getMonth();
										})
										.map((tempDelivery, index) => (
										<div key={tempDelivery.id} style={{ fontSize: '11px', marginBottom: '8px', padding: '8px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '4px' }}>
											<div style={{ fontWeight: 'bold', color: '#1976d2' }}>{tempDelivery.product?.name || '不明な商品'}</div>
											<div style={{ color: '#666', marginLeft: '8px' }}>
												<div>配達日: {new Date(tempDelivery.deliveryDate).toLocaleDateString('ja-JP')}</div>
												<div>数量: {tempDelivery.quantity}{tempDelivery.product?.unit || '個'}</div>
												<div>単価: {formatCurrency(tempDelivery.unitPrice || 0)}</div>
												<div>合計: {formatCurrency((tempDelivery.unitPrice || 0) * tempDelivery.quantity)}</div>
											</div>
										</div>
									))}
								</div>
							)}

							{/* 月間合計 */}
							<div>
								<h4 style={{ margin: '0 0 8px 0', color: '#333' }}>月間合計</h4>
								<div style={{ fontSize: '14px', marginBottom: '8px' }}>
									<div>契約商品数: {contracts.length}件</div>
									<div>配達予定日数: {calendarData.filter(day => {
										return (day.totalQuantity || 0) > 0;
									}).length}日</div>
									<div>月間配達本数: {calendarData.reduce((sum, day) => {
										return sum + (day.totalQuantity || 0);
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
									return sum + (day.totalPrice || 0);
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

			{/* 契約操作モーダル */}
			{contractOpsOpen && (
				<Modal open={contractOpsOpen} title="契約の操作" onClose={closeContractOps}>
					{selectedContract && (
						<div style={{ marginBottom: 8, color: '#333', fontWeight: 'bold' }}>
							対象商品: {selectedContract?.product?.name ?? `#${selectedContract?.productId}`}
						</div>
					)}
					<div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
						<button className={contractOpsTab==='add'?'' as any:'ghost'} onClick={()=>setContractOpsTab('add')}>商品追加</button>
						<button className={contractOpsTab==='temporaryAdd'?'' as any:'ghost'} onClick={()=>setContractOpsTab('temporaryAdd')}>臨時商品追加</button>
						<button className={contractOpsTab==='patternChange'?'' as any:'ghost'} onClick={()=>setContractOpsTab('patternChange')} disabled={!selectedContractId}>パターン変更</button>
						<button className={contractOpsTab==='pause'?'' as any:'ghost'} onClick={()=>setContractOpsTab('pause')} disabled={!selectedContractId}>休配</button>
						<button className={contractOpsTab==='cancel'?'' as any:'ghost'} onClick={()=>setContractOpsTab('cancel')} disabled={!selectedContractId}>解約</button>
					</div>
					{contractOpsTab==='add' && (
						<div style={{ display: 'grid', gap: 8 }}>
							<label>商品
								<select value={addForm.productId??''} onChange={(e)=>{
									const productId = Number(e.target.value)||undefined;
									const selectedProduct = allProducts.find(p => p.id === productId);
									setAddForm(prev=>({
										...prev, 
										productId: productId,
										unitPrice: selectedProduct?.price || 0
									}));
								}}>
									<option value="">選択してください</option>
									{allProducts.map((p:any)=>(<option key={p.id} value={p.id}>{p.name}</option>))}
								</select>
							</label>
							<label>開始日
								<input type="date" value={addForm.startDate??''} onChange={(e)=>setAddForm(prev=>({...prev, startDate: e.target.value}))} />
							</label>
							<label>単価
								<input type="number" value={addForm.unitPrice??0} onChange={(e)=>setAddForm(prev=>({...prev, unitPrice: Number(e.target.value)||0}))} placeholder="商品を選択すると自動入力されます" />
							</label>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
								{['日','月','火','水','木','金','土'].map((d,idx)=> (
									<label key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems:'center', fontSize: 12 }}>
										<span>{d}</span>
										<input type="number" min={0} value={addForm.days[idx]??0} onChange={(e)=>setAddForm(prev=>({ ...prev, days: { ...prev.days, [idx]: Number(e.target.value)||0 } }))} style={{ width: 56 }} />
									</label>
								))}
							</div>
							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
								<button className="ghost" onClick={closeContractOps}>閉じる</button>
								<button onClick={submitAddProduct}>追加</button>
							</div>
						</div>
					)}
					{contractOpsTab==='temporaryAdd' && (
						<div style={{ display: 'grid', gap: 8 }}>
							<label>商品選択
								<select value={temporaryAddForm.productId??''} onChange={(e)=>{
									const productId = Number(e.target.value)||undefined;
									const selectedProduct = allProducts.find(p => p.id === productId);
									setTemporaryAddForm(prev=>({
										...prev, 
										productId: productId,
										unitPrice: selectedProduct?.price || 0
									}));
								}}>
									<option value="">選択してください</option>
									{allProducts.map((p:any)=>(<option key={p.id} value={p.id}>{p.name}</option>))}
								</select>
							</label>
							<label>追加日
								<input type="date" value={temporaryAddForm.deliveryDate??''} onChange={(e)=>setTemporaryAddForm(prev=>({...prev, deliveryDate: e.target.value}))} />
							</label>
							<label>本数
								<input type="number" min={1} value={temporaryAddForm.quantity??''} onChange={(e)=>setTemporaryAddForm(prev=>({...prev, quantity: Number(e.target.value)||undefined}))} />
							</label>
							<label>単価
								<input type="number" min={0} value={temporaryAddForm.unitPrice??''} onChange={(e)=>setTemporaryAddForm(prev=>({...prev, unitPrice: Number(e.target.value)||undefined}))} placeholder="商品を選択すると自動入力されます" />
							</label>
							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
								<button className="ghost" onClick={closeContractOps}>閉じる</button>
								<button onClick={submitTemporaryAdd}>追加</button>
							</div>
						</div>
					)}
					{contractOpsTab==='pause' && selectedContractId && (
						<div style={{ display: 'grid', gap: 8 }}>
							<div>この契約を休配にします。開始日と終了日を指定できます。</div>
							<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
								<label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									開始日
									<input type="date" value={pauseForm.startDate ?? ''} onChange={(e)=> setPauseForm(prev=>({ ...prev, startDate: e.target.value }))} style={{ width: 130 }} />
								</label>
								<label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									終了日
									<input type="date" value={pauseForm.endDate ?? ''} onChange={(e)=> setPauseForm(prev=>({ ...prev, endDate: e.target.value }))} style={{ width: 130 }} />
								</label>
							</div>
							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
								<button className="ghost" onClick={closeContractOps}>キャンセル</button>
								<button onClick={submitPause}>休配にする</button>
							</div>
						</div>
					)}
					{contractOpsTab==='cancel' && selectedContractId && (
						<div style={{ display: 'grid', gap: 8 }}>
							<div>この契約を解約します。解約日を指定してください。元に戻せません。</div>
							<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
								<label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									解約日
									<input 
										type="date" 
										value={cancelForm.cancelDate ?? ''} 
										onChange={(e)=> setCancelForm(prev=>({ ...prev, cancelDate: e.target.value }))} 
										style={{ width: 130 }} 
									/>
								</label>
							</div>
							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
								<button className="ghost" onClick={closeContractOps}>キャンセル</button>
								<button 
									onClick={submitCancel} 
									disabled={!cancelForm.cancelDate}
									style={{ 
										backgroundColor: !cancelForm.cancelDate ? '#ccc' : '#d32f2f', 
										color: 'white',
										cursor: !cancelForm.cancelDate ? 'not-allowed' : 'pointer'
									}}
								>
									解約する
								</button>
							</div>
						</div>
					)}
					{contractOpsTab==='patternChange' && selectedContractId && (
						<div style={{ display: 'grid', gap: 8 }}>
							<div>指定した日付以降のパターンを変更します。変更日を指定してください。</div>
							<div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
								<label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									変更日
									<input 
										type="date" 
										value={patternChangeForm.changeDate ?? ''} 
										onChange={(e)=> setPatternChangeForm(prev=>({ ...prev, changeDate: e.target.value }))} 
										style={{ width: 130 }} 
									/>
								</label>
							</div>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
								{['日','月','火','水','木','金','土'].map((d,idx)=> (
									<label key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems:'center', fontSize: 12 }}>
										<span>{d}</span>
										<input 
											type="number" 
											min={0} 
											value={patternChangeForm.patterns[idx]??0} 
											onChange={(e)=>setPatternChangeForm(prev=>({ 
												...prev, 
												patterns: { ...prev.patterns, [idx]: Number(e.target.value)||0 }
											}))} 
											style={{ width: 56 }} 
										/>
									</label>
								))}
							</div>
							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
								<button className="ghost" onClick={closeContractOps}>キャンセル</button>
								<button 
									onClick={submitPatternChange} 
									disabled={!patternChangeForm.changeDate}
									style={{ 
										backgroundColor: !patternChangeForm.changeDate ? '#ccc' : '#1976d2', 
										color: 'white',
										cursor: !patternChangeForm.changeDate ? 'not-allowed' : 'pointer'
									}}
								>
									パターン変更を登録
								</button>
							</div>
						</div>
					)}
				</Modal>
			)}
		</div>
	);
}


