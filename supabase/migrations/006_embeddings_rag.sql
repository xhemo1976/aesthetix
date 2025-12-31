-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for RAG
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'service', 'faq', 'employee', 'general'
  content_id UUID, -- Reference to source content (service_id, etc.)
  content TEXT NOT NULL, -- The actual text content
  metadata JSONB DEFAULT '{}', -- Additional metadata (category, keywords, etc.)
  embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS embeddings_tenant_idx ON embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS embeddings_content_type_idx ON embeddings(content_type);

-- Create HNSW index for fast vector similarity search (better for production)
CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON embeddings
USING hnsw (embedding vector_cosine_ops);

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_tenant_id UUID,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content_type TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content_type,
    e.content,
    e.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE e.tenant_id = match_tenant_id
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS policies
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Service role can manage embeddings" ON embeddings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tenant admins can view their embeddings
CREATE POLICY "Tenant admins can view embeddings" ON embeddings
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Create FAQ table for custom knowledge base
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS faqs_tenant_idx ON faqs(tenant_id);

-- RLS for FAQs
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage faqs" ON faqs
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Tenant admins can manage faqs" ON faqs
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Public can read active FAQs
CREATE POLICY "Public can read active faqs" ON faqs
  FOR SELECT
  USING (is_active = true);
