import React from 'react';
import { useParams } from 'react-router-dom';
import { getDataTyped, putDataTyped } from '../lib/typedApi';
import { useToast } from '../components/Toast';

export function CustomerDetailPage() {
	const { id } = useParams();
	const customerId = Number(id);
	const toast = useToast();
	const [detail, setDetail] = React.useState<any>(null);
	const [calendar, setCalendar] = React.useState<any>(null);
	const [billing, setBilling] = React.useState<any>(null);
	const [position, setPosition] = React.useState<any[]>([]);
	const [courses, setCourses] = React.useState<any[]>([]);
	const [loading, setLoading] = React.useState<boolean>(false);

	React.useEffect(() => { (async () => {
		setLoading(true);
		try {
			setDetail(await getDataTyped(`/api/customers/${customerId}/detail`));
			const now = new Date();
			setCalendar(await getDataTyped(`/api/customers/${customerId}/monthly-calendar/${now.getUTCFullYear()}/${now.getUTCMonth()+1}`));
			setBilling(await getDataTyped(`/api/customers/${customerId}/monthly-billing/${now.getUTCFullYear()}/${now.getUTCMonth()+1}`));
			setPosition(await getDataTyped(`/api/customers/${customerId}/course-position`));
			setCourses(await getDataTyped('/api/delivery-courses'));
		} catch {
			toast.notify('error','顧客詳細の取得に失敗しました');
		} finally {
			setLoading(false);
		}
	})().catch(()=>{}); }, [customerId]);

	const savePosition = async (courseId: number, pos: number) => {
		await putDataTyped(`/api/customers/${customerId}/course-position`, { courseId, position: pos });
		toast.notify('success','順番を更新しました');
		setPosition(await getDataTyped(`/api/customers/${customerId}/course-position`));
	};

	const courseName = (id: number) => courses.find((c:any)=>c.id===id)?.name ?? `course#${id}`;
	const formatCurrency = (n: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n);

	return (
		<div className="card">
			<div className="toolbar"><h2 style={{ margin: 0 }}>Customer Detail #{customerId}</h2>{loading && <span className="spinner" />}</div>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
				<div>
					<h3>基本情報</h3>
					{detail ? (
						<table>
							<tbody>
								<tr><th>名前</th><td>{detail.customer.name}</td></tr>
								<tr><th>住所</th><td>{detail.customer.address}</td></tr>
								<tr><th>電話</th><td>{detail.customer.phone ?? '-'}</td></tr>
								<tr><th>メール</th><td>{detail.customer.email ?? '-'}</td></tr>
								<tr><th>配達コース</th><td>{detail.customer.deliveryCourse?.name ?? '-'}</td></tr>
								<tr><th>コース内順番</th><td>{detail.position ?? '-'}</td></tr>
							</tbody>
						</table>
					) : (<div>読み込み中...</div>)}
				</div>
				<div>
					<h3>月次請求</h3>
					{billing ? (
						<div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(billing.total ?? 0)}</div>
					) : (<div>読み込み中...</div>)}
					<h3 style={{ marginTop: 16 }}>月次カレンダー</h3>
					{calendar ? (
						<div>
							<div style={{ color: 'var(--muted)', marginBottom: 8 }}>{calendar.year}年 {calendar.month}月</div>
							<table>
								<thead><tr><th>商品</th><th>パターン</th></tr></thead>
								<tbody>
									{(calendar.contracts ?? []).map((c:any)=> (
										<tr key={c.id}>
											<td>{c.product?.name ?? `#${c.productId}`}</td>
											<td>{(c.patterns ?? []).map((p:any)=> `曜日:${p.dayOfWeek} 数量:${p.quantity}`).join(' / ') || '-'}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (<div>読み込み中...</div>)}
				</div>
				<div style={{ gridColumn: '1 / -1' }}>
					<h3>コース順</h3>
					<table>
						<thead><tr><th>コース</th><th>順番</th></tr></thead>
						<tbody>
							{position.map((p:any)=> (
								<tr key={`${p.customerId}-${p.deliveryCourseId}`}>
									<td>{courseName(p.deliveryCourseId)}</td>
									<td>
										<input style={{ width: 120 }} type="number" defaultValue={p.position} onBlur={(e)=>savePosition(p.deliveryCourseId, Number(e.target.value))} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}


