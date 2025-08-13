import React from 'react';
import { apiGet } from '../lib/api';
import { useToast } from '../components/Toast';

export function DashboardPage() {
	const toast = useToast();
	const [today, setToday] = React.useState<any>(null);
	const [pending, setPending] = React.useState<any[]>([]);
	const [status, setStatus] = React.useState<any>(null);
	const [monthly, setMonthly] = React.useState<any>(null);

	React.useEffect(() => { (async () => {
		setToday(await apiGet('/api/dashboard/today'));
		setPending(await apiGet('/api/dashboard/pending-deliveries'));
		setStatus(await apiGet('/api/dashboard/delivery-status'));
		setMonthly(await apiGet('/api/dashboard/monthly-summary'));
	})().catch(()=>toast.notify('error','ダッシュボードの取得に失敗しました')); }, []);

	return (
		<div className="card">
			<div className="toolbar"><h2 style={{ margin: 0 }}>Dashboard</h2></div>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
				<div>
					<h3>今日</h3>
					<pre>{JSON.stringify(today, null, 2)}</pre>
				</div>
				<div>
					<h3>未完了</h3>
					<pre>{JSON.stringify(pending, null, 2)}</pre>
				</div>
				<div>
					<h3>配達状況</h3>
					<pre>{JSON.stringify(status, null, 2)}</pre>
				</div>
				<div>
					<h3>月次サマリ</h3>
					<pre>{JSON.stringify(monthly, null, 2)}</pre>
				</div>
			</div>
		</div>
	);
}


