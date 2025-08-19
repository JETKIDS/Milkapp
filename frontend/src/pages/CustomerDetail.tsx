import React from 'react';
import { useParams } from 'react-router-dom';
import { getDataTyped, putDataTyped } from '../lib/typedApi';
import { useToast } from '../components/Toast';

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

	// 初期データ読み込み
	React.useEffect(() => { (async () => {
		setLoading(true);
		try {
			// 顧客一覧から該当顧客を取得
			const customersData = await getDataTyped(`/api/customers`) as any;
			const customer = customersData.data?.find((c: any) => c.id === customerId);
			setDetail({ data: customer });
			
			const contractsData = await getDataTyped(`/api/customers/${customerId}/contracts`) as any;

			
			// APIレスポンスの構造に応じて処理
			let contractsArray;
			if (Array.isArray(contractsData)) {
				// 直接配列が返される場合
				contractsArray = contractsData;
			} else if (contractsData && contractsData.data) {
				// {success: true, data: [...]} 形式の場合
				contractsArray = contractsData.data;
			} else {
				contractsArray = [];
			}
			

			setContracts(contractsArray);
			
			// カレンダーデータを生成
			generateCalendarData(contractsArray);
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

	return (
		<div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f5f5f5' }}>
			{/* ヘッダー部分 */}
			<div style={{ 
				backgroundColor: 'white', 
				padding: '16px', 
				marginBottom: '16px', 
				border: '1px solid #ccc',
				fontSize: '14px'
			}}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
					<div style={{ fontSize: '16px', fontWeight: 'bold' }}>御請求書</div>
					<div style={{ textAlign: 'right' }}>
						<div>登録</div>
						<div>「配達」Aコース</div>
						<div>「集金」A集金[1]-1</div>
					</div>
				</div>
				
				{detail && (
					<div style={{ display: 'flex', gap: '40px' }}>
						<div>
							<div>{detail.data?.name || '顧客名'} 様</div>
							<div style={{ fontSize: '12px', color: '#666' }}>
								(営業先No.{customerId} 担当:A)
							</div>
						</div>
						<div style={{ marginLeft: 'auto', textAlign: 'right' }}>
							<div>TEL: {detail.data?.phone || '000-000-0000'}</div>
						</div>
					</div>
				)}
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
			<div style={{ backgroundColor: 'white', border: '1px solid #ccc' }}>
				{/* 商品名を左側に表示 */}
				<div style={{ display: 'flex' }}>
					{/* 商品名列 */}
					<div style={{ minWidth: '150px', borderRight: '1px solid #ccc' }}>
						<div style={{ 
							padding: '8px', 
							border: '1px solid #ccc', 
							backgroundColor: '#f0f0f0', 
							textAlign: 'center',
							fontWeight: 'bold',
							fontSize: '12px'
						}}>
							商品名
						</div>
						{contracts.map((contract, index) => (
							<div key={contract.id} style={{ 
								padding: '6px', 
								border: '1px solid #ccc', 
								fontSize: '10px',
								minHeight: '32px',
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center'
							}}>
								<div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
									{index + 1}. {contract.product?.name || `商品ID: ${contract.productId}`}
								</div>
								<div style={{ color: '#666', fontSize: '9px' }}>
									単価: {formatCurrency(contract.unitPrice || contract.product?.price || 0)}
								</div>
								<div style={{ color: '#666', fontSize: '9px' }}>
									単位: {contract.product?.unit || '個'}
								</div>
							</div>
						))}
					</div>

					{/* カレンダー部分 */}
					<div style={{ flex: 1 }}>
						{/* カレンダーヘッダー（曜日） */}
						<div style={{ display: 'grid', gridTemplateColumns: `repeat(${new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()}, 1fr)`, fontSize: '10px', fontWeight: 'bold' }}>
							{calendarData.map((dayData, index) => (
								<div key={index} style={{ 
									padding: '4px 2px', 
									border: '1px solid #ccc', 
									backgroundColor: '#f0f0f0', 
									textAlign: 'center'
								}}>
									{getDayName(dayData.dayOfWeek)}
								</div>
							))}
						</div>

						{/* 日付行 */}
						<div style={{ display: 'grid', gridTemplateColumns: `repeat(${new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()}, 1fr)`, fontSize: '12px', fontWeight: 'bold' }}>
							{calendarData.map((dayData, index) => (
								<div key={index} style={{ 
									padding: '6px 2px', 
									border: '1px solid #ccc', 
									textAlign: 'center',
									backgroundColor: dayData.dayOfWeek === 0 || dayData.dayOfWeek === 6 ? '#ffebee' : '#e3f2fd'
								}}>
									{dayData.day}
								</div>
							))}
						</div>

						{/* 各商品の配達数量行 */}
						{contracts.map((contract, contractIndex) => (
							<div key={contract.id} style={{ 
								display: 'grid', 
								gridTemplateColumns: `repeat(${new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()}, 1fr)`, 
								fontSize: '11px' 
							}}>
															{calendarData.map((dayData, dayIndex) => {
								// 契約開始日をチェック
								const contractStartDate = new Date(contract.startDate);
								contractStartDate.setHours(0, 0, 0, 0);
								const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayData.day);
								currentDayDate.setHours(0, 0, 0, 0);
								
								// この日のこの商品の配達数量を取得（契約開始日以降のみ）
								const pattern = contract.patterns?.find((p: any) => p.dayOfWeek === dayData.dayOfWeek);
								const quantity = (currentDayDate >= contractStartDate && pattern) ? pattern.quantity || 0 : 0;
								const hasDelivery = quantity > 0;
								
								const unitPrice = contract.unitPrice || contract.product?.price || 0;
								const dailyAmount = quantity * unitPrice;
									
									return (
										<div key={dayIndex} style={{ 
											padding: '2px', 
											border: '1px solid #ccc', 
											textAlign: 'center',
											backgroundColor: hasDelivery ? '#ffffcc' : 'white',
											minHeight: '32px',
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: '9px'
										}}>
											{hasDelivery && (
												<>
													<div style={{ fontWeight: 'bold', color: '#333' }}>
														{quantity}
													</div>
													{unitPrice > 0 && (
														<div style={{ color: '#666', fontSize: '8px' }}>
															¥{dailyAmount.toLocaleString()}
														</div>
													)}
												</>
											)}
										</div>
									);
								})}
							</div>
						))}
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
					</div>
				</div>
			</div>

			{loading && (
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
					color: 'white',
					fontSize: '18px'
				}}>
					読み込み中...
				</div>
			)}
		</div>
	);
}


