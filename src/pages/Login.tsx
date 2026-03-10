import React, { useState } from 'react';
import { Mail, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSignUpSuccess(true);
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || '인증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) setError(error.message);
  };

  const signInWithKakao = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="fade-in" style={{ 
      backgroundColor: '#FAF9F6', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '40px 24px'
    }}>
      {/* Background Image Card */}
      <div style={{ 
        position: 'relative', 
        height: '240px', 
        borderRadius: '32px', 
        overflow: 'hidden',
        marginBottom: '32px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
      }}>
        <img 
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800" 
          alt="Coffee Latte Art" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.3)' 
        }} />
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: 'white' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: 'white', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#111' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                </svg>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: '900' }}>드립닷컴</h1>
           </div>
           <p style={{ fontSize: '14px', fontWeight: '500', opacity: 0.9 }}>당신의 데일리 커피 저널.</p>
        </div>
      </div>

      {/* Welcome Section */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '32px', 
        padding: '32px 24px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>
          {isSignUp ? '시작하기' : '환영합니다'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px', textAlign: 'center' }}>
          {isSignUp ? '커피 여정의 첫 발을 내딛으세요' : '커피 여정을 계속하려면 로그인하세요'}
        </p>

        {signUpSuccess && (
          <div style={{ 
            backgroundColor: '#E8F5E9', 
            border: '1px solid #A5D6A7', 
            padding: '14px 16px', 
            borderRadius: '12px', 
            color: '#2E7D32', 
            fontSize: '13px', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600'
          }}>
            ✅ 회원가입 확인 메일을 보냈습니다. 이메일을 확인해주세요!
          </div>
        )}

        {error && (
          <div style={{ 
            backgroundColor: '#FFF5F5', 
            border: '1px solid #FFE3E3', 
            padding: '12px', 
            borderRadius: '12px', 
            color: '#E03131', 
            fontSize: '13px', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <input 
              type="email" 
              placeholder="이메일" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%',
                padding: '16px', 
                borderRadius: '16px', 
                border: '1px solid #EDEDED',
                fontSize: '15px',
                backgroundColor: '#F9F9F9'
              }}
            />
            <p style={{ fontSize: '11px', color: '#BDBDBD', marginTop: '4px', marginLeft: '4px' }}>예) aaa@example.com</p>
          </div>

          <div>
            <input 
              type="password" 
              placeholder="비밀번호" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%',
                padding: '16px', 
                borderRadius: '16px', 
                border: '1px solid #EDEDED',
                fontSize: '15px',
                backgroundColor: '#F9F9F9'
              }}
            />
            <p style={{ fontSize: '11px', color: '#BDBDBD', marginTop: '4px', marginLeft: '4px' }}>7자리 이상 입력해주세요.</p>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            style={{ 
              backgroundColor: isSignUp ? '#333' : 'var(--secondary-color)', 
              color: 'white', 
              border: 'none', 
              padding: '16px', 
              borderRadius: '16px', 
              fontSize: '17px', 
              fontWeight: '700',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: isSignUp ? '0 8px 16px rgba(0,0,0,0.1)' : '0 8px 16px rgba(210, 124, 44, 0.2)',
              marginTop: '12px',
              transition: 'all 0.3s'
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Mail size={20} />}
            {isSignUp ? '새 계정으로 가입하기' : '이메일 로그인'}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '24px 0', borderBottom: '1px solid #EDEDED' }}>
          <span style={{ 
            position: 'absolute', 
            top: '-10px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            backgroundColor: 'white', 
            padding: '0 12px', 
            fontSize: '13px', 
            color: '#BDBDBD',
            fontWeight: '500'
          }}>또는 소셜 로그인</span>
        </div>

        {/* Social Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={signInWithGoogle}
            style={{ 
              backgroundColor: 'white', 
              color: '#333', 
              border: '1px solid #EDEDED', 
              padding: '14px', 
              borderRadius: '16px', 
              fontSize: '15px', 
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px'
            }}>
            <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px' }} /> Google로 계속하기
          </button>

          <button 
            onClick={signInWithKakao}
            style={{ 
              backgroundColor: '#FEE500', 
              color: '#3C1E1E', 
              border: 'none', 
              padding: '14px', 
              borderRadius: '16px', 
              fontSize: '15px', 
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.47715 3 2 6.47715 2 10.75C2 13.5117 3.864 15.9377 6.64 17.304L5.61 21.0776C5.55 21.2976 5.67 21.5176 5.89 21.5776C5.95 21.5976 6.02 21.5976 6.08 21.5776L10.51 18.6176C11 18.7076 11.49 18.75 11.99 18.75C17.5128 18.75 22 15.2728 22 11C22 6.72715 17.5228 3.25 12 3.25V3Z" />
            </svg>
            카카오로 계속하기
          </button>
        </div>

        <p style={{ fontSize: '11px', color: '#BDBDBD', marginTop: '24px', textAlign: 'center', lineHeight: '1.6' }}>
          계속 진행하면 드립닷컴의 <span onClick={() => navigate('/terms')} style={{ color: 'var(--secondary-color)', fontWeight: '700', cursor: 'pointer' }}>이용약관</span> 및 <span onClick={() => navigate('/privacy')} style={{ color: 'var(--secondary-color)', fontWeight: '700', cursor: 'pointer' }}>개인정보 처리방침</span><br />
          에 동의하게 됩니다.
        </p>
      </div>

      <div style={{ marginTop: 'auto', textAlign: 'center', paddingTop: '40px', paddingBottom: '20px' }}>
         <p style={{ fontSize: '15px', color: '#757575', fontWeight: '500' }}>
            {isSignUp ? '이미 계정이 있으신가요?' : '아직 드립닷컴 계정이 없으신가요?'}
         </p>
         <button 
           onClick={() => {
             setIsSignUp(!isSignUp);
             setError(null);
           }}
           style={{ 
             backgroundColor: 'transparent',
             border: 'none',
             color: 'var(--secondary-color)', 
             fontWeight: '800', 
             fontSize: '16px',
             cursor: 'pointer',
             marginTop: '4px',
             textDecoration: 'underline'
           }}
         >
           {isSignUp ? '기존 계정으로 로그인하기' : '지금 바로 회원가입하기'}
         </button>
      </div>
    </div>
  );
};

export default Login;
