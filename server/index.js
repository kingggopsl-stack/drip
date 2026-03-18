const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('--- Server Startup Diagnostic ---');
console.log('Current working directory:', process.cwd());
console.log('.env file path:', path.join(__dirname, '.env'));
console.log('Supabase URL:', process.env.SUPABASE_URL ? 'FOUND' : 'NOT FOUND');
console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 6)}...` : 'NOT FOUND');
console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 8)}...` : 'NOT FOUND');
console.log('-----------------------------------');

const app = express();
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const port = process.env.PORT || 3001;

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper: Generate Embedding
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// Helper: Call Gemini API
async function generateGeminiStrategy(prompt) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`Calling Gemini API with model: ${model}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  if (data.error) {
    console.error('Gemini API responded with error:', JSON.stringify(data.error, null, 2));
    throw new Error(data.error.message || 'Gemini API key is invalid or quota exceeded.');
  }

  if (!data.candidates || !data.candidates[0]) {
    console.error('Gemini API Error Detail (No content):', JSON.stringify(data, null, 2));
    throw new Error('Gemini API: No candidates returned. Check content safety or prompt.');
  }
  
  // Clean up JSON response if it contains markdown markers
  let text = data.candidates[0].content.parts[0].text;
  text = text.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
  return JSON.parse(text);
}

// Helper: Call OpenAI API (Fallback)
async function generateOpenAIStrategy(prompt) {
  console.log('Calling OpenAI API (Fallback) with model: gpt-4o-mini');
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a professional advertising agency strategy planner. Respond in Korean." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });
  return JSON.parse(response.choices[0].message.content);
}

app.post('/generate-strategy', async (req, res) => {
  console.log('--- New Strategy Generation Request ---');
  try {
    const { 
      brandName, 
      category, 
      objective, 
      budget, 
      targetAge,
      targetGender,
      targetTags,
      channels,
      additionalRequest,
      referenceUrls,
      job_id // 클라이언트에서 전달받은 job_id
    } = req.body;

    const brand = brandName;
    const targetAudience = `${targetAge} ${targetGender} (${targetTags?.join(', ')})`;
    const fullBrief = `${objective} ${additionalRequest} ${referenceUrls}`;

    // Helper to update job status
    const updateJob = async (status, result = null) => {
      if (!job_id) return;
      const updateData = { status, updated_at: new Date().toISOString() };
      if (result) {
        if (status === 'researching') updateData.research_result = result;
        if (status === 'synthesizing') updateData.synthesis_result = result;
        if (status === 'done') updateData.final_proposal = result;
      }
      await supabase.from('generation_jobs').update(updateData).eq('id', job_id);
    };

    // 1. Update status: Researching
    await updateJob('researching');

    // 2. Generate brief text for embedding
    const briefText = `${brand} ${category} ${objective} ${targetAudience} ${channels} ${fullBrief}`;
    const embedding = await generateEmbedding(briefText);

    // 2. Search similar documents in Supabase
    const { data: similarDocs, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 3,
    });

    if (searchError) console.error('Supabase Search Error:', searchError);

    // 3. Construct prompt with reference documents
    let context = "";
    if (similarDocs && similarDocs.length > 0) {
      context = "\n참고할 유사한 과거 제안서 사례:\n" + similarDocs.map(doc => `- [${doc.title}]: ${doc.content}`).join('\n');
    }

    // Update status: Synthesizing
    await updateJob('synthesizing');

    const prompt = `
당신은 대한민국 최고의 종합광고대행사(제일기획, TBWA, HS애드 등) 출신의 시니어 전략 디렉터입니다. 
단순한 정보 요약이 아니라, 광고주를 설득하여 '수주'할 수 있는 압도적인 논리와 통찰력(Insight)이 담긴 제안서 전략을 수립해야 합니다.

[미션]
광고주 브리프의 표면적 요구사항을 넘어, 시장의 숨겨진 기회와 소비자의 미충족 욕구(Unmet Needs)를 발견하고 이를 해결하는 'One-Voice' 전략을 도출하십시오.

