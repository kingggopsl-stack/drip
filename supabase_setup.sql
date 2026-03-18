-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Create the proposal_documents table
create table if not exists proposal_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  content text not null,
  embedding vector(1536), -- OpenAI embeddings dimension
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create a function to search for similar documents
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  category text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    proposal_documents.id,
    proposal_documents.title,
    proposal_documents.category,
    proposal_documents.content,
    1 - (proposal_documents.embedding <=> query_embedding) as similarity
  from proposal_documents
  where 1 - (proposal_documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
