import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import CafeDetail from './pages/CafeDetail';
import FeedDetail from './pages/FeedDetail';
import Recommendation from './pages/Recommendation';
import RecommendationResult from './pages/RecommendationResult';
import WriteDiary from './pages/WriteDiary';
import DiscussionDetail from './pages/DiscussionDetail';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import ProfileEdit from './pages/ProfileEdit';
import Login from './pages/Login';
import NetworkError from './pages/NetworkError';
import ProtectedRoute from './components/ProtectedRoute';
import Notifications from './pages/Notifications';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CafeSelect from './pages/CafeSelect';
import OriginSelect from './pages/OriginSelect';

// Mock Pages for remaining
const Diary = () => <div className="fade-in" style={{ padding: '20px' }}><h1>일기</h1><p>나의 드립일기 모음입니다.</p></div>;

import AdminRoute from './components/AdminRoute';
import AdminPage from './pages/admin/AdminPage';
import AdminLogin from './pages/admin/AdminLogin';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="discussion" element={<CommunityPage />} />
            <Route path="cafe/:id" element={<CafeDetail />} />
            <Route path="feed/:id" element={<FeedDetail />} />
            <Route path="discussion/:id" element={<DiscussionDetail />} />
            <Route path="recommend" element={<Recommendation />} />
            <Route path="recommend/result" element={<RecommendationResult />} />
            <Route path="write" element={<WriteDiary />} />
            <Route path="diary" element={<Diary />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/edit" element={<ProfileEdit />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="select-cafe" element={<CafeSelect />} />
            <Route path="select-origin" element={<OriginSelect />} />
          </Route>
        </Route>
        
        {/* 일반 서비스 공개 라우트 */}
        <Route path="/login" element={<Login />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/error" element={<NetworkError />} />

        {/* 관리자 루트 */}
        <Route path="/admin">
          <Route index element={<AdminLogin />} />
          <Route path="login" element={<AdminLogin />} />
          <Route 
            path="dashboard" 
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
