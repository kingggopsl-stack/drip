import React, { useState, useRef } from 'react';
import { X, Camera, ChevronRight, Plus, Moon, Zap, Loader2, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const WriteDiary: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const { user } = useAuth();
  const postType = state?.type || 'diary';
  const [text, setText] = useState(state?.text || '');
  const [title, setTitle] = useState(state?.title || '');
  const [category, setCategory] = useState(state?.category || '질문');
  const [caffeine, setCaffeine] = useState(state?.caffeine || 50);
  const [tags, setTags] = useState(state?.tags || ['#모닝커피', '#핸드드립', '#카푸치노']);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>(state?.images || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);
  const toastActiveRef = useRef(false);
  
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // From selection pages
  const selectedCafe = state?.selectedCafe;
  const selectedOrigins = state?.selectedOrigins || [];
  const fromRecommendation = state?.fromRecommendation || false;
  const recommendedBean = state?.recommendedBean || null;

  const categories = ['질문', '카페후기', '자유잡담'];

  const showToast = (type: 'success' | 'error', message: string) => {
    // Use ref for synchronous duplicate prevention (immune to StrictMode)
    if (toastActiveRef.current) return;
    toastActiveRef.current = true;
    setToast({ type, message });
    if (type === 'success') {
      setTimeout(() => { 
        setToast(null); 
        toastActiveRef.current = false;
        isProcessingRef.current = false;
        navigate(postType === 'discussion' ? '/discussion' : '/'); 
      }, 1500);
    } else {
      setTimeout(() => {
        setToast(null);
        toastActiveRef.current = false;
        isProcessingRef.current = false;
      }, 2500);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    const remainingSlots = 2 - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        if (file.size > 5 * 1024 * 1024) continue;
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage.from('post-images').upload(path, file);
        if (!error) {
          const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(data.path);
          uploadedUrls.push(urlData.publicUrl);
        } else {
          uploadedUrls.push(URL.createObjectURL(file));
        }
      }
      setImages(prev => [...prev, ...uploadedUrls]);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    // Immediate guard using ref (synchronous, immune to StrictMode)
    if (isProcessingRef.current || isSubmitting || toastActiveRef.current) return;
    isProcessingRef.current = true;
    
    if (!user) { isProcessingRef.current = false; return showToast('error', '로그인이 필요합니다.'); }
    if (!text.trim()) { isProcessingRef.current = false; return showToast('error', '내용을 입력해주세요.'); }

    setIsSubmitting(true);
    try {
      const categoryMap: Record<string, string> = {
        '질문': 'question',
        '카페후기': 'review',
        '자유잡담': 'chat'
      };
      const dbCategory = postType === 'discussion' ? categoryMap[category] || category : null;

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: text,
        title: title || (text.length > 20 ? text.substring(0, 20) + '...' : text),
        image_urls: images,
        type: postType,
        category: dbCategory,
        metadata: {
          cafe: selectedCafe,
          origins: selectedOrigins,
          caffeine: caffeine,
          tags: tags,
          ...(recommendedBean ? { recommendedBean } : {})
        }
      });
      if (error) throw error;
      showToast('success', '완료되었습니다! ☕');
    } catch (err: any) {
      showToast('error', '저장 실패: ' + err.message);
      isProcessingRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const tag = newTag.startsWith('#') ? newTag.trim() : `#${newTag.trim()}`;
      if (!tags.includes(tag)) {
        setTags((prev: string[]) => [...prev, tag]);
      }
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const handleNavigateToSelection = (path: string) => {
    navigate(path, { 
      state: { 
        ...state,
        type: postType,
        text,
        title,
        category,
        images,
        tags,
        caffeine,
        selectedCafe,
        selectedOrigins
      } 
    });
  };

  return (
    <div className="fade-in" style={{ backgroundColor: 'white', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px',
          backgroundColor: '#1A1A1A', color: 'white', padding: '14px 20px', borderRadius: '14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: '15px', fontWeight: '700'
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} color="#4CAF50" /> : <AlertCircle size={20} color="#FF4d4f" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="header" style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F0' }}>
        <X size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <h1 style={{ fontSize: '18px', fontWeight: '800' }}>
          {postType === 'discussion' ? '커뮤니티 글쓰기' : '일기 쓰기'}
        </h1>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{ color: '#D27C2C', background: 'none', border: 'none', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : '작성완료'}
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        {/* AI Recommended Bean Card */}
        {fromRecommendation && recommendedBean && (
          <div style={{
            marginBottom: '24px',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '2px solid #FDF1E6',
            backgroundColor: '#FFFCF8'
          }}>
            <div style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #D27C2C 0%, #E8A356 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>☕</span>
              <span style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>AI 추천 원두</span>
              <span style={{
                marginLeft: 'auto',
                backgroundColor: 'rgba(255,255,255,0.25)',
                color: 'white',
                padding: '2px 10px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                매칭 {recommendedBean.matchPercent}%
              </span>
            </div>
            <div style={{ padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <img
                src={recommendedBean.image}
                alt={recommendedBean.name}
                style={{ width: '72px', height: '72px', borderRadius: '14px', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '900', fontSize: '16px', marginBottom: '4px' }}>
                  {recommendedBean.flag} {recommendedBean.name}
                </div>
                <div style={{ fontSize: '13px', color: '#9E9E9E', marginBottom: '6px' }}>
                  {recommendedBean.origin} · {recommendedBean.roastLevel} · {recommendedBean.brewMethod}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {recommendedBean.flavorEmojis?.map((emoji: string, i: number) => (
                    <span key={i} style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      backgroundColor: '#FDF1E6',
                      color: '#8B5E2B',
                      fontWeight: '600'
                    }}>
                      {emoji} {recommendedBean.flavorNotes?.[i]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Category Select */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', color: '#757575', marginBottom: '12px', fontWeight: '600' }}>카테고리 선택</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: category === cat ? '#D27C2C' : '#F7F3EE',
                  color: category === cat ? 'white' : '#757575',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Title Input - Only for Community Posts */}
        {postType === 'discussion' && (
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '16px', fontSize: '17px', border: '1px solid #F0F0F0', borderRadius: '12px', fontWeight: '700', outline: 'none' }}
            />
          </div>
        )}

        {/* Text Area */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <textarea 
            placeholder={postType === 'discussion' ? "당신의 커피 철학이나 궁금한 점을 공유해주세요." : "커피에 대한 이야기를 들려주세요. 사진도 함께 올리면 더 좋아요!"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="write-textarea custom-placeholder"
            style={{ width: '100%', height: '240px', border: '1px solid #F0F0F0', borderRadius: '12px', padding: '16px', fontSize: '15px', resize: 'none', outline: 'none', lineHeight: '1.6' }}
          />
        </div>

        {/* Image Upload Area */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <Camera size={18} color="#D27C2C" fill="#D27C2C" /> 사진 추가
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple onChange={handleFileChange} />
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '80px', height: '80px', borderRadius: '12px', border: '2px dashed #EDEDED', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', backgroundColor: '#FDFDFD' }}
            >
              <Camera size={24} color="#BDBDBD" />
              <div style={{ fontSize: '10px', color: '#BDBDBD', marginTop: '4px' }}>업로드</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '12px', color: '#757575', fontWeight: '600' }}>사진 추가 가이드</div>
              <div style={{ fontSize: '11px', color: '#9E9E9E', marginTop: '2px', lineHeight: '1.4' }}>
                • 최대 5장 (파일당 10MB 이내)<br />
                • JPG, PNG, WEBP 지원
              </div>
            </div>
            {images.map((img, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img src={img} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
                <div 
                  onClick={() => setImages(images.filter((_: string, i: number) => i !== idx))}
                  style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#333', borderRadius: '50%', color: 'white', padding: '2px', cursor: 'pointer' }}
                >
                  <X size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {tags.map((tag: string, idx: number) => (
              <div key={idx} style={{ 
                backgroundColor: '#F5F5F5', 
                color: '#757575', 
                padding: '6px 12px', 
                borderRadius: '16px', 
                fontSize: '13px', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {tag}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setTags(tags.filter((_: string, i: number) => i !== idx))} />
              </div>
            ))}
            {showTagInput ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  autoFocus
                  type="text" 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="#태그입력"
                  style={{ border: '1px solid #D27C2C', borderRadius: '12px', padding: '4px 8px', fontSize: '13px', outline: 'none', width: '80px' }}
                />
                <CheckCircle size={18} color="#D27C2C" onClick={handleAddTag} style={{ cursor: 'pointer' }} />
              </div>
            ) : (
              <button 
                onClick={() => setShowTagInput(true)}
                style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  border: '1px solid #BDBDBD', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  color: '#BDBDBD',
                  background: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Cafe/Origin Quick Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', borderTop: '1px solid #F0F0F0', paddingTop: '24px' }}>
          <div onClick={() => handleNavigateToSelection('/select-cafe')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#F7F3EE', padding: '10px', borderRadius: '12px', color: '#D27C2C' }}>
                <StoreIcon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800' }}>{selectedCafe ? selectedCafe.name : '카페 선택'}</div>
                <div style={{ fontSize: '12px', color: '#BDBDBD' }}>{selectedCafe ? selectedCafe.address : '가까운 커피숍 검색'}</div>
              </div>
            </div>
            <ChevronRight size={20} color="#BDBDBD" />
          </div>

          <div onClick={() => handleNavigateToSelection('/select-origin')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#F7F3EE', padding: '10px', borderRadius: '12px', color: '#D27C2C' }}>
                 <CoffeeMachineIcon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800' }}>
                  {selectedOrigins.length > 0 ? selectedOrigins.map((o: any) => o.name).join(', ') : '원두 원산지'}
                </div>
                <div style={{ fontSize: '12px', color: '#BDBDBD' }}>선택 사항</div>
              </div>
            </div>
            <ChevronRight size={20} color="#BDBDBD" />
          </div>
        </div>

        {/* Toolbar Wrapper for Icons */}
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '100%', 
          maxWidth: '480px', 
          backgroundColor: '#F8F9FA', 
          padding: '12px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderTop: '1px solid #F0F0F0'
        }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <MapPin size={22} color="#757575" style={{ cursor: 'pointer' }} />
            <span onClick={() => handleNavigateToSelection('/select-cafe')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: '#757575' }}>@</span>
            </span>
            <span onClick={() => setShowTagInput(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: '#757575' }}>#</span>
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#BDBDBD' }}>최대 2000자</span>
        </div>
      </div>
    </div>
  );
};

const StoreIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CoffeeMachineIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 14h.01" /><path d="M10 14h.01" /><path d="M14 14h.01" /><path d="M18 14h.01" />
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

export default WriteDiary;
