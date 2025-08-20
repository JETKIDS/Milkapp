import React from 'react';

interface Course {
  id: number;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  selectedCourses: number[];
  onSelectionChange: (selectedCourses: number[]) => void;
  title?: string;
}

export const CourseSelectionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  courses,
  selectedCourses,
  onSelectionChange,
  title = 'コース選択'
}) => {
  const [tempSelection, setTempSelection] = React.useState<number[]>(selectedCourses);

  // モーダルが開かれた時に現在の選択状態を一時選択に設定
  React.useEffect(() => {
    if (isOpen) {
      setTempSelection(selectedCourses);
    }
  }, [isOpen, selectedCourses]);

  const handleCheckboxChange = (courseId: number) => {
    const newSelection = tempSelection.includes(courseId)
      ? tempSelection.filter(id => id !== courseId)
      : [...tempSelection, courseId];
    setTempSelection(newSelection);
  };

  const handleSelectAll = () => {
    if (tempSelection.length === courses.length) {
      setTempSelection([]);
    } else {
      setTempSelection(courses.map(c => c.id));
    }
  };

  const handleConfirm = () => {
    onSelectionChange(tempSelection);
    onClose();
  };

  const handleCancel = () => {
    setTempSelection(selectedCourses); // 元の状態に戻す
    onClose();
  };

  const isAllSelected = tempSelection.length === courses.length && courses.length > 0;
  const isPartiallySelected = tempSelection.length > 0 && tempSelection.length < courses.length;

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        minWidth: '500px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            {title}
          </h3>
          <button
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* 全選択ボタン */}
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontWeight: 'bold',
            color: '#495057'
          }}>
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isPartiallySelected;
              }}
              onChange={handleSelectAll}
              style={{ 
                marginRight: '8px', 
                transform: 'scale(1.2)',
                accentColor: '#007bff'
              }}
            />
            全コース選択
            <span style={{
              marginLeft: '8px',
              fontSize: '14px',
              color: '#6c757d',
              fontWeight: 'normal'
            }}>
              ({tempSelection.length}/{courses.length}件選択中)
            </span>
          </label>
        </div>

        {/* コース一覧 */}
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '6px',
          padding: '8px'
        }}>
          {courses.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#6c757d'
            }}>
              選択可能なコースがありません
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '8px'
            }}>
              {courses.map((course) => (
                <label
                  key={course.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s',
                    backgroundColor: tempSelection.includes(course.id) ? '#e3f2fd' : 'transparent',
                    border: tempSelection.includes(course.id) ? '1px solid #2196f3' : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!tempSelection.includes(course.id)) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!tempSelection.includes(course.id)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={tempSelection.includes(course.id)}
                    onChange={() => handleCheckboxChange(course.id)}
                    style={{ 
                      marginRight: '8px',
                      accentColor: '#007bff'
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: tempSelection.includes(course.id) ? '#1976d2' : '#333',
                    fontWeight: tempSelection.includes(course.id) ? '500' : 'normal'
                  }}>
                    {course.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #e0e0e0'
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#007bff',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            選択完了 ({tempSelection.length}件)
          </button>
        </div>
      </div>
    </div>
  );
};
