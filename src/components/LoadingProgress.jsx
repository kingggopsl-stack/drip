import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  AlertCircle, 
  RefreshCcw,
  Check,
  Lightbulb
} from 'lucide-react';

const STEPS = [
  { 
    id: 'researching', 
    label: 'Market Discovery', 
    title: '시장 및 브랜드 분석', 
    subtasks: ['Brand Audit', 'Competitor Landscape', 'Consumer Behavior', 'Trend Spotting'] 
  },
  { 
    id: 'synthesizing', 
    label: 'Strategic Synthesis', 
    title: '인사이트 합성 및 전략 도출', 
    subtasks: ['Data Triangulation', 'Winning Insight Extraction', 'Strategy Framework Design'] 
  },
  { 
    id: 'generating', 
    label: 'Creative Execution', 
    title: '제안서 초안 작성', 
    subtasks: ['Storyboarding', 'Slide Copywriting', 'Visual Direction'] 
  },
];

const LoadingProgress = ({ jobId, onComplete, onError }) => {
  const [jobInfo, setJobInfo] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const fetchJobStatus = useCallback(async () => {
    const { data } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (data) {
      setJobInfo(data);
      if (data.status === 'done' && data.final_proposal) {
        onComplete(data.final_proposal);
      }
    }
  }, [jobId, onComplete]);

  useEffect(() => {
    let isMounted = true;
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    // Initial fetch
    const initFetch = async () => {
      if (isMounted) await fetchJobStatus();
    };
    initFetch();

    // Subscribe to Realtime changes
    const subscription = supabase
      .channel(`job-status-${jobId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'generation_jobs',
        filter: `id=eq.${jobId}`
      }, (payload) => {
        if (!isMounted) return;
        const newData = payload.new;
        setJobInfo(newData);
        if (newData.status === 'done' && newData.final_proposal) {
          onComplete(newData.final_proposal);
        } else if (newData.status === 'error') {
          onError(newData.error_message);
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      clearInterval(timer);
      subscription.unsubscribe();
    };
  }, [jobId, fetchJobStatus, onComplete, onError]);

  const currentStatus = jobInfo?.status || 'pending';
  const isDone = currentStatus === 'done';
  const isError = currentStatus === 'error';

  return (
    <div className="container flex items-center justify-center py-20" style={{ minHeight: '90vh' }}>
      <div className="dashboard-card w-full animate-fade-in" style={{ maxWidth: '800px', padding: '4rem' }}>
        {isError ? (
          <div className="flex flex-col items-center gap-8 py-10">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
              <AlertCircle size={48} />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3">전략 생성 도중 에러가 발생했습니다</h2>
              <p className="text-slate-500 mb-8">{jobInfo?.error_message || '해당 기능을 일시적으로 사용할 수 없습니다.'}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="tag-btn selected py-3 px-8 text-lg"
            >
              <RefreshCcw size={20} /> 다시 시도하기
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black tracking-widest text-slate-400 uppercase mb-6">
                <div className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-pulse"></div>
                AI Strategic Engine Processing
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                AI 전략 에이전트 가동 중
              </h1>
              <p className="text-slate-400 font-medium">
                최적의 마케팅 전략을 위해 데이터를 다각도로 분석하고 있습니다 <br/>
                <span className="text-accent-primary mt-2 inline-block">분석 진행 시간: {elapsed}초</span>
              </p>
            </div>

            <div className="relative space-y-12">
              {/* Vertical line connector */}
              <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-100"></div>

              {STEPS.map((step, idx) => {
                const stepIndex = STEPS.findIndex(s => s.id === currentStatus);
                const isCompleted = isDone || (stepIndex !== -1 && idx < stepIndex);
                const isActive = !isDone && (stepIndex !== -1 && idx === stepIndex);

                return (
                  <div key={step.id} className={`relative flex gap-10 transition-all duration-500 ${isActive ? 'scale-105' : 'opacity-60'}`}>
                    {/* Step Marker */}
                    <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      isCompleted ? 'bg-green-500 text-white shadow-lg' : 
                      isActive ? 'bg-slate-900 text-white shadow-2xl scale-125' : 
                      'bg-white border-2 border-slate-100 text-slate-300'
                    }`}>
                      {isCompleted ? <Check size={24} strokeWidth={3} /> : isActive ? <Loader2 size={24} className="animate-spin" /> : <Circle size={10} fill="currentColor" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${isActive ? 'text-accent-primary' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                          <h3 className={`text-xl font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.title}
                          </h3>
                        </div>
                        {isCompleted && (
                          <span className="text-[10px] font-black py-1 px-3 bg-green-50 text-green-600 rounded-full">CHECKED</span>
                        )}
                      </div>

                      {/* Subtasks with staggered appearance */}
                      {(isActive || isCompleted) && (
                        <div className="grid grid-cols-2 gap-3 animate-fade-in">
                          {step.subtasks.map((sub, sIdx) => (
                            <div 
                              key={sub} 
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                isCompleted ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-white border-slate-50 text-slate-400'
                              }`}
                              style={{ animationDelay: `${sIdx * 0.1}s` }}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-100 text-green-500' : 'bg-slate-50 text-slate-200'}`}>
                                <Check size={12} strokeWidth={4} />
                              </div>
                              <span className="text-xs font-bold leading-none">{sub}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-20 p-6 rounded-3xl bg-slate-900 text-white flex items-center gap-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                <Lightbulb size={120} />
              </div>
              <div className="w-12 h-12 bg-accent-primary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                <Lightbulb size={24} />
              </div>
              <div className="relative z-10">
                <p className="text-xs text-white/50 font-black tracking-widest uppercase mb-1">Expert System Tip</p>
                <p className="text-sm font-medium leading-relaxed">
                  유사한 성공 사례 및 수주 패턴을 실시간 분석하여 <span className="text-accent-primary font-bold">통계적 우위가 증명된 마케팅 프레임워크</span>를 우선적으로 제안 구조에 반영하고 있습니다.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoadingProgress;
