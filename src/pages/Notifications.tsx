import React from 'react';
import { ChevronLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fade-in" style={{ backgroundColor: '#FAF9F6', minHeight: '100vh' }}>
      <div className="header" style={{ backgroundColor: 'white', borderBottom: '1px solid #F0F0F0' }}>
        <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <h1 style={{ fontSize: '18px', fontWeight: '800' }}>알림</h1>
        <div style={{ width: '24px' }} />
      </div>
      
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          backgroundColor: '#F3E5D8', 
          borderRadius: '50%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          margin: '0 auto 20px',
          color: 'var(--secondary-color)'
        }}>
          <Bell size={32} />
        </div>
        <p style={{ fontSize: '16px', fontWeight: '700', color: '#111', marginBottom: '8px' }}>새로운 알림이 없습니다.</p>
        <p style={{ fontSize: '14px', color: '#BDBDBD' }}>드립닷컴의 소식을 가장 먼저 전해드릴게요.</p>
      </div>
    </div>
  );
};

export default Notifications;
