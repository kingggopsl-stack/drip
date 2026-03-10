import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Users, Plus, Bot, User } from 'lucide-react';

const Layout: React.FC = () => {
  return (
    <div className="app-container">
      <main className="main-content">
        <Outlet />
      </main>
      
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={24} />
          <span>홈</span>
        </NavLink>
        <NavLink to="/discussion" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={24} />
          <span>커뮤니티</span>
        </NavLink>
        <NavLink to="/write" className="nav-center-btn">
          <Plus size={32} />
        </NavLink>
        <NavLink to="/recommend" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Bot size={24} />
          <span>AI 추천</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={24} />
          <span>마이페이지</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
