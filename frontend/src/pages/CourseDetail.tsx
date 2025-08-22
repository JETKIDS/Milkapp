import React from 'react';
import { useParams } from 'react-router-dom';
import { getDataTyped, putDataTyped } from '../lib/typedApi';
import { useToast } from '../components/Toast';
import { Loading } from '../components/Loading';

interface Customer {
  id: number;
  name: string;
  address: string;
  phone?: string;
  position?: number | null;
}

export function CourseDetailPage() {
  const { id } = useParams();
  const courseId = Number(id);
  const toast = useToast();
  const [course, setCourse] = React.useState<any>(null);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [allCourses, setAllCourses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [draggedCustomer, setDraggedCustomer] = React.useState<Customer | null>(null);
  const [transferMode, setTransferMode] = React.useState<{ customerId: number; customerName: string } | null>(null);
  const [mode, setMode] = React.useState<'reorder' | 'transfer'>('reorder'); // 'reorder': 順位変更モード, 'transfer': 顧客移動モード

  // データ読み込み
  const loadData = async () => {
    setLoading(true);
    try {
      // コース詳細とコース一覧を並行取得
      const [courseData, customersData, coursesData] = await Promise.all([
        getDataTyped(`/api/delivery-courses/${courseId}`),
        getDataTyped(`/api/delivery-courses/${courseId}/customers`),
        getDataTyped(`/api/delivery-courses`)
      ]);
      
      setCourse(courseData);
      setCustomers(customersData as Customer[]);
      setAllCourses(coursesData as any[]);
    } catch (error) {
      console.error('Error loading course detail:', error);
      toast.notify('error', 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [courseId]);

  // ドラッグ&ドロップ処理
  const handleDragStart = (e: React.DragEvent, customer: Customer) => {
    setDraggedCustomer(customer);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedCustomer) return;

    const newCustomers = [...customers];
    const draggedIndex = newCustomers.findIndex(c => c.id === draggedCustomer.id);
    
    if (draggedIndex === targetIndex) return;

    // 配列の要素を移動
    newCustomers.splice(draggedIndex, 1);
    newCustomers.splice(targetIndex, 0, draggedCustomer);

    setCustomers(newCustomers);
    setDraggedCustomer(null);

    // サーバーに順番変更を送信
    reorderCustomers(newCustomers.map(c => c.id));
  };

  // 順番変更API呼び出し
  const reorderCustomers = async (customerIds: number[]) => {
    try {
      await putDataTyped(`/api/delivery-courses/${courseId}/customers/reorder`, {
        customerIds
      });
      toast.notify('success', '順番を変更しました');
    } catch (error) {
      console.error('Error reordering customers:', error);
      toast.notify('error', '順番変更に失敗しました');
      // エラー時は元のデータを再読み込み
      loadData();
    }
  };

  // コース移動処理
  const transferCustomer = async (customerId: number, toCourseId: number, position?: number) => {
    try {
      await putDataTyped(`/api/delivery-courses/${courseId}/customers/${customerId}/transfer`, {
        toCourseId,
        position
      });
      toast.notify('success', 'コースを移動しました');
      setTransferMode(null);
      loadData(); // データを再読み込み
    } catch (error) {
      console.error('Error transferring customer:', error);
      toast.notify('error', 'コース移動に失敗しました');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="card">
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>🗺️ コース詳細: {course?.name || 'ロード中...'}</h2>
      </div>
      
      {/* モード切替ボタン */}
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid #ddd',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', marginRight: '8px' }}>操作モード:</span>
          <button
            onClick={() => setMode('reorder')}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--primary)',
              borderRadius: '6px',
              backgroundColor: mode === 'reorder' ? 'var(--primary)' : 'white',
              color: mode === 'reorder' ? 'white' : 'var(--primary)',
              cursor: 'pointer',
              fontWeight: mode === 'reorder' ? 'bold' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            📋 順位変更
          </button>
          <button
            onClick={() => setMode('transfer')}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--primary)',
              borderRadius: '6px',
              backgroundColor: mode === 'transfer' ? 'var(--primary)' : 'white',
              color: mode === 'transfer' ? 'white' : 'var(--primary)',
              cursor: 'pointer',
              fontWeight: mode === 'transfer' ? 'bold' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            🚚 顧客移動
          </button>
        </div>
        <div style={{ 
          marginTop: '8px', 
          fontSize: '14px', 
          color: 'var(--muted)' 
        }}>
          {mode === 'reorder' 
            ? '🖱️ ドラッグ&ドロップで顧客の配達順序を変更できます' 
            : '👆 顧客をクリックして他のコースに移動できます'
          }
        </div>
      </div>

      {/* 顧客一覧 */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '16px', borderBottom: '2px solid var(--primary)', paddingBottom: '8px' }}>
          配達順序 ({customers.length}名)
        </h3>
        
        {customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            このコースには顧客が登録されていません
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {customers.map((customer, index) => (
              <div
                key={customer.id}
                draggable={mode === 'reorder'}
                onDragStart={mode === 'reorder' ? (e) => handleDragStart(e, customer) : undefined}
                onDragOver={mode === 'reorder' ? handleDragOver : undefined}
                onDrop={mode === 'reorder' ? (e) => handleDrop(e, index) : undefined}
                onClick={mode === 'transfer' ? () => setTransferMode({ customerId: customer.id, customerName: customer.name }) : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: draggedCustomer?.id === customer.id ? '#f0f8ff' : 
                                   mode === 'transfer' ? '#f8f9fa' : 'white',
                  cursor: mode === 'reorder' ? 'move' : mode === 'transfer' ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  borderLeft: mode === 'transfer' ? '4px solid var(--primary)' : '1px solid #ddd'
                }}
              >
                {/* 順番表示 */}
                <div style={{
                  minWidth: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  marginRight: '12px'
                }}>
                  {index + 1}
                </div>

                {/* 顧客情報 */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {customer.name}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                    {customer.address}
                  </div>
                  {customer.phone && (
                    <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                      📞 {customer.phone}
                    </div>
                  )}
                </div>

                {/* 操作ボタン */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {mode === 'reorder' && (
                    <div style={{ 
                      color: 'var(--muted)', 
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      ⇅ ドラッグで移動
                    </div>
                  )}
                  {mode === 'transfer' && (
                    <div style={{ 
                      color: 'var(--primary)', 
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 'bold'
                    }}>
                      👆 クリックで移動
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* コース移動モーダル */}
      {transferMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
            <h3 style={{ marginBottom: '16px' }}>
              コース移動: {transferMode.customerName}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                移動先コース:
              </label>
              <select
                id="targetCourse"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">コースを選択してください</option>
                {allCourses.filter(c => c.id !== courseId).map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="ghost"
                onClick={() => setTransferMode(null)}
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  const select = document.getElementById('targetCourse') as HTMLSelectElement;
                  const toCourseId = Number(select.value);
                  if (toCourseId) {
                    transferCustomer(transferMode.customerId, toCourseId);
                  } else {
                    toast.notify('error', '移動先コースを選択してください');
                  }
                }}
              >
                移動実行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
