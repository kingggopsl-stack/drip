import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Camera, X, MapPin, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastActiveRef = useRef(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    location: '',
    avatar_url: '',
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // DB에서 현재 프로필 로드
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, website')
        .eq('id', user.id)
        .single();

      if (data) {
        // website 컬럼을 위치용으로 사용 (or split "bio||location" 형태)
        const parts = (data.website || '').split('||');
        setForm({
          full_name: data.full_name || user?.user_metadata?.full_name || '',
          bio: parts[0] || '',
          location: parts[1] || '',
          avatar_url: data.avatar_url || user?.user_metadata?.avatar_url || '',
        });
        setPreviewAvatar(data.avatar_url || user?.user_metadata?.avatar_url || '');
      } else {
        setForm(prev => ({
          ...prev,
          full_name: user?.user_metadata?.full_name || '',
          avatar_url: user?.user_metadata?.avatar_url || '',
        }));
        setPreviewAvatar(user?.user_metadata?.avatar_url || '');
      }
    };
    loadProfile();
  }, [user]);

  // 사진 선택 시 미리보기 즉시 반영
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      // 5MB 초과 시 조용히 처리하거나 input 초기화
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setAvatarFile(file);
    setPreviewAvatar(URL.createObjectURL(file)); // 즉시 미리보기
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!user || isSaving || toastActiveRef.current) return;
    setIsSaving(true);
    try {
      let avatarUrl = form.avatar_url;

      // 새 사진이 선택된 경우 Storage에 업로드
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${user.id}_${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(path, avatarFile, { cacheControl: '3600', upsert: true });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(uploadData.path);
          avatarUrl = urlData.publicUrl;
        }
      }

      // profiles 테이블에 저장 (bio와 location을 website 컬럼에 합쳐서 저장)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          avatar_url: avatarUrl,
          website: `${form.bio}||${form.location}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        // 만약 update가 실패하면 (기록이 없는 경우) upsert 시도
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: form.full_name,
            avatar_url: avatarUrl,
            website: `${form.bio}||${form.location}`,
            updated_at: new Date().toISOString(),
          });
        if (upsertError) throw upsertError;
      }

      // Auth 메타데이터 프로필 동기화 (이름과 아바타)
      await supabase.auth.updateUser({
        data: { 
          full_name: form.full_name,
          avatar_url: avatarUrl 
        }
      });

      setSaved(true);
      toastActiveRef.current = true;
      setToast({ type: 'success', message: '프로필이 저장되었습니다! ✨' });
      // 중복 메시지 방지를 위해 alert(toast.message)가 다른 곳에 있는지 확인했으나, 
      // 이 컴포넌트에는 toast UI가 이미 있으므로 추가 alert는 불필요함.
      setTimeout(() => { toastActiveRef.current = false; navigate(-1); }, 1500);
    } catch (err: any) {
      console.error('Save failed:', err);
      toastActiveRef.current = true;
      setToast({ type: 'error', message: '저장 실패: ' + err.message });
      setTimeout(() => { toastActiveRef.current = false; }, 2500);
      // 여기서 alert(err.message)를 호출하지 않음으로써 중복 방지
    } finally {
      setIsSaving(false);
    }
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.full_name || '드립')}&background=F3E5D8&color=D27C2C&size=200`;

  return (
    <div className="fade-in" style={{ backgroundColor: '#FAF9F6', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: '56px',
        backgroundColor: 'white', borderBottom: '1px solid #F0F0F0',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <span style={{ fontWeight: '800', fontSize: '17px' }}>프로필 수정</span>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            background: 'none', border: 'none',
            color: saved ? '#4CAF50' : 'var(--secondary-color)',
            fontWeight: '800', fontSize: '16px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          {isSaving
            ? <Loader2 size={18} className="animate-spin" />
            : saved
              ? <><Check size={16} /> 완료</>
              : '저장'
          }
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px',
          backgroundColor: toast.type === 'success' ? '#1A1A1A' : '#FF4d4f',
          color: 'white', padding: '14px 20px', borderRadius: '14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: '15px', fontWeight: '700',
          maxWidth: '320px', width: 'calc(100% - 48px)'
        }}>
          {toast.type === 'success'
            ? <Check size={20} color="#4CAF50" />
            : <Loader2 size={20} className="animate-spin" color="white" />}
          {toast.message}
        </div>
      )}

      <div style={{ padding: '32px 24px' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '36px' }}>
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <div style={{
              width: '100px', height: '100px',
              borderRadius: '50%', overflow: 'hidden',
              border: '3px solid white',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
            }}>
              <img
                src={previewAvatar || defaultAvatar}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).src = defaultAvatar; }}
              />
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute', right: 0, bottom: 0,
                width: '32px', height: '32px',
                backgroundColor: 'var(--secondary-color)',
                borderRadius: '50%',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                border: '2.5px solid white',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(210,124,44,0.3)'
              }}
            >
              <Camera size={16} color="white" />
            </div>
          </div>
          <span
            style={{ fontSize: '13px', color: 'var(--secondary-color)', fontWeight: '600', cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
          >
            프로필 사진 변경
          </span>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/jpeg,image/png"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 닉네임 */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#9E9E9E', display: 'block', marginBottom: '8px' }}>
              닉네임
            </label>
            <div style={{
              backgroundColor: 'white',
              border: '1.5px solid #E0E0E0',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="닉네임을 입력하세요"
                style={{
                  border: 'none', background: 'transparent', flex: 1,
                  fontSize: '16px', outline: 'none', fontWeight: '600',
                  fontFamily: 'Pretendard, sans-serif'
                }}
              />
              {form.full_name && (
                <X
                  size={18}
                  color="#BDBDBD"
                  style={{ cursor: 'pointer', flexShrink: 0 }}
                  onClick={() => setForm({ ...form, full_name: '' })}
                />
              )}
            </div>
          </div>

          {/* 소개 */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#9E9E9E', display: 'block', marginBottom: '8px' }}>
              소개
            </label>
            <div style={{
              backgroundColor: 'white',
              border: '1.5px solid #E0E0E0',
              borderRadius: '14px',
              padding: '14px 18px'
            }}>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                maxLength={150}
                rows={4}
                placeholder="나를 소개해보세요"
                style={{
                  border: 'none', background: 'transparent', width: '100%',
                  fontSize: '15px', outline: 'none', resize: 'none',
                  fontFamily: 'Pretendard, sans-serif', lineHeight: '1.6'
                }}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#BDBDBD', fontWeight: '600' }}>
                {form.bio.length}/150
              </div>
            </div>
          </div>

          {/* 위치 */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#9E9E9E', display: 'block', marginBottom: '8px' }}>
              위치
            </label>
            <div style={{
              backgroundColor: 'white',
              border: '1.5px solid #E0E0E0',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: '12px',
              cursor: 'text'
            }}
              onClick={() => (document.getElementById('location-input') as HTMLInputElement)?.focus()}
            >
              <MapPin size={18} color="var(--secondary-color)" style={{ flexShrink: 0 }} />
              <input
                id="location-input"
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="도시를 입력하세요"
                style={{
                  border: 'none', background: 'transparent', flex: 1,
                  fontSize: '15px', outline: 'none',
                  fontFamily: 'Pretendard, sans-serif',
                  cursor: 'text'
                }}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            width: '100%', marginTop: '36px',
            padding: '17px',
            borderRadius: '18px',
            backgroundColor: saved ? '#4CAF50' : 'var(--secondary-color)',
            color: 'white', border: 'none',
            fontSize: '17px', fontWeight: '800',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
            boxShadow: '0 8px 20px rgba(210,124,44,0.2)',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {isSaving
            ? <><Loader2 size={20} className="animate-spin" /> 저장 중...</>
            : saved
              ? <><Check size={20} /> 저장 완료!</>
              : '저장하기'
          }
        </button>
      </div>
    </div>
  );
};

export default ProfileEdit;
