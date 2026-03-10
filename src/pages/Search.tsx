import React from 'react';
import { Search as SearchIcon, Filter, MapPin, Star, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Search: React.FC = () => {
  const navigate = useNavigate();

  const mockCafes = [
    {
      id: 1,
      name: 'Blue Bottle Coffee',
      address: '300 S Broadway, Los Angeles',
      status: '인증됨',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=200',
      rating: 4.8
    },
    {
      id: 2,
      name: 'Verve Coffee Roasters',
      address: '833 W 3rd St, Los Angeles',
      status: '인증됨',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=200',
      rating: 4.7
    },
    {
      id: 3,
      name: 'Intelligentsia Coffee',
      address: '3922 Sunset Blvd, Los Angeles',
      status: '검토 중',
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=200',
      rating: 4.5
    }
  ];

  return (
    <div className="fade-in">
      <div className="header">
        <span>탐색</span>
        <Filter size={24} />
      </div>

      {/* Search Bar */}
      <div style={{ padding: '16px' }}>
        <div style={{ 
          height: '50px', 
          backgroundColor: '#FFFFFF', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 16px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
        }}>
          <SearchIcon size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="카페 이름, 위치 검색..." 
            style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '15px', outline: 'none', marginLeft: '10px' }} 
          />
        </div>

        {/* Categories / Tags */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['전체', '스페셜티', '베이커리', '로스터리', '공부하기 좋은'].map((tag, i) => (
            <span 
              key={tag} 
              style={{ 
                padding: '6px 14px', 
                borderRadius: '20px', 
                backgroundColor: i === 0 ? 'var(--primary-color)' : 'white', 
                color: i === 0 ? 'white' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '500',
                border: i === 0 ? 'none' : '1px solid var(--border-color)',
                whiteSpace: 'nowrap'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Cafe List */}
      <div style={{ padding: '0 16px 20px' }}>
        {mockCafes.map((cafe) => (
          <div 
            key={cafe.id} 
            onClick={() => navigate(`/cafe/${cafe.id}`)}
            style={{ 
              display: 'flex', 
              padding: '12px', 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              marginBottom: '12px', 
              border: '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
            <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
              <img src={cafe.image} alt={cafe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ marginLeft: '14px', flex: 1, position: 'relative' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{cafe.name}</h4>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px', color: 'var(--text-muted)', fontSize: '12px' }}>
                <MapPin size={12} style={{ marginRight: '4px' }} />
                {cafe.address}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ 
                  fontSize: '11px', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  backgroundColor: cafe.status === '인증됨' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(0,0,0,0.05)',
                  color: cafe.status === '인증됨' ? 'var(--success-color)' : 'var(--text-muted)',
                  fontWeight: '600'
                }}>
                  {cafe.status}
                </span>
                <div style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', color: '#FBC02D' }}>
                  <Star size={12} fill="#FBC02D" />
                  <span style={{ fontSize: '12px', fontWeight: '700', marginLeft: '4px', color: 'var(--text-color)' }}>{cafe.rating}</span>
                </div>
              </div>
              <div style={{ position: 'absolute', right: 0, top: 0, color: 'var(--text-muted)' }}>
                <MoreVertical size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
