import React, { useState, useEffect } from 'react';
import { Users, FileText, MessageSquare, TrendingUp, AlertTriangle, Activity, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  todayPosts: number;
  todayComments: number;
  recentPosts: any[];
}

const DashboardTab: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, totalPosts: 0, totalComments: 0,
    todayPosts: 0, todayComments: 0, recentPosts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [usersRes, postsRes, commentsRes, todayPostsRes, todayCommentsRes, recentRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('comments').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('posts').select(`id, title, content, type, created_at, user_id`).order('created_at', { ascending: false }).limit(5)
      ]);

      let recentPosts = recentRes.data || [];
      const userIds = [...new Set(recentPosts.map((p: any) => p.user_id))].filter(Boolean);
      
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
          
          recentPosts = recentPosts.map((p: any) => ({
            ...p,
            profiles: profileMap[p.user_id] || { full_name: '익명', avatar_url: '' }
          }));
        }
      }

      setStats({
        totalUsers: usersRes.count || 0,
        totalPosts: postsRes.count || 0,
        totalComments: commentsRes.count || 0,
        todayPosts: todayPostsRes.count || 0,
        todayComments: todayCommentsRes.count || 0,
        recentPosts: recentPosts
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: <Users size={22} />, label: '전체 회원', value: stats.totalUsers, color: '#4CAF50', bg: '#E8F5E9' },
    { icon: <FileText size={22} />, label: '전체 게시글', value: stats.totalPosts, color: '#2196F3', bg: '#E3F2FD' },
    { icon: <MessageSquare size={22} />, label: '전체 댓글', value: stats.totalComments, color: '#FF9800', bg: '#FFF3E0' },
    { icon: <TrendingUp size={22} />, label: '오늘 게시글', value: stats.todayPosts, color: '#9C27B0', bg: '#F3E5F5' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <Activity size={28} className="animate-spin" color="var(--secondary-color)" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
        {statCards.map(card => (
          <div key={card.label} style={{
            backgroundColor: 'white', borderRadius: '18px', padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F0F0F0'
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: card.color, marginBottom: '12px'
            }}>
              {card.icon}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#333', marginBottom: '4px' }}>{card.value}</div>
            <div style={{ fontSize: '13px', color: '#9E9E9E', fontWeight: '600' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Today Activity */}
      <div style={{
        backgroundColor: 'white', borderRadius: '18px', padding: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F0F0F0',
        marginBottom: '28px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--secondary-color)" /> 오늘의 활동
        </h3>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{
            flex: 1, backgroundColor: '#FDF1E6', borderRadius: '14px', padding: '16px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--secondary-color)' }}>{stats.todayPosts}</div>
            <div style={{ fontSize: '12px', color: '#9E9E9E', fontWeight: '600', marginTop: '4px' }}>새 게시글</div>
          </div>
          <div style={{
            flex: 1, backgroundColor: '#E8F5E9', borderRadius: '14px', padding: '16px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#4CAF50' }}>{stats.todayComments}</div>
            <div style={{ fontSize: '12px', color: '#9E9E9E', fontWeight: '600', marginTop: '4px' }}>새 댓글</div>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div style={{
        backgroundColor: 'white', borderRadius: '18px', padding: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F0F0F0'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={18} color="var(--secondary-color)" /> 최근 게시글
        </h3>
        {stats.recentPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#BDBDBD', fontSize: '14px' }}>
            게시글이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.recentPosts.map((post: any) => (
              <div key={post.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', backgroundColor: '#FAFAFA', borderRadius: '12px'
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: post.type === 'discussion' ? '#2196F3' : 'var(--secondary-color)', flexShrink: 0
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {post.title || post.content?.slice(0, 30) || '제목 없음'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#BDBDBD', marginTop: '2px' }}>
                    {(post.profiles as any)?.full_name || '익명'} · {new Date(post.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: '700', color: post.type === 'discussion' ? '#2196F3' : 'var(--secondary-color)',
                  backgroundColor: post.type === 'discussion' ? '#E3F2FD' : '#FDF1E6',
                  padding: '3px 8px', borderRadius: '6px', flexShrink: 0
                }}>
                  {post.type === 'discussion' ? '토론' : '일기'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTab;
