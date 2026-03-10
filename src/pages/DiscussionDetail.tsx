import React, { useState, useEffect } from 'react';
import { ChevronLeft, Bookmark, MoreVertical, Heart, MessageCircle, Send, Share2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const DiscussionDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [discussion, setDiscussion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState<any[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDiscussionDetail();
      fetchComments();
    }
  }, [id]);

  const fetchDiscussionDetail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('type', 'discussion')
        .single();
      
      if (error) throw error;
      
      let fetchedData = { ...data };
      if (fetchedData && fetchedData.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, website')
          .eq('id', fetchedData.user_id)
          .single();
        fetchedData.profiles = profileData || { full_name: '익명', avatar_url: '' };
      }
      
      setDiscussion(fetchedData);
      setLikeCount(fetchedData.likes_count || 0);
    } catch (err) {
      console.error('Error fetching discussion detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      let fetchedComments = data || [];
      const userIds = [...new Set(fetchedComments.map((c: any) => c.user_id))].filter(Boolean);
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
          
        if (profilesData) {
          const profileMap = profilesData.reduce((acc: any, p: any) => {
            acc[p.id] = p;
            return acc;
          }, {});
          
          fetchedComments = fetchedComments.map((c: any) => ({
            ...c,
            profiles: profileMap[c.user_id] || { full_name: '익명', avatar_url: '' }
          }));
        }
      }
      
      setComments(fetchedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !supabase.auth.getUser() || submittingComment) return;
    
    setSubmittingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('comments').insert({
        post_id: id,
        user_id: user.id,
        content: commentText.trim()
      });

      if (error) throw error;
      setCommentText('');
      fetchComments();
      if (discussion) setDiscussion({ ...discussion, comments_count: (discussion.comments_count || 0) + 1 });
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <div className="fade-in" style={{ backgroundColor: '#FAF9F6', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div className="header" style={{ backgroundColor: 'white', borderBottom: '1px solid #F0F0F0' }}>
        <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <span style={{ fontWeight: '800', fontSize: '17px' }}>커뮤니티 상세</span>
        <div style={{ display: 'flex', gap: '16px', position: 'relative', alignItems: 'center' }}>
          <Share2 
            size={22} 
            color="#9E9E9E" 
            style={{ cursor: 'pointer' }} 
            onClick={async () => {
              const url = window.location.href;
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: discussion?.title || '나의 드립일기',
                    text: discussion?.content,
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
            }}
          />
          <Bookmark
            size={22}
            fill={bookmarked ? '#333' : 'none'}
            color={bookmarked ? '#333' : '#9E9E9E'}
            style={{ cursor: 'pointer' }}
            onClick={() => setBookmarked(!bookmarked)}
          />
          <MoreVertical size={22} color="#9E9E9E" onClick={() => setShowMenu(!showMenu)} style={{ cursor: 'pointer' }} />
          {showMenu && (
            <div style={{
              position: 'absolute', top: '36px', right: 0,
              width: '110px', backgroundColor: 'white',
              borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              border: '1px solid #F0F0F0', zIndex: 100, overflow: 'hidden'
            }}>
              <div style={{ padding: '14px', fontSize: '14px', fontWeight: '600', textAlign: 'center', borderBottom: '1px solid #F5F5F5' }}>수정</div>
              <div style={{ padding: '14px', fontSize: '14px', fontWeight: '600', color: '#FF4d4f', textAlign: 'center' }}>삭제</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={32} color="var(--secondary-color)" style={{ margin: '0 auto' }} />
          </div>
        ) : discussion ? (
          <>
            {/* Category Tags */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <span style={{ padding: '5px 14px', backgroundColor: '#FDF1E6', color: 'var(--secondary-color)', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                {discussion.category || '기본'}
              </span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: '22px', fontWeight: '900', lineHeight: '1.4', marginBottom: '20px' }}>
              {discussion.title}
            </h1>

            {/* Author */}
            <div 
              onClick={() => navigate(`/profile/${discussion.user_id}`)}
              style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '12px', cursor: 'pointer' }}
            >
              <img
                src={discussion.profiles?.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100"}
                alt="Author"
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '800', fontSize: '14px' }}>{discussion.profiles?.full_name || '익명'}</span>
                  <span style={{ fontSize: '11px', color: 'var(--secondary-color)', fontWeight: '700', backgroundColor: '#FDF1E6', padding: '2px 8px', borderRadius: '6px' }}>
                    {discussion.profiles?.website?.split('||')[0] || '커피 애호가'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#BDBDBD', marginTop: '2px' }}>{new Date(discussion.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Images if any */}
            {discussion.image_urls && discussion.image_urls.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {discussion.image_urls.map((url: string, index: number) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Discussion ${index + 1}`}
                    style={{ width: '100%', borderRadius: '16px', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ))}
              </div>
            )}

            {/* Body */}
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#333', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
              {discussion.content}
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid #F0F0F0', marginBottom: '24px' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                onClick={handleLike}
              >
                <Heart size={18} fill={liked ? 'var(--secondary-color)' : 'none'} color={liked ? 'var(--secondary-color)' : '#9E9E9E'} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: liked ? 'var(--secondary-color)' : '#9E9E9E' }}>{likeCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageCircle size={18} color="#9E9E9E" />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#9E9E9E' }}>{discussion.comments_count || 0}</span>
              </div>
            </div>

            {/* Comments List */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>댓글 {discussion.comments_count || 0}개</h3>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#BDBDBD', fontSize: '14px' }}>
                  첫 댓글을 남겨보세요! ☕
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                  {comments.map((comment) => (
                    <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                      <img
                        src={comment.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=50'}
                        alt="Commenter"
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${comment.user_id}`)}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '800', fontSize: '13px' }}>{comment.profiles?.full_name || '익명'}</span>
                          <span style={{ fontSize: '11px', color: '#BDBDBD' }}>
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.5' }}>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#BDBDBD' }}>
            게시글을 찾을 수 없습니다.
          </div>
        )}
      </div>

      {/* Fixed Comment Input */}
      <div style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        padding: '12px 16px',
        borderTop: '1px solid #F0F0F0',
        backgroundColor: 'white',
        display: 'flex', alignItems: 'center', gap: '10px',
        zIndex: 100
      }}>
        <div style={{
          flex: 1,
          backgroundColor: '#F5F5F5',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          padding: '4px 16px',
          gap: '8px'
        }}>
          <input
            type="text"
            placeholder="댓글 남기기..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
            style={{ border: 'none', background: 'transparent', flex: 1, fontSize: '14px', outline: 'none', padding: '10px 0' }}
          />
          <button 
            onClick={handleCommentSubmit}
            disabled={!commentText.trim() || submittingComment}
            style={{ 
              border: 'none', 
              background: 'transparent', 
              color: commentText.trim() && !submittingComment ? 'var(--secondary-color)' : '#BDBDBD', 
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {submittingComment ? <Loader2 size={16} className="animate-spin" /> : '게시'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetail;
