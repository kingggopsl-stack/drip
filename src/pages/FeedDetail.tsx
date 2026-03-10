import React, { useState, useEffect } from 'react';
import { ChevronLeft, MoreVertical, Heart, Share2, Send, Bookmark, MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const FeedDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [comment, setComment] = useState('');

  const [comments, setComments] = useState<any[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPostDetail();
      fetchComments();
    }
  }, [id]);

  const fetchPostDetail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      let fetchedData = { ...data };
      if (fetchedData && fetchedData.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, website')
          .eq('id', fetchedData.user_id)
          .single();
        fetchedData.profiles = profileData || { full_name: '익명', avatar_url: '' };
      }
      
      setPost(fetchedData);
      setLikeCount(fetchedData.likes_count || 0);
    } catch (err) {
      console.error('Error fetching post detail:', err);
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
    if (!comment.trim() || !supabase.auth.getUser() || submittingComment) return;
    
    setSubmittingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('comments').insert({
        post_id: id,
        user_id: user.id,
        content: comment.trim()
      });

      if (error) throw error;
      setComment('');
      fetchComments();
      // Increase comment count locally
      if (post) setPost({ ...post, comments_count: (post.comments_count || 0) + 1 });
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

  const stats = [
    { label: '추출 온도', value: '93°C' },
    { label: '비율', value: '1:16' },
    { label: '추출 시간', value: '3분 20초' },
    { label: '원산지', value: '에티오피아' },
  ];

  return (
    <div className="fade-in" style={{ backgroundColor: '#FFF', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header - Dark overlay style */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderBottom: '1px solid #F0F0F0',
        height: '56px'
      }}>
        <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <span style={{ fontWeight: '800', fontSize: '17px' }}>드립일기 상세</span>
        <MoreVertical size={24} color="#9E9E9E" style={{ cursor: 'pointer' }} />
      </div>

          {/* Images Section */}
      <div style={{ backgroundColor: '#F8F9FA' }}>
        {loading ? (
          <div style={{ minHeight: '360px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Loader2 className="animate-spin" size={32} color="var(--secondary-color)" />
          </div>
        ) : post?.image_urls && post.image_urls.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {post.image_urls.map((url: string, index: number) => (
              <div key={index} style={{ position: 'relative', width: '100%' }}>
                <img
                  src={url}
                  alt={`Coffee ${index + 1}`}
                  style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {/* Gradient overlay for the last image or all? Just last one for aesthetics if scrolling */}
                {index === post.image_urls.length - 1 && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.3) 100%)'
                  }} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ minHeight: '200px', padding: '40px', textAlign: 'center', color: '#BDBDBD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '15px' }}>{post?.content || '이미지 없음'}</p>
          </div>
        )}
      </div>

      {!loading && post && (
        <div style={{ padding: '20px' }}>
          {/* Title & Actions Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '6px' }}>{post.title || '나의 드립일기'}</h1>
              <span style={{ color: '#9E9E9E', fontSize: '13px' }}>
                {new Date(post.created_at).toLocaleDateString()} · {post.category || '기본'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginLeft: '16px' }}>
              <div
                onClick={handleLike}
                style={{
                  width: '48px', height: '48px',
                  borderRadius: '50%',
                  backgroundColor: liked ? '#FFF0E6' : '#F5F5F5',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Heart size={22} fill={liked ? 'var(--secondary-color)' : 'none'} color={liked ? 'var(--secondary-color)' : '#555'} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: liked ? 'var(--secondary-color)' : '#9E9E9E' }}>{likeCount}</span>
            </div>
          </div>

          {/* Profile Bar */}
          <div style={{
            backgroundColor: '#FAFAFA',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '20px',
            border: '1px solid #F0F0F0',
            cursor: 'pointer'
          }} onClick={() => navigate(`/profile/${post.user_id}`)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={post.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=50'}
                alt="Profile"
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontWeight: '800', fontSize: '14px' }}>{post.profiles?.full_name || '익명'}</div>
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
                <div style={{ color: '#9E9E9E', fontSize: '12px' }}>
                  {post.profiles?.website?.split('||')[1] || '커피를 사랑하는 분'}
                </div>
              </div>
            </div>
          </div>

          {/* Body Text */}
          <p style={{ fontSize: '15px', color: '#333', lineHeight: '1.8', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
            {post.content}
          </p>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          {stats.map(stat => (
            <div key={stat.label} style={{
              backgroundColor: '#FDF8F3',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid #F3E5D8'
            }}>
              <div style={{ fontSize: '11px', color: '#BDBDBD', marginBottom: '5px', fontWeight: '600' }}>{stat.label}</div>
              <div style={{ fontWeight: '900', fontSize: '16px', color: '#333' }}>{stat.value}</div>
            </div>
          ))}
        </div>

              {/* Actions Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', borderTop: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={handleLike}>
                <Heart size={20} fill={liked ? 'var(--secondary-color)' : 'none'} color={liked ? 'var(--secondary-color)' : '#555'} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#555' }}>{likeCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <MessageCircle size={20} color="#555" />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#555' }}>{post.comments_count || 0}</span>
              </div>
              <div style={{ cursor: 'pointer' }} onClick={async () => {
                const url = window.location.href;
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
              }}>
                <Share2 size={20} color="#555" />
              </div>
            </div>
            <Bookmark
              size={20}
              fill={bookmarked ? '#333' : 'none'}
              color={bookmarked ? '#333' : '#555'}
              style={{ cursor: 'pointer' }}
              onClick={() => setBookmarked(!bookmarked)}
            />
          </div>

          {/* Comments Section */}
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', marginBottom: '16px' }}>댓글 {post.comments_count || 0}개</div>
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
        </div>
      )}

      {/* Sticky Comment Input */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        padding: '12px 16px',
        borderTop: '1px solid #F0F0F0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'white',
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
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
            style={{ border: 'none', background: 'transparent', flex: 1, fontSize: '14px', outline: 'none', padding: '10px 0' }}
          />
          <button 
            onClick={handleCommentSubmit}
            disabled={!comment.trim() || submittingComment}
            style={{ 
              border: 'none', 
              background: 'transparent', 
              color: comment.trim() && !submittingComment ? 'var(--secondary-color)' : '#BDBDBD', 
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

export default FeedDetail;
