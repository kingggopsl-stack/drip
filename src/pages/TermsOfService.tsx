import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fade-in" style={{ backgroundColor: '#FAF9F6', minHeight: '100vh' }}>
      <div className="header" style={{ backgroundColor: 'white', borderBottom: '1px solid #F0F0F0' }}>
        <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <h1 style={{ fontSize: '18px', fontWeight: '800' }}>이용약관</h1>
        <div style={{ width: '24px' }} />
      </div>
      
      <div style={{ padding: '24px', lineHeight: '1.6', color: '#444' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>제 1 조 (목적)</h2>
        <p style={{ marginBottom: '24px' }}>본 약관은 드립닷컴(이하 "회사")이 제공하는 드립닷컴 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 사이의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
        
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>제 2 조 (용어의 정의)</h2>
        <p style={{ marginBottom: '24px' }}>본 약관에서 사용하는 용어의 정의는 서비스 운영 정책에 따릅니다.</p>
        
        <p style={{ color: '#BDBDBD', fontSize: '13px' }}>* 자세한 내용은 추후 업데이트 예정입니다.</p>
      </div>
    </div>
  );
};

export default TermsOfService;
