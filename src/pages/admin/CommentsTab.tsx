import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Loader2 } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  user_id: {
    id: string;
    full_name: string;
  };
}

const CommentsTab: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      // Step 1: Fetch comments
      const { data: commentData, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!commentData || commentData.length === 0) {
        setComments([]);
      } else {
        // Step 2: Fetch profiles for authors
        const authorIds = [...new Set(commentData.map(c => c.user_id))];
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', authorIds);
        
        const profileMap: Record<string, any> = {};
        (profileData || []).forEach(p => { profileMap[p.id] = p; });
        
        setComments(commentData.map(c => ({
          ...c,
          user_id: profileMap[c.user_id] || { id: c.user_id, full_name: '알 수 없음' }
        })) as unknown as Comment[]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setToast({ type: 'error', message: '댓글 목록을 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      
      setToast({ type: 'success', message: '댓글이 삭제되었습니다. 🗑️' });
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      setToast({ type: 'error', message: '댓글 삭제에 실패했습니다.' });
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
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>전체 댓글 목록 ({comments.length}건)</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {comments.map((comment) => (
          <div key={comment.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>
                {comment.user_id?.full_name || '알 수 없음'}
              </div>
              <button 
                onClick={() => handleDeleteComment(comment.id)} 
                style={{ background: 'none', border: 'none', color: '#FF5252', cursor: 'pointer', padding: 0 }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div style={{ fontSize: '14px', color: '#333', lineHeight: 1.5 }}>
              {comment.content}
            </div>
            
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#9E9E9E', display: 'flex', justifyContent: 'space-between' }}>
              <span>작성일: {new Date(comment.created_at).toLocaleString('ko-KR')}</span>
              <span>게시글 ID: {comment.post_id.substring(0, 8)}...</span>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9E9E9E' }}>
            작성된 댓글이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsTab;
