import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Building2, 
  Target, 
  Users, 
  MessageSquare, 
  Hash,
  Instagram,
  Youtube,
  Search,
  Monitor,
  CheckCircle2
} from 'lucide-react';

const CATEGORIES = [
  '뷰티/화장품', '식음료(F&B)', 'IT/가전', '금융/보험', 
  '패션/잡화', '라이프스타일', '게임', '엔터테인먼트'
];

const CHANNELS = [
  { id: 'instagram', name: 'Instagram', icon: <Instagram size={24} /> },
  { id: 'youtube', name: 'YouTube', icon: <Youtube size={24} /> },
  { id: 'naver', name: 'Naver', icon: <Search size={24} /> },
  { id: 'display', name: 'Display Ads', icon: <Monitor size={24} /> },
  { id: 'tiktok', name: 'TikTok', icon: <Hash size={24} /> },
  { id: 'facebook', name: 'Facebook', icon: <MessageSquare size={24} /> },
];

const TARGET_TAGS = [
  'Z세대', '밀레니얼', 'X세대', '부모님', '직장인', '학생', '1인가구', '얼리어답터'
];

const BriefForm = ({ onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    brandName: '',
    category: '',
    objective: '',
    budget: 50, // 1~100 (억원)
    targetAge: '2030',
    targetGender: 'all',
    targetTags: [],
    channels: [],
    additionalRequest: '',
    referenceUrls: ''
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      targetTags: prev.targetTags.includes(tag) 
        ? prev.targetTags.filter(t => t !== tag)
        : [...prev.targetTags, tag]
    }));
  };

  const toggleChannel = (channelId) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter(id => id !== channelId)
        : [...prev.channels, channelId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const steps = [
    { id: 1, label: 'Client', icon: <Building2 size={18} /> },
    { id: 2, label: 'Goal', icon: <Target size={18} /> },
    { id: 3, label: 'Target', icon: <Users size={18} /> },
    { id: 4, label: 'Channels', icon: <Hash size={18} /> },
    { id: 5, label: 'Details', icon: <Sparkles size={18} /> },
  ];

  return (
    <div className="container" style={{ padding: '4rem 1rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel w-full" style={{ maxWidth: '800px' }}>
        
        {/* Wizard Steps Header */}
        <div className="wizard-steps">
          {steps.map((step) => (
            <div key={step.id} className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
              <div className="step-dot">
                {currentStep > step.id ? <CheckCircle2 size={24} /> : step.id}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: 클라이언트 기본 정보 */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="mb-8 flex items-center gap-4">
                <Building2 className="text-accent" /> 브랜드 및 카테고리 설정
              </h2>
              <div className="form-group">
                <label className="form-label">CLIENT / BRAND NAME</label>
                <input
                  type="text"
                  name="brandName"
                  className="form-control"
                  placeholder="예: 갤럭시, 나이키, 보그"
                  value={formData.brandName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">CATEGORY</label>
                <select 
                  name="category" 
                  className="form-control"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">카테고리 선택</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: 캠페인 목표 */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h2 className="mb-8 flex items-center gap-4">
                <Target className="text-accent" /> 캠페인 목표 및 예산
              </h2>
              <div className="form-group">
                <label className="form-label">CAMPAIGN OBJECTIVE</label>
                <textarea
                  name="objective"
                  className="form-control"
                  placeholder="브랜드 인지도 증대, 신제품 출시 알림, 매출 극대화 등"
                  value={formData.objective}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">BUDGET RANGE (약 {formData.budget}억원)</label>
                <input
                  type="range"
                  name="budget"
                  min="1"
                  max="100"
                  className="w-full"
                  style={{ accentColor: 'var(--text-primary)' }}
                  value={formData.budget}
                  onChange={handleChange}
                />
                <div className="flex justify-between mt-2 text-sm">
                  <span>1억 미만</span>
                  <span>100억 이상</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 타겟 설정 */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h2 className="mb-8 flex items-center gap-4">
                <Users className="text-accent" /> 핵심 타겟 페르소나
              </h2>
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="form-group">
                  <label className="form-label">AGE GROUP</label>
                  <select name="targetAge" className="form-control" value={formData.targetAge} onChange={handleChange}>
                    <option value="1020">10-20대</option>
                    <option value="2030">20-30대</option>
                    <option value="3040">30-40대</option>
                    <option value="4050">40대 이상</option>
                    <option value="all">전 연령층</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">GENDER</label>
                  <select name="targetGender" className="form-control" value={formData.targetGender} onChange={handleChange}>
                    <option value="all">전체</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">TARGET TAGS</label>
                <div className="tags-container">
                  {TARGET_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-btn ${formData.targetTags.includes(tag) ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 채널 선택 */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h2 className="mb-8 flex items-center gap-4">
                <Hash className="text-accent" /> 미디어 전략 채널
              </h2>
              <div className="selection-grid">
                {CHANNELS.map(channel => (
                  <div
                    key={channel.id}
                    className={`selection-card ${formData.channels.includes(channel.id) ? 'selected' : ''}`}
                    onClick={() => toggleChannel(channel.id)}
                  >
                    {channel.icon}
                    <span style={{ fontWeight: 600 }}>{channel.name}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-center">제안서에 포함될 핵심 채널을 복수 선택해 주세요.</p>
            </div>
          )}

          {/* Step 5: 상세 요청 */}
          {currentStep === 5 && (
            <div className="animate-fade-in">
              <h2 className="mb-8 flex items-center gap-4">
                <Sparkles className="text-accent" /> 추가 요청 및 레퍼런스
              </h2>
              <div className="form-group">
                <label className="form-label">ADDITIONAL REQUESTS</label>
                <textarea
                  name="additionalRequest"
                  className="form-control"
                  placeholder="꼭 강조해야 할 포인트나 피해야 할 경쟁사 등을 입력해 주세요."
                  value={formData.additionalRequest}
                  onChange={handleChange}
                  style={{ minHeight: '120px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">REFERENCE URLS</label>
                <input
                  type="text"
                  name="referenceUrls"
                  className="form-control"
                  placeholder="참고할만한 캠페인이나 경쟁사 URL (쉼표로 구분)"
                  value={formData.referenceUrls}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 gap-4">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="btn btn-secondary" style={{ flex: 1 }}>
                <ArrowLeft size={20} /> PREVIOUS
              </button>
            )}
            
            {currentStep < 5 ? (
              <button 
                type="button" 
                onClick={nextStep} 
                className="btn btn-primary" 
                style={{ flex: 1, marginLeft: currentStep === 1 ? 'auto' : '0' }}
                disabled={currentStep === 1 && !formData.brandName}
              >
                NEXT STEP <ArrowRight size={20} />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                GENERATE PROPOSAL <ArrowRight size={20} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default BriefForm;
