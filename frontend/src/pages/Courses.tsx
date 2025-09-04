import React from 'react';
import { apiGet, apiJson } from '../lib/api';
import { getDataTyped, deleteVoid, putDataTyped } from '../lib/typedApi';
import { apiGetWithHeaders } from '../lib/api';
import { paginate, sortBy, SortDir } from '../lib/paging';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { Loading } from '../components/Loading';
// 編集機能も新規登録ページに移動
import { useSearchParams, Link } from 'react-router-dom';
import { useDebounce } from '../lib/hooks';

// 登録機能は新規登録ページに移動

export function CoursesPage() {
    const toast = useToast();
    const [items, setItems] = React.useState<any[]>([]);
    const [sp, setSp] = useSearchParams();
    // 検索機能は削除済み
    // 登録機能は新規登録ページに移動したため、検索モードのみ
    const [sortKey, setSortKey] = React.useState<'id'|'name'>((sp.get('sortKey') as any) ?? 'id');
    const [sortDir, setSortDir] = React.useState<SortDir>((sp.get('sortDir') as SortDir) ?? 'asc');
    const [page, setPage] = React.useState(Number(sp.get('page') ?? '1'));
	const [pageSize] = React.useState(10);
    // 登録・編集機能は削除

    const [loading, setLoading] = React.useState(false);
    const [totalCount, setTotalCount] = React.useState<number | undefined>(undefined);
    
    // モード管理
    const [mode, setMode] = React.useState<'list' | 'reorder' | 'transfer'>('list');
    const [selectedCourses, setSelectedCourses] = React.useState<{source?: any, target?: any}>({});
    const [showTransferInterface, setShowTransferInterface] = React.useState(false);
    
    // 顧客移動用データ
    const [sourceCustomers, setSourceCustomers] = React.useState<any[]>([]);
    const [targetCustomers, setTargetCustomers] = React.useState<any[]>([]);
    const [transferLoading, setTransferLoading] = React.useState(false);
    const [draggedCustomer, setDraggedCustomer] = React.useState<any | null>(null);
    // デバウンス機能は削除済み
    const load = async () => { setLoading(true); try { const qs = new URLSearchParams({ sortKey, sortDir, page: String(page), pageSize: String(pageSize) }).toString(); const { data, total } = await apiGetWithHeaders<any[]>(`/api/delivery-courses?${qs}`); setItems(data); setTotalCount(total); } catch { toast.notify('error','コース取得に失敗'); } finally { setLoading(false); } };
	React.useEffect(() => { void load(); }, [sortKey, sortDir, page]);
    React.useEffect(() => {
        const next = new URLSearchParams(sp);
        next.set('sortKey', sortKey);
        next.set('sortDir', sortDir);
        next.set('page', String(page));
        setSp(next, { replace: true });
    }, [sortKey, sortDir, page]);

    const onDelete = async (id: number) => { try { await deleteVoid(`/api/delivery-courses/${id}`); toast.notify('success','削除しました'); await load(); } catch { toast.notify('error','削除に失敗'); } };

    // モード変更ハンドラー
    const handleModeChange = (newMode: 'list' | 'reorder' | 'transfer') => {
        setMode(newMode);
        setSelectedCourses({});
        setShowTransferInterface(false);
    };

    // 順位変更モード：コース選択
    const handleReorderCourse = (course: any) => {
        // 詳細画面に遷移（既存の機能）
        window.location.href = `/courses/${course.id}`;
    };

    // 顧客移動モード：コース選択
    const handleTransferCourseSelect = async (course: any, type: 'source' | 'target') => {
        const newSelection = { ...selectedCourses };
        newSelection[type] = course;
        setSelectedCourses(newSelection);
        
        // 両方選択されたら顧客データを取得して移動インターフェースを表示
        if (newSelection.source && newSelection.target) {
            await loadTransferCustomers(newSelection.source, newSelection.target);
            setShowTransferInterface(true);
        }
    };

    // 顧客移動用の顧客データを取得
    const loadTransferCustomers = async (sourceCourse: any, targetCourse: any) => {
        try {
            setTransferLoading(true);
            const [sourceData, targetData] = await Promise.all([
                getDataTyped<any[]>(`/api/delivery-courses/${sourceCourse.id}/customers`),
                getDataTyped<any[]>(`/api/delivery-courses/${targetCourse.id}/customers`)
            ]);
            setSourceCustomers(Array.isArray(sourceData) ? sourceData : []);
            setTargetCustomers(Array.isArray(targetData) ? targetData : []);
        } catch (error) {
            toast.notify('error', '顧客データの取得に失敗しました');
        } finally {
            setTransferLoading(false);
        }
    };

    // ドラッグ&ドロップ処理
    const handleDragStart = (e: React.DragEvent, customer: any) => {
        setDraggedCustomer(customer);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetType: 'source' | 'target') => {
        e.preventDefault();
        if (!draggedCustomer) return;

        const targetCourseId = targetType === 'source' ? selectedCourses.source?.id : selectedCourses.target?.id;
        if (!targetCourseId) return;

        try {
            // 顧客を移動
            await putDataTyped(`/api/delivery-courses/transfer-customer`, {
                customerId: draggedCustomer.id,
                targetCourseId: targetCourseId
            });

            // データを再取得
            await loadTransferCustomers(selectedCourses.source!, selectedCourses.target!);
            toast.notify('success', '顧客を移動しました');
        } catch (error) {
            toast.notify('error', '顧客の移動に失敗しました');
        } finally {
            setDraggedCustomer(null);
        }
    };

	return (
		<div className="card">
			<div className="toolbar">
				<h2 style={{ margin: 0 }}>🗺️ 配達コース</h2>
                {loading && <Loading />}
            </div>
            
            {/* モード選択ボタン */}
            <div style={{ 
                padding: '16px 20px', 
                borderBottom: '1px solid #ddd',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', marginRight: '8px' }}>操作モード:</span>
                    <button
                        onClick={() => handleModeChange('list')}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid var(--primary)',
                            borderRadius: '6px',
                            backgroundColor: mode === 'list' ? 'var(--primary)' : 'white',
                            color: mode === 'list' ? 'white' : 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        📋 一覧表示
                    </button>
                    <button
                        onClick={() => handleModeChange('reorder')}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid var(--primary)',
                            borderRadius: '6px',
                            backgroundColor: mode === 'reorder' ? 'var(--primary)' : 'white',
                            color: mode === 'reorder' ? 'white' : 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        📋 順位変更
                    </button>
                    <button
                        onClick={() => handleModeChange('transfer')}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid var(--primary)',
                            borderRadius: '6px',
                            backgroundColor: mode === 'transfer' ? 'var(--primary)' : 'white',
                            color: mode === 'transfer' ? 'white' : 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        🚚 顧客移動
                    </button>
                </div>
                
                {/* モード説明 */}
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    {mode === 'list' && '通常の一覧表示モードです。コースの詳細確認や削除ができます。'}
                    {mode === 'reorder' && 'コースを選択すると、そのコース内での顧客の順位変更ができます。'}
                    {mode === 'transfer' && '移動元コースと移動先コースを選択してください。顧客をコース間で移動できます。'}
                </div>
                
                {/* 顧客移動モード：選択状態表示 */}
                {mode === 'transfer' && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ 
                            padding: '8px 12px', 
                            backgroundColor: selectedCourses.source ? '#e3f2fd' : '#f5f5f5',
                            borderRadius: '4px',
                            border: selectedCourses.source ? '2px solid #2196f3' : '1px solid #ddd'
                        }}>
                            <strong>移動元:</strong> {selectedCourses.source ? selectedCourses.source.name : '未選択'}
                        </div>
                        <div style={{ fontSize: '18px' }}>→</div>
                        <div style={{ 
                            padding: '8px 12px', 
                            backgroundColor: selectedCourses.target ? '#e8f5e8' : '#f5f5f5',
                            borderRadius: '4px',
                            border: selectedCourses.target ? '2px solid #4caf50' : '1px solid #ddd'
                        }}>
                            <strong>移動先:</strong> {selectedCourses.target ? selectedCourses.target.name : '未選択'}
                        </div>
                        {selectedCourses.source && selectedCourses.target && (
                            <button
                                onClick={() => handleModeChange('transfer')}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#ff9800',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                リセット
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            {/* 顧客移動インターフェース */}
            {showTransferInterface && selectedCourses.source && selectedCourses.target && (
                <div style={{ padding: '20px', backgroundColor: '#fafafa', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>🚚 顧客移動</h3>
                        <button
                            onClick={() => {
                                setShowTransferInterface(false);
                                handleModeChange('transfer');
                            }}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            閉じる
                        </button>
                    </div>
                    
                    {transferLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Loading />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '20px', minHeight: '400px' }}>
                            {/* 移動元コース */}
                            <div 
                                style={{ 
                                    flex: 1, 
                                    border: '2px solid #2196f3', 
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    padding: '16px'
                                }}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'source')}
                            >
                                <h4 style={{ 
                                    margin: '0 0 12px 0', 
                                    color: '#2196f3',
                                    textAlign: 'center',
                                    padding: '8px',
                                    backgroundColor: '#e3f2fd',
                                    borderRadius: '4px'
                                }}>
                                    📤 {selectedCourses.source.name} ({sourceCustomers.length}名)
                                </h4>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {sourceCustomers.map((customer: any) => (
                                        <div
                                            key={customer.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, customer)}
                                            style={{
                                                padding: '8px 12px',
                                                margin: '4px 0',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                backgroundColor: draggedCustomer?.id === customer.id ? '#f0f8ff' : 'white',
                                                cursor: 'move',
                                                transition: 'all 0.2s ease',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold' }}>{customer.name}</div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                順位: {customer.position || '未設定'}
                                            </div>
                                        </div>
                                    ))}
                                    {sourceCustomers.length === 0 && (
                                        <div style={{ 
                                            textAlign: 'center', 
                                            color: '#999', 
                                            padding: '20px',
                                            fontStyle: 'italic'
                                        }}>
                                            顧客がいません
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* 矢印 */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                fontSize: '24px',
                                color: '#666'
                            }}>
                                ⇄
                            </div>
                            
                            {/* 移動先コース */}
                            <div 
                                style={{ 
                                    flex: 1, 
                                    border: '2px solid #4caf50', 
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    padding: '16px'
                                }}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'target')}
                            >
                                <h4 style={{ 
                                    margin: '0 0 12px 0', 
                                    color: '#4caf50',
                                    textAlign: 'center',
                                    padding: '8px',
                                    backgroundColor: '#e8f5e8',
                                    borderRadius: '4px'
                                }}>
                                    📥 {selectedCourses.target.name} ({targetCustomers.length}名)
                                </h4>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {targetCustomers.map((customer: any) => (
                                        <div
                                            key={customer.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, customer)}
                                            style={{
                                                padding: '8px 12px',
                                                margin: '4px 0',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                backgroundColor: draggedCustomer?.id === customer.id ? '#f0f8ff' : 'white',
                                                cursor: 'move',
                                                transition: 'all 0.2s ease',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold' }}>{customer.name}</div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                順位: {customer.position || '未設定'}
                                            </div>
                                        </div>
                                    ))}
                                    {targetCustomers.length === 0 && (
                                        <div style={{ 
                                            textAlign: 'center', 
                                            color: '#999', 
                                            padding: '20px',
                                            fontStyle: 'italic'
                                        }}>
                                            顧客がいません
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div style={{ 
                        marginTop: '16px', 
                        padding: '12px', 
                        backgroundColor: '#fff3cd', 
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#856404'
                    }}>
                        💡 <strong>操作方法:</strong> 顧客をドラッグして左右のコース間で移動させてください。移動後の順位は自動で調整されます。
                    </div>
                </div>
            )}
            
            {!showTransferInterface && (() => {
                const rows = items;
                const total = totalCount ?? rows.length;
                const totalPages = Math.max(1, Math.ceil(total / pageSize));
                const currentPage = page;
				const onSort = (key: 'id'|'name') => { if (sortKey === key) setSortDir(sortDir==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('asc'); } };
				return (
					<>
                        {/* 検索機能は削除済み */}
                        <table>
                            <thead><tr><th className="sortable" onClick={()=>onSort('id')}>ID <span className="indicator">{sortKey==='id' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th><th className="sortable" onClick={()=>onSort('name')}>コース名 <span className="indicator">{sortKey==='name' ? (sortDir==='asc'?'▲':'▼') : ''}</span></th><th>操作</th></tr></thead>
							<tbody>
                                {rows.map((c:any)=>(
                                    <tr key={c.id}>
                                        <td>{c.id}</td>
                                        <td>{c.name}</td>
                                        <td style={{ display: 'flex', gap: 8 }}>
                                            {mode === 'list' && (
                                                <>
                                                    <Link to={`/courses/${c.id}`}>
                                                        <button className="ghost" style={{ color: 'var(--primary)' }}>
                                                            詳細・管理
                                                        </button>
                                                    </Link>
                                                    <button className="ghost" onClick={()=>onDelete(c.id)} style={{ color: 'red' }}>
                                                        削除
                                                    </button>
                                                </>
                                            )}
                                            {mode === 'reorder' && (
                                                <button 
                                                    className="ghost" 
                                                    onClick={() => handleReorderCourse(c)}
                                                    style={{ color: 'var(--primary)' }}
                                                >
                                                    📋 順位変更
                                                </button>
                                            )}
                                            {mode === 'transfer' && (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button 
                                                        className="ghost" 
                                                        onClick={() => handleTransferCourseSelect(c, 'source')}
                                                        style={{ 
                                                            color: selectedCourses.source?.id === c.id ? 'white' : '#2196f3',
                                                            backgroundColor: selectedCourses.source?.id === c.id ? '#2196f3' : 'transparent',
                                                            fontSize: '12px',
                                                            padding: '4px 8px'
                                                        }}
                                                    >
                                                        移動元
                                                    </button>
                                                    <button 
                                                        className="ghost" 
                                                        onClick={() => handleTransferCourseSelect(c, 'target')}
                                                        style={{ 
                                                            color: selectedCourses.target?.id === c.id ? 'white' : '#4caf50',
                                                            backgroundColor: selectedCourses.target?.id === c.id ? '#4caf50' : 'transparent',
                                                            fontSize: '12px',
                                                            padding: '4px 8px'
                                                        }}
                                                    >
                                                        移動先
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
								))}
							</tbody>
						</table>
						<div className="toolbar" style={{ marginTop: 12 }}>
							<div>全{total}件</div>
							<Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
        {/* 編集機能は新規登録ページに移動 */}
					</>
				);
            })()}
		</div>
	);
}


