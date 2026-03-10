import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, MapPin, Search, X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Cafe {
  id: string;
  name: string;
  address: string;
  image_url: string;
  description?: string;
  created_at?: string;
}

const CafesTab: React.FC = () => {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState<{ isOpen: boolean; cafe?: Cafe; isNew: boolean }>({ isOpen: false, isNew: false });
  const [formData, setFormData] = useState({ name: '', address: '', image_url: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    fetchCafes();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchCafes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCafes(data || []);
    } catch (err) {
      console.error('Error fetching cafes:', err);
      // If table doesn't exist, show empty
      setCafes([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', address: '', image_url: '', description: '' });
    setEditModal({ isOpen: true, isNew: true });
  };

  const openEditModal = (cafe: Cafe) => {
    setFormData({
      name: cafe.name,
      address: cafe.address,
      image_url: cafe.image_url || '',
      description: cafe.description || ''
    });
    setEditModal({ isOpen: true, cafe, isNew: false });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.address.trim()) return;
    setSaving(true);
    try {
      if (editModal.isNew) {
        const { error } = await supabase.from('cafes').insert({
          name: formData.name.trim(),
          address: formData.address.trim(),
          image_url: formData.image_url.trim(),
          description: formData.description.trim()
        });
        if (error) throw error;
        setToast({ type: 'success', message: '카페가 추가되었습니다! ☕' });
      } else if (editModal.cafe) {
        const { error } = await supabase.from('cafes')
          .update({
            name: formData.name.trim(),
            address: formData.address.trim(),
            image_url: formData.image_url.trim(),
            description: formData.description.trim()
          })
          .eq('id', editModal.cafe.id);
        if (error) throw error;
        setToast({ type: 'success', message: '카페 정보가 수정되었습니다! ✏️' });
      }
      setEditModal({ isOpen: false, isNew: false });
      fetchCafes();
    } catch (err) {
      console.error('Error saving cafe:', err);
      setToast({ type: 'error', message: '저장에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cafeId: string) => {
    if (!confirm('이 카페를 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('cafes').delete().eq('id', cafeId);
      if (error) throw error;
      setCafes(prev => prev.filter(c => c.id !== cafeId));
      setToast({ type: 'success', message: '카페가 삭제되었습니다.' });
    } catch (err) {
      console.error('Error deleting cafe:', err);
      setToast({ type: 'error', message: '삭제에 실패했습니다.' });
    }
  };

  const filteredCafes = cafes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <Loader2 size={28} className="animate-spin" color="var(--secondary-color)" />
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'success' ? '#4CAF50' : '#FF5252',
          color: 'white', padding: '12px 24px', borderRadius: '12px',
          fontSize: '14px', fontWeight: '700', zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}>
          {toast.message}
        </div>
      )}

      {/* Search & Add */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{
          flex: 1, position: 'relative', backgroundColor: 'white',
          borderRadius: '14px', border: '1px solid #F0F0F0'
        }}>
          <Search size={18} color="#BDBDBD" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text" placeholder="카페 검색..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', border: 'none', outline: 'none',
              padding: '14px 14px 14px 42px', borderRadius: '14px', fontSize: '14px'
            }}
          />
        </div>
        <button
          onClick={openAddModal}
          style={{
            backgroundColor: 'var(--secondary-color)', color: 'white',
            border: 'none', borderRadius: '14px', padding: '0 18px',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontWeight: '700', fontSize: '13px', cursor: 'pointer',
            whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(210,124,44,0.25)'
          }}
        >
          <Plus size={16} /> 추가
        </button>
      </div>

      {/* Cafe List */}
      {filteredCafes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#BDBDBD' }}>
          <MapPin size={48} color="#E0E0E0" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', fontWeight: '600' }}>등록된 카페가 없습니다.</p>
          <p style={{ fontSize: '13px' }}>새 카페를 추가해보세요!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredCafes.map(cafe => (
            <div key={cafe.id} style={{
              backgroundColor: 'white', borderRadius: '16px', padding: '16px',
              display: 'flex', alignItems: 'center', gap: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #F0F0F0'
            }}>
              <img
                src={cafe.image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=100'}
                alt={cafe.name}
                style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=100'; }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>{cafe.name}</div>
                <div style={{ fontSize: '12px', color: '#9E9E9E', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {cafe.address}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={() => openEditModal(cafe)}
                  style={{
                    background: '#F5F5F5', border: 'none', borderRadius: '10px',
                    padding: '8px', cursor: 'pointer', display: 'flex'
                  }}
                >
                  <Edit3 size={16} color="#555" />
                </button>
                <button
                  onClick={() => handleDelete(cafe.id)}
                  style={{
                    background: '#FFF5F5', border: 'none', borderRadius: '10px',
                    padding: '8px', cursor: 'pointer', display: 'flex'
                  }}
                >
                  <Trash2 size={16} color="#FF5252" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add Modal */}
      {editModal.isOpen && (
        <>
          <div
            onClick={() => setEditModal({ isOpen: false, isNew: false })}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: '480px', backgroundColor: 'white',
            borderRadius: '24px 24px 0 0', zIndex: 9999, padding: '24px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                {editModal.isNew ? '새 카페 추가' : '카페 정보 수정'}
              </h3>
              <X size={22} color="#9E9E9E" onClick={() => setEditModal({ isOpen: false, isNew: false })} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#555', marginBottom: '6px', display: 'block' }}>카페 이름 *</label>
                <input
                  type="text" placeholder="블루보틀 성수"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: '14px',
                    border: '1.5px solid #EDEDED', fontSize: '14px', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#555', marginBottom: '6px', display: 'block' }}>주소 *</label>
                <input
                  type="text" placeholder="서울 성동구 아차산로 7"
                  value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: '14px',
                    border: '1.5px solid #EDEDED', fontSize: '14px', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#555', marginBottom: '6px', display: 'block' }}>이미지 URL</label>
                <input
                  type="text" placeholder="https://..."
                  value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: '14px',
                    border: '1.5px solid #EDEDED', fontSize: '14px', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={!formData.name.trim() || !formData.address.trim() || saving}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px',
                  backgroundColor: formData.name.trim() && formData.address.trim() ? 'var(--secondary-color)' : '#E0E0E0',
                  color: 'white', border: 'none', fontWeight: '800', fontSize: '15px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  marginTop: '6px'
                }}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {editModal.isNew ? '카페 추가' : '수정 완료'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CafesTab;
