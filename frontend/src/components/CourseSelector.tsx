import React from 'react';
import { CourseSelectionModal } from './CourseSelectionModal';

interface Course {
  id: number;
  name: string;
}

interface Props {
  label: string;
  courses: Course[];
  selectedCourses: number[];
  onSelectionChange: (selectedCourses: number[]) => void;
  error?: string;
  placeholder?: string;
}

export const CourseSelector: React.FC<Props> = ({
  label,
  courses,
  selectedCourses,
  onSelectionChange,
  error,
  placeholder = 'コースを選択してください'
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const getSelectionText = () => {
    if (selectedCourses.length === 0) {
      return placeholder;
    } else if (selectedCourses.length === courses.length && courses.length > 0) {
      return '全コース選択済み';
    } else if (selectedCourses.length <= 3) {
      // 3件以下の場合は名前を表示
      const selectedNames = courses
        .filter(c => selectedCourses.includes(c.id))
        .map(c => c.name);
      return selectedNames.join(', ');
    } else {
      // 4件以上の場合は件数表示
      return `${selectedCourses.length}件のコースを選択中`;
    }
  };

  const getSelectionColor = () => {
    return selectedCourses.length > 0 ? '#1976d2' : '#666';
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
        {label}
      </label>
      
      <div
        onClick={() => setIsModalOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          border: error ? '2px solid #dc3545' : '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: 'white',
          cursor: 'pointer',
          minHeight: '20px',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = '#007bff';
          }
        }}
        onMouseLeave={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = '#ccc';
          }
        }}
      >
        <span style={{
          color: getSelectionColor(),
          fontSize: '14px',
          fontWeight: selectedCourses.length > 0 ? '500' : 'normal'
        }}>
          {getSelectionText()}
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedCourses.length > 0 && (
            <span style={{
              backgroundColor: '#007bff',
              color: 'white',
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 'bold'
            }}>
              {selectedCourses.length}
            </span>
          )}
          <span style={{
            color: '#666',
            fontSize: '12px',
            transform: isModalOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}>
            ▼
          </span>
        </div>
      </div>

      {error && (
        <div style={{
          color: '#dc3545',
          marginTop: 4,
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <CourseSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courses={courses}
        selectedCourses={selectedCourses}
        onSelectionChange={onSelectionChange}
        title={label}
      />
    </div>
  );
};
