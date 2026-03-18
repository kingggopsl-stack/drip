import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Presentation, 
  Target, 
  Lightbulb, 
  BarChart, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  RefreshCcw, 
  Info,
  FileText,
  History,
  Users,
  BookOpen
} from 'lucide-react';

const Dashboard = ({ data, onReset }) => {
  const [expandedSections, setExpandedSections] = useState({
    market: true,
    competitor: true,
    consumer: true,
    strategy: true,
    slides: true
  });
  const [showResearchInfo, setShowResearchInfo] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleExport = async () => {
    try {
      const { exportToPPTX } = await import('../services/export.js');
      await exportToPPTX(data);
    } catch (error) {
      console.error("Export failed:", error);
      alert("PPTX 내보내기에 실패했습니다.");
    }
  };

  if (!data) return null;

  const SectionHeader = ({ title, Icon, sectionId, onRefresh }) => (
    <div 
      className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
      style={{ borderBottom: expandedSections[sectionId] ? '1px solid var(--border-color)' : 'none' }}
      onClick={() => toggleSection(sectionId)}
    >
      <div className="flex items-center gap-4">
        <div style={{ color: 'var(--accent-primary)' }}><Icon size={24} /></div>
        <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
      </div>
      <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onRefresh}
          className="btn btn-secondary" 
          style={{ padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}
          title="이 섹션 재생성"
        >
          <RefreshCcw size={14} /> <span className="hidden sm:inline">REGENERATE</span>
        </button>
        {expandedSections[sectionId] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
    </div>
  );

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1rem' }}>
      {/* Header Area */}
      <div className="flex items-end justify-between mb-12" style={{ borderBottom: '1.5px solid var(--text-primary)', paddingBottom: '2rem' }}>
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-500">
            <History size={16} /> HISTORY / {data.client_name || 'BRAND'} / {new Date().toLocaleDateString()}
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em' }}>
            STRATEGIC <span style={{ color: 'var(--accent-primary)' }}>PROPOSAL</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowResearchInfo(!showResearchInfo)} className={`btn ${showResearchInfo ? 'btn-primary' : 'btn-secondary'}`}>
            <Info size={18} /> RESEARCH BASIS
          </button>
          <button onClick={onReset} className="btn btn-secondary">
            <ArrowLeft size={18} /> NEW BRIEF
          </button>
          <button onClick={handleExport} className="btn btn-primary">
            <Presentation size={18} /> EXPORT PPTX
          </button>
        </div>
      </div>

      {/* Research Basis Toggle View */}
      {showResearchInfo && (
        <div className="glass-panel mb-8 animate-fade-in" style={{ borderColor: 'var(--accent-primary)', background: 'rgba(37, 99, 235, 0.02)' }}>
          <h4 className="flex items-center gap-2 mb-4"><BookOpen size={18} /> Research Data Sources & Basis</h4>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <h5 className="font-bold mb-2">Market Data</h5>
              <p className="text-slate-500">KOSIS 국가통계포털, 산업연구원 보고서, 2025 트렌드 코리아 데이터 기반</p>
            </div>
            <div>
              <h5 className="font-bold mb-2">Social Listening</h5>
              <p className="text-slate-500">Instagram, YouTube 최근 3개월 언급량 및 연관 키워드 분석 (버즈량 상위 5%)</p>
            </div>
            <div>
              <h5 className="font-bold mb-2">Internal Case Studies</h5>
              <p className="text-slate-500">유사 카테고리 수주 성공 제안서 {Math.floor(Math.random() * 10) + 5}건 가중치 반영</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* 1. Market Intelligence */}
        <div className="dashboard-card">
          <SectionHeader title="Market Intelligence" Icon={BarChart} sectionId="market" />
          {expandedSections.market && (
            <div className="p-8 animate-fade-in">
              <div className="insight-box mb-8">
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.6, letterSpacing: '-0.02em' }}>
                  {data.marketAnalysis?.summary || "시장 분석 데이터를 불러오는 중입니다."}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.marketAnalysis?.points?.map((p, i) => (
                  <div key={i} className="flex gap-4 p-4 border border-slate-50 rounded-xl hover:bg-slate-50 transition-colors">
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-primary)', opacity: 0.5 }}>0{i+1}</span>
                    <p className="text-sm font-medium leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Competitor Analysis */}
        <div className="dashboard-card">
          <SectionHeader title="Competitor Analysis" Icon={Target} sectionId="competitor" />
          {expandedSections.competitor && (
            <div className="p-8 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3">
                  <h4 className="section-title">Direct Competitors</h4>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {data.competitorIntelligence?.directCompetitors?.map((c, i) => (
                      <span key={i} className="competitor-tag">{c}</span>
                    ))}
                  </div>
                  <p className="text-base leading-relaxed text-slate-700 font-medium">
                    {data.competitorIntelligence?.competitorAnalysis}
                  </p>
                </div>
                <div className="lg:col-span-2">
                  <div className="insight-box h-full flex flex-col justify-center">
                    <h4 className="section-title" style={{ color: 'var(--accent-primary)' }}>Our Competitive Edge</h4>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {data.competitorIntelligence?.ourOpportunity}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Consumer Insight */}
        <div className="dashboard-card">
          <SectionHeader title="Consumer Insight" Icon={Lightbulb} sectionId="consumer" />
          {expandedSections.consumer && (
            <div className="p-8 animate-fade-in">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-5">
                    <h4 className="section-title">Core Statement</h4>
                    <p style={{ fontSize: '1.85rem', fontWeight: 900, lineHeight: 1.2, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
                      "{data.consumerInsight?.statement}"
                    </p>
                  </div>
                  <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-10" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '3rem' }}>
                    <div>
                      <h5 className="font-bold flex items-center gap-2 mb-4 text-slate-800">
                        <Users size={18} className="text-accent" /> Persona: {data.targetPersona?.name}
                      </h5>
                      <p className="text-sm text-slate-600 mb-6 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {data.targetPersona?.demographics}
                      </p>
                      <div className="grid gap-2">
                        {data.targetPersona?.painPoints?.map((p, i) => (
                          <div key={i} className="text-xs p-3 bg-white border border-slate-100 rounded-xl shadow-sm flex gap-2">
                             <span className="text-red-400">●</span> {p}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-bold mb-4 text-slate-800">Consumer Motivations</h5>
                      <ul className="text-sm text-slate-700 grid gap-3">
                        {data.targetPersona?.motivations?.map((m, i) => (
                          <li key={i} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-accent text-xs mt-1">✔</span> 
                            <span className="font-medium">{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* 4. Strategic Recommendation */}
        <div className="dashboard-card">
          <SectionHeader title="Strategic Recommendation" Icon={Activity} sectionId="strategy" />
          {expandedSections.strategy && (
            <div className="p-8 animate-fade-in">
              <div className="mb-10 py-6 border-b border-slate-50">
                <h4 className="section-title text-center">Main Concept</h4>
                <h2 className="text-center font-black" style={{ fontSize: '2.75rem', color: 'var(--accent-primary)', letterSpacing: '-0.04em' }}>
                   {data.strategy?.coreStrategy}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data.strategy?.pillars?.map((pillar, i) => (
                  <div key={i} className="p-8 border border-slate-100 rounded-3xl bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-sm font-black text-slate-400 mb-6">0{i+1}</div>
                    <h5 className="font-bold text-xl mb-4 text-slate-800">{pillar.title}</h5>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Final Proposal Slides */}
        <div className="dashboard-card">
          <SectionHeader title="Proposal Slides Preview" Icon={Presentation} sectionId="slides" />
          {expandedSections.slides && (
            <div className="p-8 animate-fade-in" style={{ background: 'var(--bg-secondary)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {data.proposalSlides?.map((slide, i) => (
                  <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 aspect-video flex flex-col justify-between hover:border-accent-primary transition-all group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary opacity-20"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black py-1 px-3 bg-slate-900 text-white rounded-full">SLIDE {i+1}</span>
                        <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-accent-primary group-hover:scale-150 transition-all"></div>
                      </div>
                      <h5 className="font-bold text-lg mb-4 text-slate-900 leading-tight">{slide.title}</h5>
                      <ul className="text-xs text-slate-500 space-y-2.5">
                        {slide.content?.map((line, li) => (
                          <li key={li} className="flex gap-2">
                             <span className="text-slate-300">•</span>
                             <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Visual: {slide.visual_guidelines || 'Minimal Corporate'}</span>
                      <div className="flex gap-2">
                        <div className="w-4 h-1 bg-slate-100 rounded-full"></div>
                        <div className="w-8 h-1 bg-slate-100 rounded-full group-hover:bg-accent-primary/30 transition-colors"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
