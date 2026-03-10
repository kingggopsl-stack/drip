import React, { useState, useEffect, useRef } from 'react';
import { Settings, Camera, LogOut, ChevronRight, ImageIcon, Share2, Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Post {
  id: string;
  content: string;
  image_urls: string[];
  likes_count: number;
  created_at: string;
}

interface Profile {
  full_name: string;
  avatar_url: string;
  website: string;
}

const TABS = ['내가 쓴 글', '저장됨', '좋아요'];

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('내가 쓴 글');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyPosts();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, website')
      .eq('id', user.id)
      .single();
    if (data) setProfile(data);
  };

  const fetchMyPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. 내가 쓴 글
      const { data: myData } = await supabase
        .from('posts')
        .select('id, content, image_urls, likes_count, created_at, type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const posts = myData || [];
      setMyPosts(posts);

      // 2. 저장됨 (북마크)
      const { data: bookmarkData } = await supabase
        .from('bookmarks')
        .select('post_id, posts(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let bookmarks: Post[] = [];
      if (bookmarkData) {
        bookmarks = bookmarkData.map((b: any) => b.posts).filter(Boolean);
        setBookmarkedPosts(bookmarks);
      }

      // 3. 좋아요
      const { data: likeData } = await supabase
        .from('likes')
        .select('post_id, posts(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let likes: Post[] = [];
      if (likeData) {
        likes = likeData.map((l: any) => l.posts).filter(Boolean);
        setLikedPosts(likes);
      }

      // 통계 반영: 
      // 브루잉 = 내 전체 게시글 수 (일기 + 소통)
      // 스크랩 = 내가 저장한 총 게시글 수
      // 좋아요 = 내 게시글들이 받은 총 좋아요 수
      const totalLikesReceived = posts.reduce((acc: number, p: any) => acc + (p.likes_count || 0), 0);
      
      setStats({
        posts: posts.length,
        followers: bookmarks.length, 
        following: totalLikesReceived
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${Date.now()}.${ext}`; // 캐시 방지를 위해 timestamp 추가
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(path, file, { cacheControl: '3600', upsert: true });

      if (!error && data) {
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(data.path);
        
        // 프로필 테이블 업데이트
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: urlData.publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // 로컬 상태 즉시 업데이트
        setProfile(prev => prev ? { ...prev, avatar_url: urlData.publicUrl } : null);
        
        // Auth 메타데이터 업데이트 (선택 사항이나 권장됨)
        await supabase.auth.updateUser({
          data: { avatar_url: urlData.publicUrl }
        });
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProfileShare = () => {
    if (navigator.share) {
      navigator.share({ title: profile?.full_name || '내 프로필', text: '드립닷컴에서 제 프로필을 확인해보세요!' });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleLogout = async () => {
    setConfirmModal({
      isOpen: true,
      title: '로그아웃 하시겠습니까?',
      onConfirm: async () => {
        setConfirmModal(null);
        await signOut();
        navigate('/login');
      }
    });
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || '드립 바리스타';
  const avatarUrl = (profile?.avatar_url && profile.avatar_url.trim() !== '') 
    ? profile.avatar_url 
    : (user?.user_metadata?.avatar_url && user.user_metadata.avatar_url.trim() !== '')
      ? user.user_metadata.avatar_url
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F3E5D8&color=D27C2C&size=200`;

  // 탭별 컨텐츠
  const tabContent = {
    '내가 쓴 글': myPosts,
    '저장됨': bookmarkedPosts,
    '좋아요': likedPosts,
  };

  const currentPosts = tabContent[activeTab as keyof typeof tabContent];

  return (
    <div className="fade-in" style={{ backgroundColor: '#FAF9F6', minHeight: '100vh', paddingBottom: '120px' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: '56px',
        borderBottom: '1px solid #F0F0F0'
      }}>
        <div style={{ width: '24px' }} />
        <span style={{ fontWeight: '800', fontSize: '17px' }}>마이페이지</span>
        <Settings
          size={22}
          color="#555"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/profile/edit')}
        />
      </div>

      {/* Profile Section */}
      <div style={{ backgroundColor: 'white', padding: '28px 24px 24px', marginBottom: '12px' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <div style={{
              width: '100px', height: '100px',
              borderRadius: '50%',
              border: '3px solid white',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              backgroundColor: '#F5F5F5'
            }}>
              {uploadingPhoto ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Loader2 size={28} className="animate-spin" color="var(--secondary-color)" />
                </div>
              ) : (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('ui-avatars')) {
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F3E5D8&color=D27C2C&size=200`;
                    }
                  }}
                />
              )}
            </div>
            {/* 사진 변경 버튼 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute', bottom: '2px', right: '2px',
                width: '30px', height: '30px',
                backgroundColor: 'var(--secondary-color)',
                borderRadius: '50%',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                border: '2px solid white',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <Camera size={15} color="white" />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/jpeg,image/png"
            onChange={handlePhotoChange}
          />

          <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '5px' }}>{displayName}</h2>
          <p style={{ color: '#9E9E9E', fontSize: '13px', fontWeight: '500', marginBottom: '12px' }}>
            {user?.email}
          </p>

          {/* Bio & Location */}
          {profile?.website && (
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#444', 
                fontWeight: '500', 
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                marginBottom: '4px'
              }}>
                {profile.website.split('||')[0]}
              </p>
              {profile.website.split('||')[1] && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#9E9E9E', fontSize: '12px' }}>
                  <MapPin size={12} color="var(--secondary-color)" />
                  <span>{profile.website.split('||')[1]}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/profile/edit')}
            style={{
              padding: '13px',
              borderRadius: '12px',
              backgroundColor: 'var(--secondary-color)',
              color: 'white', border: 'none',
              fontWeight: '700', fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(210,124,44,0.2)'
            }}
          >
            프로필 편집
          </button>
          <button
            onClick={handleProfileShare}
            style={{
              padding: '13px',
              borderRadius: '12px',
              backgroundColor: 'white',
              color: '#333', border: '1.5px solid #EDEDED',
              fontWeight: '700', fontSize: '14px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <Share2 size={16} /> 프로필 공유
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          {[
            { label: '브루잉', value: stats.posts },
            { label: '스크랩', value: stats.followers },
            { label: '좋아요', value: stats.following },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                backgroundColor: '#F9F9F9',
                padding: '14px 8px',
                borderRadius: '14px',
                textAlign: 'center',
                border: '1px solid #F0F0F0',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--secondary-color)', marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#BDBDBD', fontWeight: '600' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: 'white', marginBottom: '12px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #F0F0F0' }}>
          {TABS.map(tab => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '14px 0', textAlign: 'center',
                fontSize: '14px',
                fontWeight: activeTab === tab ? '800' : '500',
                color: activeTab === tab ? '#111' : '#BDBDBD',
                borderBottom: activeTab === tab ? '2.5px solid var(--secondary-color)' : '2.5px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <Loader2 size={36} className="animate-spin" color="var(--secondary-color)" />
            </div>
          ) : currentPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#BDBDBD' }}>
              <p style={{ fontSize: '15px', fontWeight: '600' }}>
                {activeTab === '내가 쓴 글' ? '작성한 일기가 없어요.' : activeTab === '저장됨' ? '저장한 글이 없어요.' : '좋아요 한 글이 없어요.'}
              </p>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>{activeTab === '내가 쓴 글' ? '첫 드립일기를 작성해보세요! ☕' : '마음에 드는 드립을 찾아보세요!'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {currentPosts.map(post => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/feed/${post.id}`)}
                  style={{
                    position: 'relative',
                    height: '200px',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: '#F3E5D8'
                  }}
                >
                  {post.image_urls && post.image_urls.length > 0 && (
                    <img 
                      src={post.image_urls[0]} 
                      alt="Post" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => { 
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  )}
                  
                  <div 
                    style={{ 
                      display: (!post.image_urls || post.image_urls.length === 0) ? 'flex' : 'none',
                      width: '100%', 
                      height: '100%', 
                      flexDirection: 'column', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      padding: '16px' 
                    }}
                  >
                    <span style={{ fontSize: '28px', marginBottom: '8px' }}>☕</span>
                    <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                      {post.content}
                    </p>
                  </div>
                  {/* 이미지 여러 개 표시 배지 */}
                  {post.image_urls && post.image_urls.length > 1 && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'white', backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '6px' }}>
                      <ImageIcon size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Section */}
      <div style={{ padding: '0 16px' }}>
        {/* Logout */}
        <div
          onClick={handleLogout}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer',
            border: '1px solid #F0F0F0',
            marginBottom: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#FF4d4f', fontWeight: '700', fontSize: '15px' }}>
            <LogOut size={20} color="#FF4d4f" />
            <span>로그아웃</span>
          </div>
          <ChevronRight size={18} color="#BDBDBD" />
        </div>
      </div>
      {/* Confirm Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '320px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>{confirmModal.title}</div>
            <div style={{ fontSize: '14px', color: '#757575', marginBottom: '24px' }}>다음 번에도 맛있는 커피와 함께 만나요!</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setConfirmModal(null)}
                style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid #EDEDED', backgroundColor: 'white', fontWeight: '700', cursor: 'pointer' }}
              >
                취소
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', backgroundColor: '#FF4d4f', color: 'white', fontWeight: '700', cursor: 'pointer' }}
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default ProfilePage;
