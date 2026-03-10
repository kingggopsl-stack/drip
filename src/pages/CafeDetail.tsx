import React from 'react';
import { ChevronLeft, Edit, Trash2, MapPin, Star, Clock, ChevronRight, Heart } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const CafeDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="fade-in">
      {/* Visual Header */}
      <div style={{ position: 'relative', width: '100%', height: '240px' }}>
        <img 
          src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000" 
          alt="Cafe Interior" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)' 
        }} />
        
        {/* Top Controls */}
        <div style={{ 
          position: 'absolute', 
          top: '16px', 
          left: '16px', 
          right: '16px', 
          display: 'flex', 
          justifyContent: 'space-between',
          color: 'white'
        }}>
          <ChevronLeft size={24} onClick={() => navigate(-1)} />
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
              <Edit size={18} style={{ marginRight: '4px' }} /> 수정
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
              <Trash2 size={18} style={{ marginRight: '4px' }} /> 삭제
            </div>
          </div>
        </div>

        {/* Title Info */}
        <div style={{ position: 'absolute', bottom: '24px', left: '20px', color: 'white' }}>
          <span style={{ 
            fontSize: '11px', 
            padding: '2px 8px', 
            borderRadius: '4px', 
            backgroundColor: 'rgba(210, 124, 44, 0.4)',
            color: 'white',
            fontWeight: '600'
          }}>
            스페셜티 로스터
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginTop: '6px' }}>블루보틀 커피</h1>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px', opacity: '0.8', fontSize: '13px' }}>
            <MapPin size={14} style={{ marginRight: '4px' }} /> 아오야마, 도쿄
          </div>
        </div>

        <div style={{ 
          position: 'absolute', 
          bottom: '24px', 
          right: '20px', 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          padding: '4px 10px', 
          borderRadius: '12px',
          color: '#FBC02D',
          display: 'flex',
          alignItems: 'center',
          fontSize: '14px',
          fontWeight: '700'
        }}>
          <Star size={14} fill="#FBC02D" style={{ marginRight: '4px' }} /> 4.8
        </div>
      </div>

      {/* Stats Section */}
      <div className="card" style={{ marginTop: '-20px', position: 'relative', zIndex: '10' }}>
        <p style={{ fontSize: '14px', color: '#4A3728', lineHeight: '1.6' }}>
          싱글 오리진 원두와 정성스럽게 내린 드립 커피로 유명한 스페셜티 커피 로스터입니다. 
          완벽한 한 잔을 찾는 커피 애호가들의 안식처입니다.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px', color: '#8C7E74', fontSize: '13px' }}>
          <Clock size={16} style={{ marginRight: '8px' }} />
          <span>영업 중 • 오전 8:00 - 오후 6:00</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '800' }}>128</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>일기</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '800' }}>3.2k</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>방문</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '800' }}>Top 10</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>랭킹</div>
          </div>
        </div>
      </div>

      {/* Linked Diart Feed */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>연결된 드립일기</h3>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            View All <ChevronRight size={16} />
          </div>
        </div>

        {[
          { title: '모닝 푸어 오버', time: '2시간 전', likes: 24, user: '사라 J.', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=200' },
          { title: '콜드 브루 시즌', time: '1일 전', likes: 156, user: '마이크 R.', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=200' }
        ].map((item, i) => (
          <div 
            key={i} 
            style={{ 
              display: 'flex', 
              padding: '12px', 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              marginBottom: '12px', 
              border: '1px solid var(--border-color)' 
            }}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
              <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ marginLeft: '12px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{item.title}</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.time}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>에티오피아 예가체프를 맛보았습니다. 정말 꽃향기가 나고...</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#D27C2C', marginRight: '6px' }}></div>
                  <span style={{ fontSize: '11px', fontWeight: '500' }}>{item.user}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#E91E63', display: 'flex', alignItems: 'center' }}>
                  <Heart size={12} fill="#E91E63" style={{ marginRight: '4px' }} /> {item.likes}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CafeDetail;