[브리프 데이터]
- 브랜드: ${brand}
- 카테고리: ${category}
- 캠페인 목표: ${objective}
- 타겟: ${targetAudience}
- 가용 예산: ${budget}억원대
- 선호 채널: ${Array.isArray(channels) ? channels.join(', ') : channels}
- 특이 사항: ${additionalRequest || '없음'}

${context}

[전략 수립 원칙]
1. 3C 분석(Customer, Competitor, Company)을 통해 현재 브랜드가 처한 가장 치명적인 'Problem'을 정의할 것.
2. 분석 데이터와 전략 사이의 'Logical Leap(통찰력 있는 비약)'을 보여줄 것. (단순 데이터 나열 금지)
3. 소비자의 Pain Point를 건드리는 한 문장의 'Killer Insight'를 도출할 것.
4. 모든 실행 방안은 핵심 전략(Core Strategy)을 일관되게 지지해야 함.

[반드시 준수해야 할 JSON 구조 및 가이드라인]
{
  "marketAnalysis": {
    "summary": "시장 내 브랜드의 현재 위치와 위기/기회 요인 총평 (전문적인 용어 사용)",
    "points": [
      "거시적 시장 트렌드와 데이터에 기반한 분석 1",
      "카테고리 내 소비자 행동 패턴의 변화 2",
      "브랜드가 직면한 핵심 당면 과제 3"
    ]
  },
  "competitorIntelligence": {
    "directCompetitors": ["주요 경쟁사 A", "주요 경쟁사 B"],
    "competitorAnalysis": "경쟁사의 캠페인 문법 분석 및 그들이 놓치고 있는 빈틈(White Space) 정의",
    "ourOpportunity": "우리가 선점해야 할 단 하나의 포지셔닝(Winning Point)"
  },
  "targetPersona": {
    "name": "타겟의 라이프스타일을 대변하는 페르소나 네이밍",
    "demographics": "상세 타겟 프로필",
    "painPoints": ["타겟이 해당 카테고리에서 느끼는 심리적/실체적 불편함 1", "불편함 2"],
    "motivations": ["행동을 이끌어낼 수 있는 강력한 동인 1", "동인 2"]
  },
  "consumerInsight": {
    "statement": "소비자의 무릎을 탁 치게 만드는 발견 (예: '~라고 생각했는데, 사실은 ~였다')",
    "implication": "이 인사이트가 브랜드에게 주는 전략적 의미와 해결책"
  },
  "strategy": {
    "coreStrategy": "캠페인을 관통하는 하나의 슬로건 또는 컨셉 키워드 (임팩트 중시)",
    "pillars": [
      { "title": "Awareness 전략", "description": "브랜드를 어떻게 각인시킬 것인가에 대한 구체적 방법론" },
      { "title": "Experience 전략", "description": "소비자 접점에서 어떤 경험을 줄 것인가" },
      { "title": "Conversion 전략", "description": "실제 구매 또는 전환으로 이끄는 장치" }
    ],
    "mediaMix": "Target-Tailored 미디어 운영 전략 및 채널별 역할(Role of Channel)"
  },
  "proposalSlides": [
    { "title": "Why now?", "content": ["지금 이 캠페인이 필요한 시급성", "데이터로 증명하는 시장의 결핍"], "visual_guidelines": "신뢰감을 주는 데이터 중심의 레이아웃" },
    { "title": "Winning Insight", "content": ["소비자 분석을 통해 발견한 핵심 인사이트", "경쟁사와 차별화되는 기회 요인"], "visual_guidelines": "인상적인 타이포그래피와 강렬한 이미지" },
    { "title": "The Concept", "content": ["새로운 브랜드 캠페인 슬로건 공개", "컨셉의 배경과 의미"], "visual_guidelines": "브랜드 컬러를 강조한 시네마틱 디자인" },
    { "title": "Action Plan (Phase 1)", "content": ["확산을 위한 메이저 채널 공략법", "초기 붐업을 위한 핵심 액션"], "visual_guidelines": "에너제틱하고 확산감이 느껴지는 비주얼" },
    { "title": "Creative Execution", "content": ["메인 영상 또는 키 비주얼의 구상", "소비자 참여 유도 방안"], "visual_guidelines": "실제 결과물을 상상하게 하는 무드보드 형태" }
  ],
  "kpi": {
    "primary": "캠페인 성공을 정의하는 메인 지표 (예: 브랜드 노출 1,000만건 이상)",
    "secondaryMetrics": ["인지도 상승률 %", "소셜 버즈량", "매출 전환 예상치"]
  }
}

