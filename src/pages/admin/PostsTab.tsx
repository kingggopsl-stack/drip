import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminPost {
  id: string;
  created_at: string;
  content: string;
  image_urls: string[];
  user_id: any;
  likes_count: number;
  comments_count: number;
  type: string;
  title?: string;
}

const PostsTab: React.FC = () => {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Step 1: Fetch posts
      const { data: postData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!postData || postData.length === 0) {
        setPosts([]);
      } else {
        // Step 2: Fetch profiles for authors
        const authorIds = [...new Set(postData.map(p => p.user_id))];
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', authorIds);
        
        const profileMap: Record<string, any> = {};
        (profileData || []).forEach(p => { profileMap[p.id] = p; });
        
        setPosts(postData.map(p => ({
          ...p,
          user_id: profileMap[p.user_id] || { id: p.user_id, full_name: '알 수 없음', avatar_url: null }
        })) as unknown as AdminPost[]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setToast({ type: 'error', message: '게시글 목록을 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까? 복구할 수 없습니다.')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      setToast({ type: 'success', message: '게시글이 삭제되었습니다. 🗑️' });
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      setToast({ type: 'error', message: '게시글 삭제에 실패했습니다.' });
    }
  };

  const navigateToPost = (post: AdminPost) => {
    if (post.type === 'community') {
      navigate(`/discussion/${post.id}`);
    } else {
      navigate(`/feed/${post.id}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <Loader2 size={28} className="animate-spin" color="var(--secondary-color)" />
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', backgroundColor: toast.type === 'success' ? '#4CAF50' : '#FF5252', color: 'white', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>전체 게시글 목록 ({posts.length}건)</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {posts.map((post) => (
          <div key={post.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  backgroundColor: post.type === 'community' ? '#E3F2FD' : '#F3E5F5', 
                  color: post.type === 'community' ? '#1976D2' : '#7B1FA2', 
                  padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' 
                }}>
                  {post.type === 'community' ? '커뮤니티' : '일기'}
                </span>
                <span style={{ fontSize: '13px', color: '#757575' }}>
                  작성자: {post.user_id?.full_name || '알 수 없음'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => navigateToPost(post)} style={{ background: 'none', border: 'none', color: '#9E9E9E', cursor: 'pointer', padding: 0 }}>
                  <ExternalLink size={18} />
                </button>
                <button onClick={() => handleDeletePost(post.id)} style={{ background: 'none', border: 'none', color: '#FF5252', cursor: 'pointer', padding: 0 }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            {post.type === 'community' && post.title && (
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>{post.title}</div>
            )}
            
            <div style={{ 
              fontSize: '14px', color: '#333', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {post.content}
            </div>
            
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#9E9E9E' }}>
              작성일: {new Date(post.created_at).toLocaleString('ko-KR')}
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9E9E9E' }}>
            작성된 게시글이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default PostsTab;
