import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, MessageSquare, Coffee } from 'lucide-react';
import DashboardTab from './DashboardTab';
import UsersTab from './UsersTab';
import PostsTab from './PostsTab';
import CommentsTab from './CommentsTab';
import CafesTab from './CafesTab';

type TabId = 'dashboard' | 'users' | 'posts' | 'comments' | 'cafes';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={16} /> },
    { id: 'users', label: '회원', icon: <Users size={16} /> },
    { id: 'posts', label: '게시글', icon: <FileText size={16} /> },
    { id: 'comments', label: '댓글', icon: <MessageSquare size={16} /> },
    { id: 'cafes', label: '카페', icon: <Coffee size={16} /> },
  ];

  return (
    <div className="fade-in" style={{ backgroundColor: '#FAF9F6', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div className="header" style={{ backgroundColor: 'white', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--secondary-color), #E8A85F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <LayoutDashboard size={16} color="white" />
          </div>
          <span style={{ fontWeight: '800', fontSize: '18px', color: '#333' }}>관리자 대시보드</span>
        </div>
        <button 
          onClick={() => navigate('/admin/login')} 
          style={{ 
            background: 'none', border: 'none', color: '#FF5252', 
            fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            padding: '8px 12px', borderRadius: '8px',
            backgroundColor: 'rgba(255, 82, 82, 0.1)'
          }}
        >
          로그아웃
        </button>
      </div>

      {/* Tabs - scrollable */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #F0F0F0', overflowX: 'auto' }}>
        <div style={{ display: 'flex', padding: '0 12px', minWidth: 'fit-content' }}>
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                padding: '14px 16px', 
                fontWeight: activeTab === tab.id ? '800' : '600', 
                fontSize: '13px',
                color: activeTab === tab.id ? 'var(--secondary-color)' : '#9E9E9E',
                borderBottom: activeTab === tab.id ? '2.5px solid var(--secondary-color)' : '2.5px solid transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon} {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '20px' }}>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'posts' && <PostsTab />}
        {activeTab === 'comments' && <CommentsTab />}
        {activeTab === 'cafes' && <CafesTab />}
      </div>
    </div>
  );
};

export default AdminPage;