무조건 유효한 JSON 객체로만 출력하십시오. 설명문은 제거하고 JSON 데이터만 응답하세요.
`;

    // Update status: Generating
    await updateJob('generating');

    let strategy;
    try {
      strategy = await generateGeminiStrategy(prompt);
    } catch (geminiError) {
      console.warn('Gemini API failed, attempting OpenAI fallback:', geminiError.message);
      try {
        strategy = await generateOpenAIStrategy(prompt);
      } catch (openaiError) {
        console.error('Both API providers failed.');
        throw new Error(`AI generation failed. (Gemini: ${geminiError.message}, OpenAI: ${openaiError.message})`);
      }
    }

    // Update status: Done
    await updateJob('done', strategy);

    // --- Database Storage (Supabase Relationships) ---
    try {
      // 1. Save Client Brief
      const { data: brief, error: briefError } = await supabase
        .from('client_briefs')
        .insert([{
          brand_name: brand,
          category,
          budget: `${budget}억원대`,
          target_audience: targetAudience,
          campaign_objective: objective,
          channels: Array.isArray(channels) ? channels : [channels],
          raw_data: req.body
        }])
        .select()
        .single();
      
      if (!briefError && brief) {
        const briefId = brief.id;

        // 2. Save Market & Consumer Data
        await supabase.from('market_data').insert([{
          brief_id: briefId,
          market_trends: strategy.marketAnalysis
        }]);

        await supabase.from('consumer_data').insert([{
          brief_id: briefId,
          demographics: strategy.targetPersona
        }]);

        // 3. Save Competitor Intelligence (with embedding)
        const compText = `${strategy.competitorIntelligence.directCompetitors?.join(', ')}: ${strategy.competitorIntelligence.competitorAnalysis}`;
        const compEmbedding = await generateEmbedding(compText);
        await supabase.from('competitor_ads').insert([{
          brief_id: briefId,
          competitor_name: strategy.competitorIntelligence.directCompetitors?.[0] || 'N/A',
          ad_copy: strategy.competitorIntelligence.competitorAnalysis,
          embedding: compEmbedding
        }]);

        // 4. Save Insights (with embedding)
        const insightEmbedding = await generateEmbedding(strategy.consumerInsight.statement);
        const { data: insightData, error: insightError } = await supabase
          .from('insights')
          .insert([{
            brief_id: briefId,
            core_insight: strategy.consumerInsight.statement,
            implication: strategy.consumerInsight.implication,
            embedding: insightEmbedding
          }])
          .select()
          .single();

        if (!insightError && insightData) {
          // 5. Save Strategy (referencing insight)
          const { data: stratData, error: stratError } = await supabase
            .from('strategies')
            .insert([{
              brief_id: briefId,
              insight_id: insightData.id,
              core_strategy: strategy.strategy.coreStrategy,
              strategy_pillars: strategy.strategy.pillars,
              media_mix: { plans: strategy.strategy.mediaMix },
              kpi: strategy.kpi
            }])
            .select()
            .single();

          if (!stratError && stratData) {
            // 6. Save Proposal Slides
            const slidesToInsert = (strategy.proposalSlides || []).map((slide, idx) => ({
              strategy_id: stratData.id,
              slide_number: idx + 1,
              title: slide.title,
              content: slide.content
            }));
            
            if (slidesToInsert.length > 0) {
              await supabase.from('proposal_slides').insert(slidesToInsert);
            }
          }
        }
      }
    } catch (saveError) {
      console.warn('DB Save Error (Generation succeeded but storage failed):', saveError.message);
    }

    res.json(strategy);
  } catch (error) {
    console.error('Execution Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to upload a new document (with automatic chunking)
app.post('/upload-document', async (req, res) => {
  try {
    const { title, category, content } = req.body;
    if (!content) throw new Error('컨텐츠 내용이 없습니다.');

    // OpenAI 토큰 제한을 피하기 위해 약 4000자 단위로 텍스트 분할
    const CHUNK_SIZE = 4000;
    const chunks = [];
    
    for (let i = 0; i < content.length; i += CHUNK_SIZE) {
      chunks.push(content.substring(i, i + CHUNK_SIZE));
    }

    console.log(`[${title}] 기안서를 ${chunks.length}개의 조각으로 나누어 업로드합니다.`);

    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkTitle = chunks.length > 1 ? `${title} (Part ${i + 1})` : title;
      const embedding = await generateEmbedding(chunks[i]);

      const { data, error } = await supabase
        .from('proposal_documents')
        .insert([
          { 
            title: chunkTitle, 
            category, 
            content: chunks[i], 
            embedding 
          }
        ]);

      if (error) throw error;
      results.push(data);
    }

    res.json({ success: true, chunksCount: chunks.length });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Page for easy uploading
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>제안서 업로드 어드민</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        .form-group { margin-bottom: 20px; }
        label { display: block; font-weight: bold; margin-bottom: 5px; }
        input, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #1d4ed8; }
        #status { margin-top: 20px; padding: 15px; border-radius: 4px; display: none; }
        .success { background: #dcfce7; color: #166534; }
        .error { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <h1>📄 제안서 데이터 업로드</h1>
      <p>PDF나 워드에서 복사한 내용을 아래에 그대로 붙여넣으세요. 줄바꿈 걱정 없이 업로드 가능합니다.</p>
      
      <div class="form-group">
        <label>제목</label>
        <input type="text" id="title" placeholder="예: 2024 카페 마케팅 성공 사례">
      </div>
      <div class="form-group">
        <label>카테고리</label>
        <input type="text" id="category" placeholder="예: F&B, 뷰티">
      </div>
      <div class="form-group">
        <label>제안서 내용 (전체 복사해서 붙여넣기)</label>
        <textarea id="content" rows="15" placeholder="제안서의 핵심 내용을 여기에 붙여넣으세요..."></textarea>
      </div>
      <button onclick="upload()">DB에 업로드하기</button>
      
      <div id="status"></div>

      <script>
        async function upload() {
          const btn = document.querySelector('button');
          const status = document.getElementById('status');
          const data = {
            title: document.getElementById('title').value,
            category: document.getElementById('category').value,
            content: document.getElementById('content').value
          };

          if (!data.title || !data.content) {
            alert('제목과 내용을 입력해주세요.');
            return;
          }

          btn.disabled = true;
          btn.innerText = '업로드 중 (임베딩 생성 중)...';
          status.style.display = 'none';

          try {
            const res = await fetch('/upload-document', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            const result = await res.json();
            
            status.style.display = 'block';
            if (result.success) {
              status.className = 'success';
              status.innerText = '✅ 성공적으로 업로드되었습니다!';
              document.getElementById('title').value = '';
              document.getElementById('category').value = '';
              document.getElementById('content').value = '';
            } else {
              status.className = 'error';
              status.innerText = '❌ 오류 발생: ' + result.error;
            }
          } catch (e) {
            status.style.display = 'block';
            status.className = 'error';
            status.innerText = '❌ 서버 연결 오류가 발생했습니다.';
          } finally {
            btn.disabled = false;
            btn.innerText = 'DB에 업로드하기';
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
