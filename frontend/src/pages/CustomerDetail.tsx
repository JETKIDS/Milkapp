import React from 'react';
import { useParams } from 'react-router-dom';
import { apiGet, apiJson } from '../lib/api';
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

    React.useEffect(() => { (async () => {
        setDetail(await getDataTyped(`/api/customers/${customerId}/detail`));
		const now = new Date();
        setCalendar(await getDataTyped(`/api/customers/${customerId}/monthly-calendar/${now.getUTCFullYear()}/${now.getUTCMonth()+1}`));
        setBilling(await getDataTyped(`/api/customers/${customerId}/monthly-billing/${now.getUTCFullYear()}/${now.getUTCMonth()+1}`));
        setPosition(await getDataTyped(`/api/customers/${customerId}/course-position`));
	})().catch(()=>toast.notify('error','顧客詳細の取得に失敗しました')); }, [customerId]);

    const savePosition = async (courseId: number, pos: number) => {
        await putDataTyped(`/api/customers/${customerId}/course-position`, { courseId, position: pos });
		toast.notify('success','順番を更新しました');
        setPosition(await getDataTyped(`/api/customers/${customerId}/course-position`));
	};

	return (
		<div className="card">
			<div className="toolbar"><h2 style={{ margin: 0 }}>Customer Detail #{customerId}</h2></div>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
				<div>
					<h3>基本情報</h3>
					<pre>{JSON.stringify(detail, null, 2)}</pre>
				</div>
				<div>
					<h3>月次カレンダー</h3>
					<pre>{JSON.stringify(calendar, null, 2)}</pre>
				</div>
				<div>
					<h3>月次請求</h3>
					<pre>{JSON.stringify(billing, null, 2)}</pre>
				</div>
				<div>
					<h3>コース順</h3>
					{position.map((p:any)=>(
						<div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
							<div>course#{p.deliveryCourseId}</div>
							<input style={{ width: 80 }} type="number" defaultValue={p.position} onBlur={(e)=>savePosition(p.deliveryCourseId, Number(e.target.value))} />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}


