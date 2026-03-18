-- ==========================================
-- AI Advertising Proposal System Database Setup
-- ==========================================

-- 1. Enable pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS match_documents(vector, double precision, integer);

-- 3. Tables Definition

-- Client Briefs: The starting point of every proposal
CREATE TABLE IF NOT EXISTS client_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  category TEXT,
  budget TEXT,
  target_audience TEXT,
  campaign_objective TEXT,
  campaign_duration TEXT,
  channels JSONB,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Data: Research and intelligence per brief
CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES client_briefs(id) ON DELETE CASCADE,
  market_trends JSONB,
  swot_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor Ads: Database of competitor materials with vector search
CREATE TABLE IF NOT EXISTS competitor_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES client_briefs(id) ON DELETE CASCADE,
  competitor_name TEXT,
  ad_copy TEXT,
  media_url TEXT,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consumer Data: Target audience research
CREATE TABLE IF NOT EXISTS consumer_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES client_briefs(id) ON DELETE CASCADE,
  demographics JSONB,
  behavioral_patterns JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insights: Derived from market/consumer/competitor data
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES client_briefs(id) ON DELETE CASCADE,
  core_insight TEXT NOT NULL,
  observation TEXT,
  implication TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategies: Built upon specific insights
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID REFERENCES insights(id) ON DELETE SET NULL,
  brief_id UUID REFERENCES client_briefs(id) ON DELETE CASCADE,
  core_strategy TEXT NOT NULL,
  strategy_pillars JSONB,
  media_mix JSONB,
  kpi JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal Slides: Content for the final deck
CREATE TABLE IF NOT EXISTS proposal_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  slide_number INTEGER,
  title TEXT,
  content JSONB,
  visual_guidelines TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal Documents: Knowledge base of past documents (RAG)
CREATE TABLE IF NOT EXISTS proposal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES client_briefs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT,
  content TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_brief_id_market ON market_data(brief_id);
CREATE INDEX IF NOT EXISTS idx_brief_id_competitor ON competitor_ads(brief_id);
CREATE INDEX IF NOT EXISTS idx_brief_id_consumer ON consumer_data(brief_id);
CREATE INDEX IF NOT EXISTS idx_brief_id_insights ON insights(brief_id);
CREATE INDEX IF NOT EXISTS idx_brief_id_strategies ON strategies(brief_id);
CREATE INDEX IF NOT EXISTS idx_strategy_id_slides ON proposal_slides(strategy_id);

-- Vector Indexes (Optional for performance)
-- CREATE INDEX ON proposal_documents USING hnsw (embedding vector_cosine_ops);

-- 5. Similarity Search Function: match_documents
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd.id,
    pd.title,
    pd.content,
    pd.category,
    1 - (pd.embedding <=> query_embedding) AS similarity
  FROM proposal_documents pd
  WHERE 1 - (pd.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
