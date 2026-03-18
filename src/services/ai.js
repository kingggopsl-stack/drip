const API_URL = 'http://localhost:3001/generate-strategy';
// n8n Webhook URL (Placeholder - update with actual URL if available)
const N8N_WEBHOOK_URL = 'https://n8n.example.com/webhook/ad-brief-trigger';

/**
 * n8n 워크플로우를 트리거합니다.
 */
export const triggerN8nWorkflow = async (briefData) => {
  try {
    // Note: This might fail if the URL is a placeholder or if CORS is not configured on n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...briefData,
        timestamp: new Date().toISOString(),
        source: 'AD_AI_DASHBOARD'
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('n8n Trigger Error:', error);
    return false;
  }
};

/**
 * AI 서비스를 통해 마케팅 전략을 생성합니다.
 */
export const generateStrategy = async (briefData) => {
  // Trigger n8n in parallel (don't block the UI)
  triggerN8nWorkflow(briefData);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(briefData),
    });

    if (!response.ok) {
      let errorMsg = '백엔드 서버 응답 오류';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        // Fallback for non-JSON errors (like HTML 404/500)
        const text = await response.text();
        errorMsg = text.substring(0, 50) || errorMsg;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('전략 생성 오류:', error);
    throw new Error(
      error.message === 'Failed to fetch' 
        ? '백엔드 서버가 실행 중이지 않거나 연결할 수 없습니다. (Port 3001)' 
        : error.message
    );
  }
};
