import React, { useState, useEffect } from 'react';
import { Search, Shield, ShieldOff, Loader2, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  email?: string;
  website?: string;
  role?: string;
  created_at?: string;
}

const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setToast({ type: 'error', message: '유저 목록을 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMessage = newRole === 'admin' 
      ? '이 사용자를 관리자로 지정하시겠습니까?' 
      : '이 사용자의 관리자 권한을 해제하시겠습니까?';
      
    if (!window.confirm(confirmMessage)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      setToast({ type: 'success', message: '권한이 변경되었습니다. ✅' });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      setToast({ type: 'error', message: '권한 변경에 실패했습니다.' });
    }
  };

  const filteredUsers = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <Loader2 size={28} className="animate-spin" color="var(--secondary-color)" />
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'success' ? '#4CAF50' : '#FF5252',
          color: 'white', padding: '12px 24px', borderRadius: '12px',
          fontSize: '14px', fontWeight: '700', zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}>
          {toast.message}
        </div>
      )}

      {/* Search */}
      <div style={{
        position: 'relative', backgroundColor: 'white', borderRadius: '14px',
        border: '1px solid #F0F0F0', marginBottom: '20px'
      }}>
        <Search size={18} color="#BDBDBD" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text" placeholder="이름 또는 이메일 검색..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', border: 'none', outline: 'none',
            padding: '14px 14px 14px 42px', borderRadius: '14px', fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* User Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#555' }}>
          전체 {filteredUsers.length}명
        </span>
        <span style={{ fontSize: '12px', color: '#BDBDBD' }}>
          관리자 {filteredUsers.filter(u => u.role === 'admin').length}명
        </span>
      </div>

      {/* User List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredUsers.map((u) => (
          <div key={u.id} style={{
            backgroundColor: 'white', padding: '16px', borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #F0F0F0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <img
                src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'U')}&background=F3E5D8&color=D27C2C&size=80`}
                alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=U&background=F3E5D8&color=D27C2C&size=80`; }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: '800', fontSize: '14px' }}>{u.full_name || '이름 없음'}</span>
                  {u.role === 'admin' && (
                    <span style={{
                      backgroundColor: '#FFF0F0', color: '#FF5252', padding: '2px 6px',
                      borderRadius: '6px', fontSize: '10px', fontWeight: '800'
                    }}>
                      관리자
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#9E9E9E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email || 'ID: ' + u.id.slice(0, 8)}
                </div>
                {u.created_at && (
                  <div style={{ fontSize: '11px', color: '#BDBDBD', marginTop: '2px' }}>
                    가입: {new Date(u.created_at).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => handleRoleChange(u.id, u.role || 'user')}
              style={{
                backgroundColor: u.role === 'admin' ? '#F5F5F5' : 'var(--secondary-color)',
                color: u.role === 'admin' ? '#757575' : 'white',
                border: 'none', padding: '8px 14px', borderRadius: '10px',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
                whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              {u.role === 'admin' ? <><ShieldOff size={14} /> 해제</> : <><Shield size={14} /> 관리자</>}
            </button>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#BDBDBD' }}>
            <User size={48} color="#E0E0E0" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '15px', fontWeight: '600' }}>
              {search ? '검색 결과가 없습니다.' : '가입한 유저가 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersTab;
