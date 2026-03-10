import React, { useState } from 'react';
import { X, Search, MapPin, ChevronRight, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Cafe {
  id: string;
  name: string;
  address: string;
  imageUrl: string;
}

const CafeSelect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const [search, setSearch] = useState('');
  const [selectedCafe, setSelectedCafe] = useState<string | null>(null);

  const recentCafes: Cafe[] = [
    { id: '1', name: '블루보틀 성수', address: '서울 성동구 아차산로 7', imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=200' },
    { id: '2', name: '앤트러사이트 한남', address: '서울 용산구 이태원로 240', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=200' },
    { id: '3', name: '테라로사 포스코센터점', address: '서울 강남구 테헤란로 440', imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=200' },
  ];

  const popularCafes: Cafe[] = [
    { id: '4', name: '어니언 안국', address: '서울 종로구 계동길 5', imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=200' },
  ];

  const handleSelect = (cafeId: string) => {
    setSelectedCafe(cafeId);
  };

  const handleComplete = () => {
    const cafe = [...recentCafes, ...popularCafes].find(c => c.id === selectedCafe);
    navigate('/write', { 
      state: { 
        ...state, 
        selectedCafe: cafe 
      } 
    });
  };

  const filteredRecent = recentCafes.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPopular = popularCafes.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="header" style={{ backgroundColor: 'white', borderBottom: '1px solid #F0F0F0', padding: '16px 20px' }}>
        <X size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <h1 style={{ fontSize: '18px', fontWeight: '800', flex: 1, textAlign: 'center' }}>카페 선택</h1>
        <button 
          onClick={handleComplete}
          disabled={!selectedCafe}
          style={{ 
            color: selectedCafe ? '#D27C2C' : '#BDBDBD', 
            background: 'none', 
            border: 'none', 
            fontWeight: '800', 
            fontSize: '16px',
            cursor: selectedCafe ? 'pointer' : 'default'
          }}
        >
          완료
        </button>
      </div>

      <div style={{ padding: '20px', flex: 1 }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          <Search size={20} color="#BDBDBD" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="카페 이름을 검색하세요"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              backgroundColor: '#EFF1F5', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '14px 14px 14px 48px',
              fontSize: '15px',
              outline: 'none'
            }}
          />
        </div>

        {/* Section: Recent */}
        <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>최근 방문한 카페</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
          {filteredRecent.length === 0 ? (
             <div style={{ fontSize: '14px', color: '#BDBDBD', textAlign: 'center', padding: '20px' }}>검색 결과가 없습니다.</div>
          ) : filteredRecent.map(cafe => (
            <div key={cafe.id} onClick={() => handleSelect(cafe.id)} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <img src={cafe.imageUrl} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>{cafe.name}</div>
                <div style={{ fontSize: '13px', color: '#757575' }}>{cafe.address}</div>
              </div>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                border: selectedCafe === cafe.id ? '6px solid #D27C2C' : '2px solid #EDEDED',
                backgroundColor: 'white'
              }} />
            </div>
          ))}
        </div>

        {/* Section: Popular */}
        <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>인기 있는 주변 카페</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
          {filteredPopular.length === 0 ? (
             <div style={{ fontSize: '14px', color: '#BDBDBD', textAlign: 'center', padding: '20px' }}>검색 결과가 없습니다.</div>
          ) : filteredPopular.map(cafe => (
            <div key={cafe.id} onClick={() => handleSelect(cafe.id)} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <img src={cafe.imageUrl} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>{cafe.name}</div>
                <div style={{ fontSize: '13px', color: '#757575' }}>{cafe.address}</div>
              </div>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                border: selectedCafe === cafe.id ? '6px solid #D27C2C' : '2px solid #EDEDED',
                backgroundColor: 'white'
              }} />
            </div>
          ))}
        </div>

        {/* Add New Cafe */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <p style={{ fontSize: '14px', color: '#757575', marginBottom: '16px' }}>찾으시는 카페가 목록에 없나요?</p>
          <button style={{ 
            backgroundColor: '#F7EDEA', 
            color: '#D27C2C', 
            border: 'none', 
            borderRadius: '16px', 
            padding: '14px 24px', 
            fontSize: '15px', 
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <MapPin size={18} fill="#D27C2C" stroke="none" />
            새로운 카페 추가하기
          </button>
        </div>
      </div>

      {/* Bottom Button */}
      <div style={{ padding: '20px', backgroundColor: 'white', position: 'sticky', bottom: 0, borderTop: '1px solid #F0F0F0' }}>
        <button 
          onClick={handleComplete}
          disabled={!selectedCafe}
          style={{ 
            width: '100%', 
            backgroundColor: '#D27C2C', 
            color: 'white', 
            border: 'none', 
            borderRadius: '16px', 
            padding: '18px', 
            fontSize: '17px', 
            fontWeight: '800',
            opacity: selectedCafe ? 1 : 0.5,
            boxShadow: '0 4px 12px rgba(210, 124, 44, 0.2)'
          }}
        >
          이 카페로 일기 쓰기
        </button>
      </div>
    </div>
  );
};

export default CafeSelect;
