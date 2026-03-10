import React, { useState } from 'react';
import { ChevronLeft, Search, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Origin {
  id: string;
  name: string;
  region: 'africa' | 'america' | 'asia';
  flag: string;
}

const OriginSelect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const [search, setSearch] = useState('');
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>(state?.selectedOrigins?.map((o: any) => o.id) || []);

  const origins: Origin[] = [
    { id: 'ethiopia', name: '에티오피아', region: 'africa', flag: '🇪🇹' },
    { id: 'kenya', name: '케냐', region: 'africa', flag: '🇰🇪' },
    { id: 'rwanda', name: '르완다', region: 'africa', flag: '🇷🇼' },
    { id: 'colombia', name: '콜롬비아', region: 'america', flag: '🇨🇴' },
    { id: 'brazil', name: '브라질', region: 'america', flag: '🇧🇷' },
    { id: 'guatemala', name: '과테말라', region: 'america', flag: '🇬🇹' },
    { id: 'indonesia', name: '인도네시아', region: 'asia', flag: '🇮🇩' },
    { id: 'vietnam', name: '베트남', region: 'asia', flag: '🇻🇳' },
  ];

  const toggleOrigin = (id: string) => {
    setSelectedOrigins(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    const selectedList = origins.filter(o => selectedOrigins.includes(o.id));
    navigate('/write', { 
      state: { 
        ...state,
        selectedOrigins: selectedList 
      } 
    });
  };

  const filteredOrigins = origins.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const africa = filteredOrigins.filter(o => o.region === 'africa');
  const america = filteredOrigins.filter(o => o.region === 'america');
  const asia = filteredOrigins.filter(o => o.region === 'asia');

  return (
    <div className="fade-in" style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="header" style={{ backgroundColor: 'white', borderBottom: '1px solid #F0F0F0', padding: '16px 20px' }}>
        <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <h1 style={{ fontSize: '18px', fontWeight: '800', flex: 1, textAlign: 'center' }}>원산지 선택</h1>
        <div style={{ width: '24px' }} />
      </div>

      <div style={{ padding: '20px', flex: 1 }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          <Search size={20} color="#BDBDBD" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="국가 또는 지역 검색"
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

        {/* Origins List */}
        {[
          { title: '아프리카 (AFRICA)', data: africa },
          { title: '중남미 (CENTRAL/SOUTH AMERICA)', data: america },
          { title: '아시아 (ASIA)', data: asia }
        ].map(section => (
          <div key={section.title} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: '800', color: '#D27C2C', marginBottom: '12px' }}>{section.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {section.data.map(origin => (
                <div 
                  key={origin.id} 
                  onClick={() => toggleOrigin(origin.id)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '16px', 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    border: '1px solid #F0F0F0'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{origin.flag}</span>
                  <span style={{ flex: 1, fontSize: '16px', fontWeight: '600' }}>{origin.name}</span>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    border: selectedOrigins.includes(origin.id) ? 'none' : '2px solid #EDEDED',
                    backgroundColor: selectedOrigins.includes(origin.id) ? '#D27C2C' : 'transparent',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {selectedOrigins.includes(origin.id) && <Check size={14} color="white" strokeWidth={4} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Button */}
      <div style={{ padding: '20px', backgroundColor: 'white', position: 'sticky', bottom: 0, borderTop: '1px solid #F0F0F0' }}>
        <button 
          onClick={handleComplete}
          disabled={selectedOrigins.length === 0}
          style={{ 
            width: '100%', 
            backgroundColor: '#D27C2C', 
            color: 'white', 
            border: 'none', 
            borderRadius: '16px', 
            padding: '18px', 
            fontSize: '17px', 
            fontWeight: '800',
            opacity: selectedOrigins.length > 0 ? 1 : 0.5,
            boxShadow: '0 4px 12px rgba(210, 124, 44, 0.2)'
          }}
        >
          {selectedOrigins.length}개의 원산지 선택 완료
        </button>
      </div>
    </div>
  );
};

export default OriginSelect;
