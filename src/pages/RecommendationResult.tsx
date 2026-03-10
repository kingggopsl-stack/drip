import React, { useMemo } from 'react';
import { ArrowLeft, Edit3, Coffee, Info, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getRecommendations, getRandomRecommendations, brewMethodLabels, getRoastDots, RecommendedBean } from '../utils/recommendEngine';

const RecommendationResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { answers, random, skipped } = (location.state as any) || {};

  const recommendations = useMemo<RecommendedBean[]>(() => {
    if (random || skipped || !answers) {
      return getRandomRecommendations();
    }
    return getRecommendations(answers);
  }, [answers, random, skipped]);

  const mainBean = recommendations[0];
  const altBeans = recommendations.slice(1);

  // 맛 프로파일은 메인 추천 원두 데이터에서 동적으로 생성
  const flavorProfile = [
    { label: '산미', value: mainBean.acidity.toFixed(1), percent: (mainBean.acidity / 5) * 100 },
    { label: '단맛', value: mainBean.sweetness.toFixed(1), percent: (mainBean.sweetness / 5) * 100 },
    { label: '쓴맛', value: mainBean.bitterness.toFixed(1), percent: (mainBean.bitterness / 5) * 100 },
    { label: '바디감', value: mainBean.body.toFixed(1), percent: (mainBean.body / 5) * 100 },
  ];

  // 맛 밸런스 레이블
  const getBalanceLabel = () => {
    const max = Math.max(mainBean.acidity, mainBean.sweetness, mainBean.bitterness, mainBean.body);
    if (max === mainBean.acidity) return '산미 중심';
    if (max === mainBean.sweetness) return '달콤함 중심';
    if (max === mainBean.bitterness) return '쓴맛 중심';
    if (max === mainBean.body) return '바디감 중심';
    return '균형잡힘';
  };

  // 추출방식 라벨 (1단계 답변 기반 또는 원두 기본)
  const brewLabel = answers?.[0] ? brewMethodLabels[answers[0]] : brewMethodLabels[mainBean.brewMethods[0]];

  const handleShareToDiary = () => {
    const flavorText = mainBean.flavorNotes.join(', ');
    navigate('/write', {
      state: {
        type: 'diary',
        fromRecommendation: true,
        recommendedBean: {
          name: mainBean.name,
          nameEn: mainBean.nameEn,
          origin: mainBean.region,
          roastLevel: mainBean.roastLabel,
          flavorNotes: mainBean.flavorNotes,
          flavorEmojis: mainBean.flavorEmojis,
          matchPercent: mainBean.matchPercent,
          image: mainBean.image,
          flag: mainBean.flag,
          brewMethod: brewLabel,
        },
        text: `☕ AI 추천 원두: ${mainBean.name}\n🌍 원산지: ${mainBean.flag} ${mainBean.region}\n🔥 로스팅: ${mainBean.roastLabel}\n🌸 플레이버: ${flavorText}\n📊 매칭 ${mainBean.matchPercent}%\n\n`,
        tags: ['#AI추천', `#${mainBean.name.split(' ').pop()}`, `#${brewLabel}`],
      }
    });
  };

  return (
    <div className="fade-in" style={{ backgroundColor: '#FAF9F6', minHeight: '100vh', paddingBottom: '120px' }}>
      {/* Header */}
      <div className="header" style={{ border: 'none', backgroundColor: 'transparent' }}>
        <ArrowLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <span style={{ fontWeight: '700', fontSize: '18px' }}>추천 결과</span>
        <button
          onClick={() => navigate('/recommend')}
          style={{ background: 'none', border: 'none', color: 'var(--secondary-color)', cursor: 'pointer' }}
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* AI Badge */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#FDF1E6',
            color: 'var(--secondary-color)',
            fontSize: '13px',
            fontWeight: '700',
            padding: '6px 16px',
            borderRadius: '20px',
            marginBottom: '10px'
          }}>
            ✨ AI 분석 완료
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '900' }}>오늘의 추천 커피</h1>
          <p style={{ color: '#9E9E9E', fontSize: '14px', marginTop: '6px' }}>
            {mainBean.matchPercent}% 일치하는 원두를 찾았어요!
          </p>
        </div>

        {/* Main Coffee Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          marginBottom: '20px'
        }}>
          {/* Main Image */}
          <div style={{ position: 'relative', height: '260px' }}>
            <img
              src={mainBean.image}
              alt={mainBean.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.style.background = 'linear-gradient(135deg, #D27C2C 0%, #E8A85F 100%)';
                (e.target as HTMLImageElement).parentElement!.innerHTML += '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:64px">☕</div>';
              }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)'
            }} />
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
              <div style={{
                display: 'inline-block',
                backgroundColor: 'var(--secondary-color)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                {mainBean.matchPercent}% 일치
              </div>
              <h2 style={{ color: 'white', fontSize: '26px', fontWeight: '900', lineHeight: '1.2' }}>
                {mainBean.flag} {mainBean.name}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '6px' }}>
                {mainBean.description}
              </p>
            </div>
          </div>

          {/* Brewing Info */}
          <div style={{ padding: '20px', borderBottom: '1px solid #F5F5F5' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#BDBDBD', marginBottom: '6px' }}>추출 방식</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '15px' }}>
                  <Coffee size={18} color="var(--secondary-color)" /> {brewLabel}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#BDBDBD', marginBottom: '6px' }}>로스팅 레벨</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '15px' }}>
                  {mainBean.roastLabel}
                  <div style={{ display: 'flex', gap: '3px', marginLeft: '4px' }}>
                    {getRoastDots(mainBean.roastLevel).map((active, i) => (
                      <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: active ? 'var(--secondary-color)' : '#F3E5D8' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flavor Tags */}
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', color: '#9E9E9E', fontWeight: '600', marginBottom: '12px' }}>플레이버 노트</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {mainBean.flavorEmojis.map((emoji, i) => (
                <span key={i} style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #EDEDED',
                  fontSize: '13px',
                  color: '#555',
                  backgroundColor: '#FAFAFA',
                  fontWeight: '600'
                }}>
                  {emoji} {mainBean.flavorNotes[i]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Taste Profile */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>맛 프로파일</h3>
            <span style={{
              fontSize: '12px', padding: '4px 10px',
              backgroundColor: '#FFF4E6', color: 'var(--secondary-color)',
              borderRadius: '8px', fontWeight: '700'
            }}>{getBalanceLabel()}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {flavorProfile.map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '48px', fontSize: '13px', color: '#757575', fontWeight: '600' }}>{item.label}</span>
                <div style={{ flex: 1, height: '8px', backgroundColor: '#F5F5F5', borderRadius: '4px', margin: '0 12px' }}>
                  <div style={{ width: `${item.percent}%`, height: '100%', backgroundColor: 'var(--secondary-color)', borderRadius: '4px', transition: 'width 0.8s' }} />
                </div>
                <span style={{ width: '28px', fontSize: '14px', fontWeight: '900', textAlign: 'right' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alternative Recommendations */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px' }}>다른 추천 원두</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {altBeans.map((rec, i) => (
              <div key={i} style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                border: '1px solid #F0F0F0'
              }}>
                <img
                  src={rec.image}
                  alt={rec.name}
                  style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', backgroundColor: '#F5F0EB' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.style.cssText = 'width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#D27C2C,#E8A85F);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0';
                    placeholder.innerText = '☕';
                    target.parentElement!.insertBefore(placeholder, target);
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', fontSize: '15px' }}>{rec.flag} {rec.name}</div>
                  <div style={{ fontSize: '13px', color: '#9E9E9E', marginTop: '3px' }}>
                    {rec.flavorNotes.slice(0, 3).join(', ')}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: '10px',
                  padding: '4px 10px',
                  fontSize: '13px',
                  fontWeight: '800',
                  color: '#555'
                }}>
                  {rec.matchPercent}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleShareToDiary}
            style={{
              width: '100%',
              height: '58px',
              borderRadius: '18px',
              backgroundColor: 'var(--secondary-color)',
              color: 'white',
              border: 'none',
              fontSize: '17px',
              fontWeight: '800',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 20px rgba(210, 124, 44, 0.25)',
              cursor: 'pointer'
            }}
          >
            <Edit3 size={20} /> 드립일기로 공유하기
          </button>
          <button
            onClick={() => navigate('/recommend')}
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '18px',
              backgroundColor: 'white',
              color: '#555',
              border: '1.5px solid #EDEDED',
              fontSize: '15px',
              fontWeight: '700',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={18} /> 다시 추천받기
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationResult;
