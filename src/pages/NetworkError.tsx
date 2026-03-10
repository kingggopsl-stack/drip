import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NetworkError: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '40px 32px',
      textAlign: 'center',
      backgroundColor: '#FAF9F6'
    }}>
      {/* Illustration */}
      <div style={{ marginBottom: '36px', position: 'relative' }}>
        <div style={{
          width: '160px', height: '160px',
          borderRadius: '50%',
          backgroundColor: '#F3E5D8',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: '72px' }}>☕</div>
        </div>
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '20px',
          backgroundColor: '#FF4d4f',
          color: 'white',
          borderRadius: '50%',
          width: '40px', height: '40px',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontSize: '20px',
          fontWeight: '900',
          boxShadow: '0 4px 10px rgba(255,77,79,0.3)'
        }}>
          !
        </div>
      </div>

      <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '14px', color: '#1A0F08' }}>
        네트워크 인잡을 인해주세요
      </h1>
      <p style={{ color: '#9E9E9E', fontSize: '15px', lineHeight: '1.7', marginBottom: '48px', maxWidth: '280px' }}>
        인터넷 연결을 확인하고<br />다시 시도해 주세요.<br />잠시 후 다시 연결됩니다.
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: 'var(--secondary-color)',
          color: 'white',
          border: 'none',
          padding: '16px 48px',
          borderRadius: '30px',
          fontWeight: '800',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 20px rgba(210, 124, 44, 0.25)',
          cursor: 'pointer',
          transition: 'opacity 0.2s'
        }}
      >
        <RefreshCw size={20} /> 다시 연결하기
      </button>

      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '16px',
          backgroundColor: 'transparent',
          border: 'none',
          color: '#9E9E9E',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        홈으로 이동
      </button>
    </div>
  );
};

export default NetworkError;
