import { useState, useEffect } from 'react';
import AddModal from './addModal';

function Nav({ fetchCustomers, onFilter, onAddClick }) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilter(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onFilter]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '10px',
      gap: '10px',
      backgroundColor: '#f8f9fa',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="navbar-search" style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
        <input 
          type="text" 
          placeholder="Search by name or phone..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px 8px 35px',
            borderRadius: '20px',
            border: '1px solid #ddd',
            outline: 'none',
            fontSize: '14px'
          }}
        />
        <span style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0.5
        }}>🔍</span>
      </div>
      <div 
        className="add-button" 
        onClick={onAddClick}
       
      >
        +
      </div>
    </div>
  );
}

export default Nav;