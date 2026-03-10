import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Bell, Plus, Loader2, Trash2, Edit3, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Post {
  id: string;
  created_at: string;
  content: string;
  image_urls: string[];
  user_id: string;
  likes_count: number;
  comments_count: number;
  type: string;
  title?: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  website?: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; onConfirm: () => void } | null>(null);

  // Comment popup state
  const [commentPopup, setCommentPopup] = useState<{ postId: string; postTitle?: string } | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    if (user) fetchMyProfile();
  }, [user]);

  const fetchMyProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, website')
        .eq('id', user.id)
        .single();
      
      if (error) {
        // 프로필이 아직 없는 경우 auth metadata에서 기본값 가져오기
        setMyProfile({
          id: user.id,
          full_name: user?.user_metadata?.full_name || '드립 바리스타',
          avatar_url: user?.user_metadata?.avatar_url || '',
          website: ''
        });
      } else if (data) {
        setMyProfile(data);
      }
    } catch (err) {
      console.error('Error fetching my profile:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, created_at, content, image_urls, user_id, likes_count, comments_count, type')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('fetchPosts error:', error);
      }
      const fetchedPosts = data || [];
      setPosts(fetchedPosts);

      // 작성자 프로필 일괄 조회
      const userIds = [...new Set(fetchedPosts.map(p => p.user_id))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, website')
          .in('id', userIds);
        if (profileData) {
          const profileMap = profileData.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
          setProfiles(profileMap);
        }
      }

      // 사용자의 좋아요/북마크 내역 조회 (실시간 동기화 강화)
      if (user) {
        const [likesRes, bookmarksRes] = await Promise.all([
          supabase.from('likes').select('post_id').eq('user_id', user.id),
          supabase.from('bookmarks').select('post_id').eq('user_id', user.id)
        ]);

        if (likesRes.data) setLikedPosts(new Set(likesRes.data.map(l => l.post_id)));
        if (bookmarksRes.data) setBookmarked(new Set(bookmarksRes.data.map(b => b.post_id)));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (post: Post) => {
    if (!user) {
      return;
    }
    const isLiked = likedPosts.has(post.id);
    const newCount = Math.max(0, isLiked ? (post.likes_count || 0) - 1 : (post.likes_count || 0) + 1);

    // 낙관적 UI 업데이트
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (isLiked) next.delete(post.id); else next.add(post.id);
      return next;
    });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: newCount } : p));

    try {
      // DB 업데이트
      if (isLiked) {
        const { error } = await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
        if (error) console.error('Error deleting like:', error);
      } else {
        const { error } = await supabase.from('likes').upsert({ user_id: user.id, post_id: post.id }, { onConflict: 'user_id,post_id' });
        if (error) console.error('Error upserting like:', error);
      }
      
      // posts 테이블의 likes_count 업데이트
      await supabase.from('posts').update({ likes_count: newCount }).eq('id', post.id);
    } catch (err) {
      console.error('Like action failed:', err);
      // 실패 시 롤백 (간단하게 재조회)
      fetchPosts();
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!user) {
      return;
    }
    const isBookmarked = bookmarked.has(postId);
    
    // 낙관적 UI 업데이트
    setBookmarked(prev => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(postId); else next.add(postId);
      return next;
    });

    try {
      if (isBookmarked) {
        const { error } = await supabase.from('bookmarks').delete().match({ user_id: user.id, post_id: postId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bookmarks').upsert({ user_id: user.id, post_id: postId }, { onConflict: 'user_id,post_id' });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Bookmark action failed:', err);
      fetchPosts();
    }
  };

  const handleDelete = async (postId: string) => {
    setConfirmModal({
      isOpen: true,
      title: '이 일기를 삭제할까요?',
      onConfirm: async () => {
        setMenuOpenId(null);
        setConfirmModal(null);
        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (!error) setPosts(prev => prev.filter(p => p.id !== postId));
      }
    });
  };

  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({ text: post.content, title: '드립일기' });
    } else {
      navigator.clipboard.writeText(post.content);
    }
  };

  // Comment popup functions
  const openCommentPopup = async (postId: string, postTitle?: string) => {
    setCommentPopup({ postId, postTitle });
    setCommentText('');
    setLoadingComments(true);
    try {
      // Step 1: Fetch comments
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (commentError) throw commentError;
      
      if (!commentData || commentData.length === 0) {
        setComments([]);
      } else {
        // Step 2: Fetch profiles for comment authors
        const authorIds = [...new Set(commentData.map(c => c.user_id))];
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', authorIds);
        
        const profileMap: Record<string, any> = {};
        (profileData || []).forEach(p => { profileMap[p.id] = p; });
        
        // Merge profiles into comments
        const enrichedComments = commentData.map(c => ({
          ...c,
          profiles: profileMap[c.user_id] || { full_name: '익명', avatar_url: null }
        }));
        setComments(enrichedComments);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    } finally {
      setLoadingComments(false);
      setTimeout(() => commentInputRef.current?.focus(), 300);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !user || !commentPopup || submittingComment) return;
    setSubmittingComment(true);
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: commentPopup.postId,
        user_id: user.id,
        content: commentText.trim()
      });
      if (error) {
        console.error('Error deleting post:', error);
        alert('게시글 삭제에 실패했습니다.');
        return;
      }
      setCommentText('');
      // Refresh comments using the same two-step approach
      const { data: commentData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', commentPopup.postId)
        .order('created_at', { ascending: true });
      
      if (commentData && commentData.length > 0) {
        const authorIds = [...new Set(commentData.map(c => c.user_id))];
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', authorIds);
        
        const profileMap: Record<string, any> = {};
        (profileData || []).forEach(p => { profileMap[p.id] = p; });
        
        setComments(commentData.map(c => ({
          ...c,
          profiles: profileMap[c.user_id] || { full_name: '익명', avatar_url: null }
        })));
      } else {
        setComments([]);
      }
      // Update local post comment count
      setPosts(prev => prev.map(p => 
        p.id === commentPopup.postId 
          ? { ...p, comments_count: (p.comments_count || 0) + 1 } 
          : p
      ));
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const stories = [
    { id: 'me', name: '내 일기', role: '바리스타', img: myProfile?.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200', hasUpdate: true, isMe: true },
    { id: '2', name: '민우', role: '로스터', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200' },
    { id: '3', name: '서연', role: '커피마스터', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200' },
    { id: '4', name: '지후', role: '에디터', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200' },
    { id: '5', name: '하윤', role: '카페투어러', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' },
  ];

  if (loading) {
    return (
      <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="var(--secondary-color)" />
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ paddingBottom: '100px', backgroundColor: '#F8F9FA' }}>
      {/* ... 메뉴 열렸을 때 배경 닫기 */}
      {menuOpenId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setMenuOpenId(null)}
        />
      )}

      {/* Header */}
      <div className="header" style={{
        padding: '12px 20px',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #F0F0F0',
        height: '56px'
      }}>
        <img
          src="/logo.jpg"
          alt=""
          style={{ height: '32px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />
        <div
          onClick={() => navigate('/notifications')}
          style={{
            padding: '8px',
            marginRight: '-8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'relative' }}>
            <Bell size={24} color="#333" />
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              backgroundColor: '#FF4d4f',
              borderRadius: '50%',
              border: '2px solid white'
            }} />
          </div>
        </div>
      </div>

      {/* Stories */}
      <div style={{ padding: '10px 0', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '0 20px', scrollbarWidth: 'none' }}>
          {stories.map(story => (
            <div 
              key={story.id} 
              onClick={() => {
                if (story.isMe) navigate('/profile');
                else alert(`${story.name}님은 ${story.role}입니다. 곧 스토리가 준비됩니다!`);
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '70px', cursor: 'pointer' }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                padding: '3px',
                border: story.hasUpdate ? '2px solid var(--secondary-color)' : '1px solid #EDEDED',
                position: 'relative'
              }}>
                <img src={story.img} alt={story.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                {story.isMe && (
                  <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'var(--secondary-color)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid white' }}>
                    <Plus size={12} color="white" strokeWidth={4} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#333' }}>{story.name}</span>
                <span style={{ fontSize: '10px', fontWeight: '500', color: '#BDBDBD' }}>{story.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div style={{ padding: '16px' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: '#BDBDBD' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>아직 등록된 일기가 없어요.</p>
            <p style={{ fontSize: '14px' }}>첫 번째 드립일기를 작성해보세요!</p>
          </div>
        ) : (
          posts.map(post => {
            const profile = profiles[post.user_id];
            const isLiked = likedPosts.has(post.id);
            const isBookmarked = bookmarked.has(post.id);
            const isMyPost = user?.id === post.user_id;

            return (
              <div key={post.id} className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '20px', borderRadius: '24px', position: 'relative' }}>
                {/* Card Header */}
                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div 
                    onClick={() => navigate('/profile')} 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                  >
                    <img
                      src={(profile?.avatar_url && profile.avatar_url.trim() !== '') ? profile.avatar_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || '드립')}&background=F3E5D8&color=D27C2C&size=100`}
                      alt="profile"
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #F0F0F0' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || '드립')}&background=F3E5D8&color=D27C2C&size=100`;
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ fontWeight: '800', fontSize: '15px' }}>{profile?.full_name || '드립 바리스타'}</div>
                        <span style={{ 
                          fontSize: '10px', 
                          color: 'var(--secondary-color)', 
                          backgroundColor: '#FFF0E6', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontWeight: '700' 
                        }}>
                          {profile?.website?.split('||')[0] || '홈바리스타'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#BDBDBD' }}>
                        {new Date(post.created_at).toLocaleString('ko-KR', { hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* ... 메뉴 */}
                  <div style={{ position: 'relative' }}>
                    <div
                      onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === post.id ? null : post.id); }}
                      style={{ padding: '8px', cursor: 'pointer', borderRadius: '50%' }}
                    >
                      <MoreHorizontal size={20} color="#BDBDBD" />
                    </div>
                    {menuOpenId === post.id && (
                      <div style={{
                        position: 'absolute', top: '36px', right: 0, zIndex: 100,
                        backgroundColor: 'white', borderRadius: '14px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        border: '1px solid #F0F0F0', overflow: 'hidden', minWidth: '140px'
                      }}>
                        {isMyPost ? (
                          <>
                            <div
                              onClick={() => { setMenuOpenId(null); navigate('/write'); }}
                              style={{ padding: '14px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F5F5F5' }}
                            >
                              <Edit3 size={16} color="#555" /> 수정하기
                            </div>
                            <div
                              onClick={() => handleDelete(post.id)}
                              style={{ padding: '14px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#FF4d4f' }}
                            >
                              <Trash2 size={16} color="#FF4d4f" /> 삭제하기
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ padding: '14px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', borderBottom: '1px solid #F5F5F5' }}>
                              🚩 신고하기
                            </div>
                            <div style={{ padding: '14px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                              🔕 숨기기
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '0 16px 16px' }}>
                  <p style={{ fontSize: '15px', color: '#444', lineHeight: '1.6', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </p>
                </div>

                {/* Card Images */}
                {post.image_urls && post.image_urls.length > 0 && (
                  <div style={{ position: 'relative' }}>
                    {post.image_urls.length === 1 ? (
                      <img src={post.image_urls[0]} alt="Post" style={{ width: '100%', height: '360px', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <img src={post.image_urls[0]} alt="Post 1" style={{ width: '50%', height: '280px', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <img src={post.image_urls[1]} alt="Post 2" style={{ width: '50%', height: '280px', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Card Actions */}
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* 좋아요 */}
                    <div
                      onClick={() => handleLike(post)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <Heart
                        size={22}
                        fill={isLiked ? 'var(--secondary-color)' : 'none'}
                        color={isLiked ? 'var(--secondary-color)' : '#555'}
                        style={{ transition: 'all 0.2s' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: isLiked ? 'var(--secondary-color)' : '#555' }}>
                        {post.likes_count}
                      </span>
                    </div>
                    {/* 댓글 */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        openCommentPopup(post.id, post.title || post.content?.slice(0, 20));
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <MessageCircle size={22} color="#555" />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#555' }}>{post.comments_count}</span>
                    </div>
                    {/* 공유 */}
                    <div onClick={async (e) => {
                      e.stopPropagation();
                      const url = `${window.location.origin}${post.type === 'discussion' ? '/discussion' : '/feed'}/${post.id}`;
                      
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: post.title || '나의 드립일기',
                            text: post.content,
                            url: url,
                          });
                        } catch (err) {
                          console.error('Error sharing:', err);
                        }
                      } else {
                        navigator.clipboard.writeText(url).then(() => {
                          alert('게시글 링크가 클립보드에 복사되었습니다.');
                        });
                      }
                    }} style={{ cursor: 'pointer' }}>
                      <Share2 size={22} color="#555" />
                    </div>
                  </div>
                  {/* 북마크 */}
                  <div
                    onClick={() => handleBookmark(post.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Bookmark size={22} fill={isBookmarked ? '#333' : 'none'} color={isBookmarked ? '#333' : '#555'} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        pointerEvents: 'none',
        zIndex: 1001
      }}>
        <button
          onClick={() => navigate('/write')}
          style={{
            position: 'absolute',
            right: '20px',
            bottom: '0',
            backgroundColor: 'var(--secondary-color)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '30px',
            fontWeight: '800',
            fontSize: '15px',
            boxShadow: '0 6px 20px rgba(210, 124, 44, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}>
          <Plus size={18} strokeWidth={3} />
          일기쓰기
        </button>
      </div>
      {/* Confirm Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '320px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>{confirmModal.title}</div>
            <div style={{ fontSize: '14px', color: '#757575', marginBottom: '24px' }}>삭제된 일기는 복구할 수 없어요.</div>
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
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Bottom Sheet Popup */}
      {commentPopup && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => { setCommentPopup(null); setComments([]); setCommentText(''); }}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 10000, transition: 'opacity 0.3s'
            }}
          />
          {/* Bottom Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '480px', maxHeight: '70vh',
            backgroundColor: 'white', borderRadius: '24px 24px 0 0',
            zIndex: 10001, display: 'flex', flexDirection: 'column',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Handle Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '40px', height: '4px', backgroundColor: '#E0E0E0', borderRadius: '2px' }} />
            </div>
            {/* Header */}
            <div style={{ padding: '8px 20px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', fontSize: '16px' }}>댓글</span>
              <X
                size={22} color="#9E9E9E" style={{ cursor: 'pointer' }}
                onClick={() => { setCommentPopup(null); setComments([]); setCommentText(''); }}
              />
            </div>
            {/* Comments List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {loadingComments ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <Loader2 className="animate-spin" size={24} color="var(--secondary-color)" />
                </div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#BDBDBD', fontSize: '14px' }}>
                  첫 댓글을 남겨보세요! ☕
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {comments.map((c: any) => (
                    <div key={c.id} style={{ display: 'flex', gap: '12px' }}>
                      <img
                        src={c.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.profiles?.full_name || '익명')}&background=F3E5D8&color=D27C2C&size=80`}
                        alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=U&background=F3E5D8&color=D27C2C&size=80`; }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '800', fontSize: '13px' }}>{c.profiles?.full_name || '익명'}</span>
                          <span style={{ fontSize: '11px', color: '#BDBDBD' }}>
                            {new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.5', margin: 0 }}>{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Comment Input */}
            <div style={{
              borderTop: '1px solid #F0F0F0', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white'
            }}>
              <div style={{
                flex: 1, backgroundColor: '#F5F5F5', borderRadius: '24px',
                display: 'flex', alignItems: 'center', padding: '4px 16px', gap: '8px'
              }}>
                <input
                  ref={commentInputRef}
                  type="text" placeholder="댓글 남기기..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                  style={{ border: 'none', background: 'transparent', flex: 1, fontSize: '14px', outline: 'none', padding: '10px 0' }}
                />
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || submittingComment}
                  style={{
                    border: 'none', background: 'transparent',
                    color: commentText.trim() && !submittingComment ? 'var(--secondary-color)' : '#BDBDBD',
                    fontWeight: '800', fontSize: '14px', cursor: 'pointer', padding: '4px'
                  }}
                >
                  {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes slideUp {
              from { transform: translateX(-50%) translateY(100%); }
              to { transform: translateX(-50%) translateY(0); }
            }
          `}</style>
        </>
      )}
    </div>
  );
};

export default Home;
