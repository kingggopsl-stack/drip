import React, { useState } from 'react';
import BriefForm from './components/BriefForm';
import Dashboard from './components/Dashboard';
import LoadingProgress from './components/LoadingProgress';
import { supabase } from './services/supabase';

function App() {
  const [step, setStep] = useState('form'); // 'form' | 'loading' | 'dashboard'
  const [currentJobId, setCurrentJobId] = useState(null);
  const [strategyData, setStrategyData] = useState(null);

  const handleGenerate = async (briefData) => {
    setStep('loading');
    
    try {
      // 1. Create a job in Supabase
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      const { data, error } = await supabase
        .from('generation_jobs')
        .insert([{
          user_id: userId,
          status: 'researching', // Start with researching
          input_briefing: briefData
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCurrentJobId(data.id);

      // 2. Trigger the actual generation (Backend logic)
      const { generateStrategy } = await import('./services/ai.js');
      console.log('--- Triggering Strategy Generation ---');
      console.log('Using Job ID:', data.id);
      
      const result = await generateStrategy({
        ...briefData,
        job_id: data.id // Pass the job_id to the generic strategy function
      });
      
      // 3. Update job as done (Normally handled by backend/edge function)
      await supabase
        .from('generation_jobs')
        .update({ 
          status: 'done', 
          final_proposal: result,
          research_result: result.marketAnalysis, // Simulated
          synthesis_result: result.strategy      // Simulated
        })
        .eq('id', data.id);

    } catch (error) {
      handleError(error);
    }
  };

  const handleComplete = (finalData) => {
    setStrategyData(finalData);
    setStep('dashboard');
  };

  const handleError = (error) => {
    console.error('--- AD_AI Error Intercepted ---');
    console.error('Error Details:', error);
    
    let displayMsg = error.message || '알 수 없는 오류가 발생했습니다.';
    if (displayMsg.includes('Invalid API Key')) {
      displayMsg = '[Supabase 설정 오류] Supabase Anon Key가 유효하지 않거나 잘려있습니다. .env 파일을 확인해 주세요.';
    }
    
    alert(displayMsg);
    setStep('form');
  };

  const handleReset = () => {
    setStrategyData(null);
    setCurrentJobId(null);
    setStep('form');
  };

  return (
    <div className="app-container">
      {step === 'form' && (
        <BriefForm onSubmit={handleGenerate} />
      )}
      
      {step === 'loading' && currentJobId && (
        <LoadingProgress 
          jobId={currentJobId} 
          onComplete={handleComplete} 
          onError={handleError} 
        />
      )}

      {step === 'dashboard' && strategyData && (
        <Dashboard data={strategyData} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
