import React, { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // 관리자 로그인 성공 시 대시보드로 이동
      navigate('/admin/dashboard');
      
    } catch (err: any) {
      setError(err.message || '인증에 실패했습니다. 관리자 계정을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1E1E1E', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#2A2A2A',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid #404040'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Admin Portal</h1>
          <p style={{ color: '#9E9E9E', fontSize: '14px' }}>관리자 계정으로 로그인해주세요.</p>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: 'rgba(255, 82, 82, 0.1)', 
            border: '1px solid rgba(255, 82, 82, 0.3)',
            color: '#FF5252', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: '#E0E0E0', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              이메일
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9E9E9E' }}>
                <Mail size={20} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #333',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#E0E0E0', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              비밀번호
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9E9E9E' }}>
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #333',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45A049'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : '관리자 접속'}
          </button>
        </form>
        
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              background: 'none', border: 'none', color: '#9E9E9E', 
              fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' 
            }}
          >
            일반 서비스로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
