import React, { useState } from 'react';
import { ArrowLeft, Shuffle, Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const questions = [
  {
    step: 1,
    title: '평소 어떤 방식으로\n커피를 추천하시나요?',
    subtitle: '주로 마시는 방식을 선택해주세요',
    type: 'image-grid',
    options: [
      { id: 'hand_drip', label: '핸드드립', emoji: '☕', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400' },
      { id: 'espresso', label: '에스프레소', emoji: '⚡', image: 'https://images.unsplash.com/photo-1510972527921-ce03766a1cf1?q=80&w=400' },
      { id: 'cold_brew', label: '콜드브루', emoji: '🧊', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=400' },
      { id: 'capsule', label: '캡슐머신', emoji: '🎯', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400' },
    ]
  },
  {
    step: 2,
    title: '선호하는 맛 강도는\n어느 정도인가요?',
    subtitle: '산미와 쓴맛 중 취향을 선택해주세요',
    type: 'taste-slider',
    options: [
      { id: 'bright', label: '🌟 밝은 산미', desc: '과일향, 화사함' },
      { id: 'balanced', label: '⚖️ 균형 잡힌 맛', desc: '산미와 쓴맛의 조화' },
      { id: 'bold', label: '💪 강한 바디감', desc: '진하고 묵직한 맛' },
      { id: 'sweet', label: '🍫 달콤한 뒷맛', desc: '카라멜, 초콜릿 향' },
    ]
  },
  {
    step: 3,
    title: '오늘 커피를 마실\n상황은 어떤가요?',
    subtitle: '상황에 맞는 원두를 추천해드려요',
    type: 'chips',
    options: [
      { id: 'morning', label: '☀️ 아침 기상', desc: '하루 시작' },
      { id: 'study', label: '📚 공부·집중', desc: '집중력 향상' },
      { id: 'relax', label: '🌿 여유·휴식', desc: '편안한 시간' },
      { id: 'social', label: '👥 모임·대화', desc: '함께하는 시간' },
      { id: 'after_meal', label: '🍽️ 식후 디저트', desc: '달콤한 마무리' },
      { id: 'workout', label: '💪 운동 전후', desc: '카페인 충전' },
    ]
  },
  {
    step: 4,
    title: '카페인 민감도는\n어느 정도인가요?',
    subtitle: '몸에 맞는 카페인 양을 알려주세요',
    type: 'level',
    options: [
      { id: 'decaf', label: '디카페인', desc: '카페인 없음' },
      { id: 'low', label: '약한 카페인', desc: '싱글 샷 수준' },
      { id: 'medium', label: '보통 카페인', desc: '더블 샷 수준' },
      { id: 'high', label: '강한 카페인', desc: '에스프레소 압축' },
    ]
  },
  {
    step: 5,
    title: '선호하는\n원두 원산지는?',
    subtitle: '특별히 좋아하는 산지가 있으신가요?',
    type: 'origin',
    options: [
      { id: 'ethiopia', label: '에티오피아', desc: '꽃향기, 과일맛', flag: '🇪🇹' },
      { id: 'colombia', label: '콜롬비아', desc: '밸런스, 견과류', flag: '🇨🇴' },
      { id: 'brazil', label: '브라질', desc: '초콜릿, 낮은 산미', flag: '🇧🇷' },
      { id: 'guatemala', label: '과테말라', desc: '스파이시, 풍부한 향', flag: '🇬🇹' },
      { id: 'any', label: '상관없어요', desc: 'AI가 추천!', flag: '🤖' },
    ]
  }
];

const Recommendation: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const current = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleSelect = (optionId: string) => {
    const newAnswers = { ...answers, [step]: optionId };
    setAnswers(newAnswers);
    setTimeout(() => {
      if (step < questions.length - 1) {
        setStep(step + 1);
      } else {
        navigate('/recommend/result', { state: { answers: newAnswers } });
      }
    }, 300);
  };

  return (
    <div className="fade-in" style={{ backgroundColor: '#FAF9F6', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="header" style={{ border: 'none', backgroundColor: 'transparent' }}>
        <ArrowLeft size={24} onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} style={{ cursor: 'pointer' }} />
        <span style={{ fontWeight: '700', fontSize: '18px' }}>AI 커피 추천</span>
        <button
          onClick={() => navigate('/recommend/result', { state: { answers, skipped: true } })}
          style={{ background: 'none', border: 'none', color: 'var(--secondary-color)', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}
        >
          건너뛰기
        </button>
      </div>

      <div style={{ padding: '0 24px' }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#BDBDBD', fontWeight: '600' }}>
              {step + 1} / {questions.length} 단계
            </span>
            <span style={{ fontSize: '13px', color: 'var(--secondary-color)', fontWeight: '700' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#EBEBEB', borderRadius: '3px' }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: 'var(--secondary-color)',
              borderRadius: '3px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Question */}
        <div style={{ margin: '28px 0 32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '900', lineHeight: '1.3', marginBottom: '10px', whiteSpace: 'pre-line' }}>
            {current.title}
          </h1>
          <p style={{ color: '#9E9E9E', fontSize: '15px' }}>{current.subtitle}</p>
        </div>

        {/* Options */}
        {current.type === 'image-grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {current.options.map((opt) => (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                style={{
                  position: 'relative',
                  height: '160px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: answers[step] === opt.id ? '3px solid var(--secondary-color)' : '3px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <img src={(opt as any).image} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />
                <div style={{ position: 'absolute', bottom: '14px', left: '14px', color: 'white' }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{opt.emoji}</div>
                  <div style={{ fontSize: '15px', fontWeight: '800' }}>{opt.label}</div>
                </div>
                {answers[step] === opt.id && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'var(--secondary-color)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={14} color="white" strokeWidth={3} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {(current.type === 'taste-slider' || current.type === 'level') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {current.options.map((opt) => (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                style={{
                  padding: '18px 20px',
                  borderRadius: '16px',
                  backgroundColor: answers[step] === opt.id ? '#FDF1E6' : 'white',
                  border: answers[step] === opt.id ? '2px solid var(--secondary-color)' : '1.5px solid #EDEDED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>{opt.label}</div>
                  <div style={{ fontSize: '13px', color: '#9E9E9E' }}>{opt.desc}</div>
                </div>
                {answers[step] === opt.id
                  ? <div style={{ backgroundColor: 'var(--secondary-color)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} color="white" strokeWidth={3} /></div>
                  : <ChevronRight size={20} color="#BDBDBD" />
                }
              </div>
            ))}
          </div>
        )}

        {current.type === 'chips' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {current.options.map((opt) => (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                style={{
                  padding: '14px 20px',
                  borderRadius: '30px',
                  backgroundColor: answers[step] === opt.id ? 'var(--secondary-color)' : 'white',
                  color: answers[step] === opt.id ? 'white' : '#333',
                  border: answers[step] === opt.id ? '2px solid var(--secondary-color)' : '1.5px solid #EDEDED',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{opt.label}</span>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>{opt.desc}</span>
              </div>
            ))}
          </div>
        )}

        {current.type === 'origin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {current.options.map((opt) => (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  backgroundColor: answers[step] === opt.id ? '#FDF1E6' : 'white',
                  border: answers[step] === opt.id ? '2px solid var(--secondary-color)' : '1.5px solid #EDEDED',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '28px' }}>{(opt as any).flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '800' }}>{opt.label}</div>
                  <div style={{ fontSize: '13px', color: '#9E9E9E', marginTop: '2px' }}>{opt.desc}</div>
                </div>
                {answers[step] === opt.id && (
                  <div style={{ backgroundColor: 'var(--secondary-color)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={16} color="white" strokeWidth={3} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Random Button */}
        <button
          onClick={() => navigate('/recommend/result', { state: { answers, random: true } })}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: 'white',
            border: '1.5px solid #EDEDED',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            fontSize: '15px',
            fontWeight: '700',
            color: '#555',
            marginTop: '24px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <Shuffle size={18} /> AI 랜덤 추천 받기
        </button>
      </div>
    </div>
  );
};

export default Recommendation;
