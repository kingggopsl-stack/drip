import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fade-in" style={{ backgroundColor: '#FAF9F6', minHeight: '100vh' }}>
      <div className="header" style={{ backgroundColor: 'white', borderBottom: '1px solid #F0F0F0' }}>
        <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <h1 style={{ fontSize: '18px', fontWeight: '800' }}>개인정보 처리방침</h1>
        <div style={{ width: '24px' }} />
      </div>
      
      <div style={{ padding: '24px', lineHeight: '1.6', color: '#444' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>개인정보의 처리 목적</h2>
        <p style={{ marginBottom: '24px' }}>회사는 회원의 개인정보를 서비스 제공, 회원 관리, 마케팅 및 광고에의 활용 등의 목적으로 처리합니다.</p>
        
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>수집하는 개인정보의 항목</h2>
        <p style={{ marginBottom: '24px' }}>이메일, 닉네임, 프로필 사진 등 서비스 이용 과정에서 생성되는 정보를 수집합니다.</p>
        
        <p style={{ color: '#BDBDBD', fontSize: '13px' }}>* 자세한 내용은 관계 법령 및 회사 운영 정책에 따릅니다.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
