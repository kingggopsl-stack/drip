import React, { useState, useEffect } from 'react';
import { Search, PenSquare, MessageCircle, Heart, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface CommunityPost {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  content: string;
  image_urls: string[];
  category: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    website?: string;
  };
}

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('전체');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = ['전체', '질문', '카페후기', '자유잡담'];

  useEffect(() => {
    fetchCommunityPosts();
  }, [activeTab]);

  const fetchCommunityPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          created_at,
          title,
          content,
          image_urls,
          category
        `)
        .eq('type', 'discussion')
        .order('created_at', { ascending: false });

      if (activeTab !== '전체') {
        const categoryMap: Record<string, string> = {
          '질문': 'question',
          '카페후기': 'review',
          '자유잡담': 'chat'
        };
        const dbCategory = categoryMap[activeTab] || activeTab;
        query = query.eq('category', dbCategory);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('fetchError : ', error);
        return;
      }
      
      const fetchedPosts = data || [];
      
      // 작성자 프로필 정보 별도 조회 준비
      const userIds = [...new Set(fetchedPosts.map(p => p.user_id))].filter(Boolean);
      let profileMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, website')
          .in('id', userIds);
          
        if (!profileError && profileData) {
          profileData.forEach(p => {
            profileMap[p.id] = p;
          });
        }
      }

      // 게시글과 프로필 병합
      const mergedPosts = fetchedPosts.map(post => ({
        ...post,
        profiles: profileMap[post.user_id] || { full_name: '익명', avatar_url: '' }
      }));

      setPosts(mergedPosts as CommunityPost[]);
    } catch (error) {
      console.error('Error fetching community posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen pb-20 bg-[#F9F9F9]">
        <div className="header" style={{ padding: '16px 20px', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '900' }}>커뮤니티</h1>
        <Search size={24} color="#333" />
      </div>

      {/* Categories */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #EDEDED', position: 'sticky', top: '56px', zIndex: 10 }}>
        <div style={{ display: 'flex', padding: '0 20px' }}>
          {tabs.map(tab => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: '16px 12px', 
                fontSize: '15px', 
                fontWeight: activeTab === tab ? '800' : '500', 
                color: activeTab === tab ? 'var(--secondary-color)' : '#9E9E9E',
                borderBottom: activeTab === tab ? '3px solid var(--secondary-color)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* Post List */}
      <div style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <Loader2 className="animate-spin" size={32} color="var(--secondary-color)" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#BDBDBD', fontSize: '15px' }}>
            해당 카테고리에 게시물이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map((post: CommunityPost) => (
              <div 
                key={post.id} 
                className="card" 
                onClick={() => navigate(`/discussion/${post.id}`)}
                style={{ padding: '20px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '800', 
                        color: 'var(--secondary-color)', 
                        backgroundColor: '#FDF1E6', 
                        padding: '2px 8px', 
                        borderRadius: '4px' 
                      }}>
                        {post.category}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '8px', lineHeight: '1.4' }}>{post.title || '제목 없음'}</h3>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#757575', 
                      lineHeight: '1.5', 
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {post.content}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${post.user_id}`);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      >
                        <img 
                          src={post.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=50'} 
                          style={{ width: '20px', height: '20px', borderRadius: '50%' }} 
                        />
                        <span style={{ fontSize: '12px', color: '#9E9E9E', fontWeight: '500' }}>{post.profiles?.full_name || '익명'}</span>
                        <span style={{ 
                          fontSize: '10px', 
                          color: 'var(--secondary-color)', 
                          fontWeight: '700', 
                          backgroundColor: '#FDF1E6', 
                          padding: '1px 6px', 
                          borderRadius: '4px' 
                        }}>
                          {post.profiles?.website?.split('||')[0] || '커피 애호가'}
                        </span>
                      </div>
                      <span style={{ color: '#EDEDED' }}>•</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9E9E9E' }}>
                        <Heart size={14} /> 24
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9E9E9E' }}>
                        <MessageCircle size={14} /> 12
                      </div>
                    </div>
                  </div>
                  {post.image_urls && post.image_urls.length > 0 && (
                    <img 
                      src={post.image_urls[0]} 
                      style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} 
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Floating Write Button */}
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      pointerEvents: 'none',
      zIndex: 1001
    }}>
      <button
        onClick={() => navigate('/write', { state: { type: 'discussion' } })}
        style={{
          position: 'absolute',
          right: '20px',
          bottom: '0',
          pointerEvents: 'auto',
          backgroundColor: 'var(--secondary-color)',
          color: 'white',
          border: 'none',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          fontWeight: '800',
          fontSize: '15px',
          boxShadow: '0 6px 20px rgba(210, 124, 44, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}>
        <PenSquare size={24} strokeWidth={2.5} />
      </button>
    </div>
    </>
  );
};

export default CommunityPage;
