import React from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface Props {
  label: string;
  name: string;
  options: Option[];
  value: number[];
  onChange: (value: number[]) => void;
  error?: string;
  showSelectAll?: boolean;
}

export const FormMultiCheckbox: React.FC<Props> = ({
  label,
  name,
  options,
  value,
  onChange,
  error,
  showSelectAll = false
}) => {
  const handleCheckboxChange = (optionValue: string | number) => {
    const numValue = Number(optionValue);
    const newValue = value.includes(numValue)
      ? value.filter(v => v !== numValue)
      : [...value, numValue];
    onChange(newValue);
  };

  const handleSelectAll = () => {
    if (value.length === options.length) {
      // すべて選択されている場合は全て解除
      onChange([]);
    } else {
      // 一部または何も選択されていない場合は全て選択
      onChange(options.map(opt => Number(opt.value)));
    }
  };

  const isAllSelected = value.length === options.length && options.length > 0;
  const isPartiallySelected = value.length > 0 && value.length < options.length;

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
        {label}
      </label>
      
      {showSelectAll && options.length > 0 && (
        <div style={{ 
          marginBottom: 12, 
          padding: '8px 12px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          border: '1px solid #dee2e6'
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
              style={{ marginRight: 8, transform: 'scale(1.1)' }}
            />
            全コース
            {isPartiallySelected && (
              <span style={{ 
                marginLeft: 8, 
                fontSize: '12px', 
                color: '#6c757d',
                fontWeight: 'normal'
              }}>
                ({value.length}/{options.length}件選択中)
              </span>
            )}
          </label>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 8,
        maxHeight: '200px',
        overflowY: 'auto',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#fff'
      }}>
        {options.map((option) => (
          <label
            key={String(option.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '3px',
              transition: 'background-color 0.2s',
              backgroundColor: value.includes(Number(option.value)) ? '#e3f2fd' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!value.includes(Number(option.value))) {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }
            }}
            onMouseLeave={(e) => {
              if (!value.includes(Number(option.value))) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <input
              type="checkbox"
              name={name}
              value={String(option.value)}
              checked={value.includes(Number(option.value))}
              onChange={() => handleCheckboxChange(option.value)}
              style={{ marginRight: 8 }}
            />
            <span style={{ 
              fontSize: '14px',
              color: value.includes(Number(option.value)) ? '#1976d2' : '#333'
            }}>
              {option.label}
            </span>
          </label>
        ))}
      </div>

      {options.length === 0 && (
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          color: '#6c757d',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#f8f9fa'
        }}>
          選択可能なコースがありません
        </div>
      )}

      {error && (
        <div style={{ 
          color: 'crimson', 
          marginTop: 4, 
          fontSize: '14px' 
        }}>
          {error}
        </div>
      )}
    </div>
  );
};
