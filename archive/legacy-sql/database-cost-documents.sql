-- Cost Documents Table
-- Run this in your Supabase SQL Editor

-- Create cost_documents table
CREATE TABLE IF NOT EXISTS cost_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_id UUID NOT NULL REFERENCES litigation_costs(id) ON DELETE CASCADE,
    document_name VARCHAR(500) NOT NULL,
    document_type VARCHAR(100),
    file_path VARCHAR(1000) NOT NULL,
    file_size INTEGER DEFAULT 0,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cost_documents_cost_id ON cost_documents(cost_id);

-- Enable RLS
ALTER TABLE cost_documents ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to manage cost documents"
ON cost_documents
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create storage bucket for cost documents (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cost-documents', 'cost-documents', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policy (run separately if needed)
-- CREATE POLICY "Allow authenticated users to upload cost documents"
-- ON storage.objects
-- FOR ALL
-- TO authenticated
-- USING (bucket_id = 'cost-documents')
-- WITH CHECK (bucket_id = 'cost-documents');
