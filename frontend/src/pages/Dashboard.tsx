import React from 'react';
import { apiGet } from '../lib/api';
import { useToast } from '../components/Toast';

const days = ['日','月','火','水','木','金','土'];
const yen = (n: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n ?? 0);

export function DashboardPage() {
	const toast = useToast();
	const [today, setToday] = React.useState<any>(null);
	const [pending, setPending] = React.useState<any[]>([]);
	const [status, setStatus] = React.useState<any[]>([]);
	const [monthly, setMonthly] = React.useState<any>(null);
	const [courses, setCourses] = React.useState<any[]>([]);
	const [loading, setLoading] = React.useState(false);

	React.useEffect(() => { (async () => {
		setLoading(true);
		try {
			const [t, p, s, m, cs] = await Promise.all([
				apiGet('/api/dashboard/today'),
				apiGet('/api/dashboard/pending-deliveries'),
				apiGet('/api/dashboard/delivery-status'),
				apiGet('/api/dashboard/monthly-summary'),
				apiGet('/api/delivery-courses'),
			]);
			setToday(t);
			setPending(Array.isArray(p) ? p : []);
			setStatus(Array.isArray(s) ? s : []);
			setMonthly(m);
			setCourses(Array.isArray(cs) ? cs : []);
		} catch {
			toast.notify('error','ダッシュボードの取得に失敗しました');
		} finally {
			setLoading(false);
		}
	})().catch(()=>{}); }, []);

	const courseName = (id?: number) => courses.find((c:any)=>c.id===id)?.name ?? (id ? `#${id}` : '未設定');

	return (
		<div className="card">
			<div className="toolbar"><h2 style={{ margin: 0 }}>Dashboard</h2>{loading && <span className="spinner" />}</div>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
				<div>
					<h3>今日</h3>
					<table>
						<tbody>
							<tr><th>曜日</th><td>{today ? days[today.dayOfWeek] : '-'}</td></tr>
							<tr><th>予定配達件数</th><td>{today ? today.deliveryCount : '-'}</td></tr>
						</tbody>
					</table>
				</div>
				<div>
					<h3>未完了</h3>
					<table>
						<thead><tr><th>顧客</th><th>住所</th><th>コース</th></tr></thead>
						<tbody>
							{pending.map((x:any)=> (
								<tr key={x.customerId}><td>{x.name}</td><td>{x.address}</td><td>{courseName(x.courseId)}</td></tr>
							))}
							{pending.length === 0 && <tr><td colSpan={3}>未完了はありません</td></tr>}
						</tbody>
					</table>
				</div>
				<div>
					<h3>配達状況（コース別）</h3>
					<table>
						<thead><tr><th>コース</th><th>合計</th><th>完了</th><th>未完了</th><th>完了率</th></tr></thead>
						<tbody>
							{status.map((s:any)=> {
								const rate = s.total ? Math.round((s.completed / s.total) * 100) : 0;
								return <tr key={s.courseId}><td>{s.courseName}</td><td>{s.total}</td><td>{s.completed}</td><td>{s.pending}</td><td>{rate}%</td></tr>;
							})}
							{status.length === 0 && <tr><td colSpan={5}>データがありません</td></tr>}
						</tbody>
					</table>
				</div>
				<div>
					<h3>月次サマリ</h3>
					{monthly ? (
						<div>
							<div style={{ color: 'var(--muted)', marginBottom: 8 }}>{monthly.year}年 {monthly.month}月</div>
							<div style={{ fontSize: 28, fontWeight: 700 }}>{yen(monthly.totalSales ?? 0)}</div>
						</div>
					) : (<div>読み込み中...</div>)}
				</div>
			</div>
		</div>
	);
}


