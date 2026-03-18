-- ==========================================
-- Supabase Schema & Vector Search Upgrade
-- Task: Advertising Agency Proposal Automation System
-- ==========================================

-- 1. Prerequisites: pgvector extension
-- Note: Must be run by superuser or in SQL editor
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tables Definition

-- [proposals] - 제안서 원본 DB
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  client_name TEXT,
  category TEXT,  -- 예: 뷰티, 식음료, IT, 금융
  budget_range TEXT,
  channels TEXT[], -- 예: ['instagram','youtube','naver']
  target_audience TEXT,
  key_strategy TEXT,
  creative_concept TEXT,
  result_outcome TEXT, -- 수주 결과
  performance_data JSONB, -- 집행 후 CTR, ROAS 등
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [research_cache] - 리서치 에이전트 캐시 (TTL 지원 예정)
CREATE TABLE IF NOT EXISTS research_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_key TEXT UNIQUE, -- (client+category 조합 해시)
  brand_research JSONB,
  competitor_analysis JSONB,
  consumer_insights JSONB,
  category_trends JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '72 hours')
);

-- [generation_jobs] - 생성 작업 상태 추적
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'researching', 'synthesizing', 'generating', 'done', 'error')),
  input_briefing JSONB,
  research_result JSONB,
  synthesis_result JSONB,
  final_proposal JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- status 업데이트시 updated_at 자동 업데이트를 위한 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generation_jobs_updated_at
BEFORE UPDATE ON generation_jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- [insights_library] - 합성된 인사이트 저장
CREATE TABLE IF NOT EXISTS insights_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT,
  insight_type TEXT CHECK (insight_type IN ('brand', 'competitor', 'consumer', 'trend')),
  content JSONB,
  source_urls TEXT[],
  quality_score FLOAT DEFAULT 0, -- (0-1, 재사용 우선순위)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [feedback_scores] - PT 결과 피드백
CREATE TABLE IF NOT EXISTS feedback_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  won_pitch BOOLEAN,
  client_feedback TEXT,
  score INTEGER CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vector Indexes for Performance
-- Creating IVFFLAT index on proposals(embedding)
CREATE INDEX IF NOT EXISTS idx_proposals_embedding 
ON proposals 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- 4. Vector Search Function
-- Cosine Similarity search based on briefing embedding
CREATE OR REPLACE FUNCTION search_similar_proposals (
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  client_name TEXT,
  category TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.client_name,
    p.category,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM proposals p
  WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 5. Row Level Security (RLS) Policies

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_cache ENABLE ROW LEVEL SECURITY;

-- Proposals RLS
CREATE POLICY "Enable Read access for all authenticated users" 
ON proposals FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable Insert/Update for admin only" 
ON proposals FOR ALL 
TO service_role -- or admin role if exists
USING (true);

-- Generation Jobs RLS (Owner Only)
CREATE POLICY "Users can view their own jobs" 
ON generation_jobs FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs" 
ON generation_jobs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" 
ON generation_jobs FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Research Cache RLS
CREATE POLICY "Authenticated users can read cache" 
ON research_cache FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Service roles can manage cache" 
ON research_cache FOR ALL 
TO service_role 
USING (true);

-- 6. Realtime Enablement
-- Enabling Realtime for generation_jobs to track progress
ALTER PUBLICATION supabase_realtime ADD TABLE generation_jobs;
