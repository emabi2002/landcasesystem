-- =====================================================
-- DLPP Legal CMS - Compliance Integration Schema
-- =====================================================
-- Purpose: Link Legal Cases with Compliance Recommendations
-- Version: 1.0
-- Date: November 2025
-- =====================================================

-- Create legal schema if not exists (separation of concerns)
CREATE SCHEMA IF NOT EXISTS legal;

-- Set search path
SET search_path TO legal, public;

-- =====================================================
-- ENUMS (Shared Types)
-- =====================================================

-- Risk rating enum
DO $$ BEGIN
  CREATE TYPE risk_rating AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Priority enum
DO $$ BEGIN
  CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Link type enum
CREATE TYPE link_type AS ENUM (
  'adopted_as_basis',      -- Recommendation is the basis for legal action
  'supporting_reference',  -- Recommendation supports the case
  'information_only'       -- For reference only
);

-- Link status enum
CREATE TYPE link_status AS ENUM ('linked', 'unlinked');

-- =====================================================
-- TABLE: recommendation_links
-- =====================================================
-- Purpose: Track links between legal cases and compliance recommendations
-- Maintains referential integrity to compliance system

CREATE TABLE IF NOT EXISTS recommendation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Legal case reference (local)
  legal_case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,

  -- Compliance recommendation reference (external)
  recommendation_id UUID NOT NULL,
  source_system TEXT NOT NULL DEFAULT 'compliance',

  -- Link metadata
  link_type link_type NOT NULL DEFAULT 'supporting_reference',
  link_status link_status NOT NULL DEFAULT 'linked',

  -- Context and notes
  link_context TEXT, -- Why this recommendation was linked
  link_notes TEXT,   -- Additional notes about the link

  -- Compliance metadata (cached for performance)
  recommendation_title TEXT,
  recommendation_priority TEXT,
  recommendation_risk_rating TEXT,
  recommendation_region TEXT,
  recommendation_parcel_ref TEXT,

  -- Timestamps
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlinked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT unique_case_recommendation UNIQUE(legal_case_id, recommendation_id),
  CONSTRAINT valid_link_dates CHECK (unlinked_at IS NULL OR unlinked_at >= linked_at)
);

-- =====================================================
-- TABLE: recommendation_snapshots
-- =====================================================
-- Purpose: Immutable snapshots of recommendations at time of linking
-- For evidentiary record and historical reference

CREATE TABLE IF NOT EXISTS recommendation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  recommendation_id UUID NOT NULL,
  legal_case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  link_id UUID REFERENCES recommendation_links(id) ON DELETE CASCADE,

  -- Snapshot data (complete recommendation at time of capture)
  snapshot_jsonb JSONB NOT NULL,

  -- Metadata
  snapshot_reason TEXT DEFAULT 'legal_case_link',
  snapped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  snapped_by UUID REFERENCES auth.users(id),

  -- Hash for integrity verification
  snapshot_hash TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_snapshot_per_link UNIQUE(link_id)
);

-- =====================================================
-- TABLE: compliance_sync_log
-- =====================================================
-- Purpose: Track synchronization with compliance system

CREATE TABLE IF NOT EXISTS compliance_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  sync_type TEXT NOT NULL, -- 'pull_recommendations', 'link_notification', 'status_update'
  sync_status TEXT NOT NULL, -- 'success', 'failed', 'partial'

  -- Stats
  records_processed INTEGER DEFAULT 0,
  records_success INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  -- Details
  sync_details JSONB,
  error_message TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Audit
  triggered_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- TABLE: materialized_recommendations (Optional)
-- =====================================================
-- Purpose: Local cache of published recommendations for faster queries

CREATE TABLE IF NOT EXISTS materialized_recommendations (
  recommendation_id UUID PRIMARY KEY,

  -- Core data (from compliance system)
  title TEXT NOT NULL,
  recommendation_text TEXT,
  risk_rating TEXT,
  priority TEXT,
  status TEXT,

  -- Organization
  org_unit_name TEXT,
  region TEXT,

  -- Dates
  target_date DATE,
  published_at TIMESTAMPTZ,

  -- References
  parcel_ref TEXT,
  tags TEXT[],

  -- Metadata
  owner_name TEXT,

  -- Sync metadata
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Full snapshot
  full_data JSONB,

  -- Search
  search_vector tsvector
);

-- =====================================================
-- INDEXES
-- =====================================================

-- recommendation_links indexes
CREATE INDEX IF NOT EXISTS idx_rec_links_case_id ON recommendation_links(legal_case_id);
CREATE INDEX IF NOT EXISTS idx_rec_links_rec_id ON recommendation_links(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rec_links_status ON recommendation_links(link_status);
CREATE INDEX IF NOT EXISTS idx_rec_links_type ON recommendation_links(link_type);
CREATE INDEX IF NOT EXISTS idx_rec_links_created ON recommendation_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rec_links_region ON recommendation_links(recommendation_region);

-- recommendation_snapshots indexes
CREATE INDEX IF NOT EXISTS idx_rec_snapshots_case_id ON recommendation_snapshots(legal_case_id);
CREATE INDEX IF NOT EXISTS idx_rec_snapshots_rec_id ON recommendation_snapshots(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rec_snapshots_created ON recommendation_snapshots(created_at DESC);

-- materialized_recommendations indexes
CREATE INDEX IF NOT EXISTS idx_mat_rec_status ON materialized_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_mat_rec_published ON materialized_recommendations(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_mat_rec_region ON materialized_recommendations(region);
CREATE INDEX IF NOT EXISTS idx_mat_rec_priority ON materialized_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_mat_rec_risk ON materialized_recommendations(risk_rating);
CREATE INDEX IF NOT EXISTS idx_mat_rec_parcel ON materialized_recommendations(parcel_ref);
CREATE INDEX IF NOT EXISTS idx_mat_rec_search ON materialized_recommendations USING gin(search_vector);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recommendation_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
CREATE TRIGGER recommendation_links_updated_at
  BEFORE UPDATE ON recommendation_links
  FOR EACH ROW
  EXECUTE FUNCTION update_recommendation_links_updated_at();

-- Function: Generate snapshot hash
CREATE OR REPLACE FUNCTION generate_snapshot_hash(data JSONB)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(data::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Update search vector for materialized recommendations
CREATE OR REPLACE FUNCTION update_materialized_rec_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.recommendation_text, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.parcel_ref, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update search vector
CREATE TRIGGER materialized_rec_search_vector
  BEFORE INSERT OR UPDATE ON materialized_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_materialized_rec_search_vector();

-- =====================================================
-- RPC FUNCTIONS (Secure Operations)
-- =====================================================

-- Function: Link recommendation to legal case
CREATE OR REPLACE FUNCTION link_recommendation_to_case(
  p_legal_case_id UUID,
  p_recommendation_id UUID,
  p_link_type TEXT DEFAULT 'supporting_reference',
  p_link_context TEXT DEFAULT NULL,
  p_snapshot_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_link_id UUID;
  v_snapshot_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  -- Validate case exists
  IF NOT EXISTS (SELECT 1 FROM cases WHERE id = p_legal_case_id) THEN
    RAISE EXCEPTION 'Legal case not found: %', p_legal_case_id;
  END IF;

  -- Create or update link
  INSERT INTO recommendation_links (
    legal_case_id,
    recommendation_id,
    link_type,
    link_context,
    link_status,
    created_by,
    updated_by
  ) VALUES (
    p_legal_case_id,
    p_recommendation_id,
    p_link_type::link_type,
    p_link_context,
    'linked',
    v_user_id,
    v_user_id
  )
  ON CONFLICT (legal_case_id, recommendation_id)
  DO UPDATE SET
    link_status = 'linked',
    link_type = EXCLUDED.link_type,
    link_context = EXCLUDED.link_context,
    updated_by = v_user_id,
    updated_at = NOW()
  RETURNING id INTO v_link_id;

  -- Create snapshot if data provided
  IF p_snapshot_data IS NOT NULL THEN
    INSERT INTO recommendation_snapshots (
      recommendation_id,
      legal_case_id,
      link_id,
      snapshot_jsonb,
      snapshot_hash,
      snapped_by
    ) VALUES (
      p_recommendation_id,
      p_legal_case_id,
      v_link_id,
      p_snapshot_data,
      generate_snapshot_hash(p_snapshot_data),
      v_user_id
    )
    ON CONFLICT (link_id) DO NOTHING
    RETURNING id INTO v_snapshot_id;
  END IF;

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Unlink recommendation from case
CREATE OR REPLACE FUNCTION unlink_recommendation_from_case(
  p_link_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  UPDATE recommendation_links
  SET
    link_status = 'unlinked',
    unlinked_at = NOW(),
    link_notes = COALESCE(link_notes || E'\n' || 'Unlinked: ' || p_reason, p_reason),
    updated_by = v_user_id,
    updated_at = NOW()
  WHERE id = p_link_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Sync recommendations from compliance system
CREATE OR REPLACE FUNCTION sync_published_recommendations(
  p_recommendations JSONB
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_rec JSONB;
BEGIN
  -- Loop through provided recommendations
  FOR v_rec IN SELECT * FROM jsonb_array_elements(p_recommendations)
  LOOP
    INSERT INTO materialized_recommendations (
      recommendation_id,
      title,
      recommendation_text,
      risk_rating,
      priority,
      status,
      org_unit_name,
      region,
      target_date,
      published_at,
      parcel_ref,
      tags,
      owner_name,
      full_data,
      last_synced_at
    ) VALUES (
      (v_rec->>'id')::UUID,
      v_rec->>'title',
      v_rec->>'recommendation_text',
      v_rec->>'risk_rating',
      v_rec->>'priority',
      v_rec->>'status',
      v_rec->>'org_unit_name',
      v_rec->>'region',
      (v_rec->>'target_date')::DATE,
      (v_rec->>'published_at')::TIMESTAMPTZ,
      v_rec->>'parcel_ref',
      ARRAY(SELECT jsonb_array_elements_text(v_rec->'tags')),
      v_rec->>'owner_name',
      v_rec,
      NOW()
    )
    ON CONFLICT (recommendation_id)
    DO UPDATE SET
      title = EXCLUDED.title,
      recommendation_text = EXCLUDED.recommendation_text,
      risk_rating = EXCLUDED.risk_rating,
      priority = EXCLUDED.priority,
      status = EXCLUDED.status,
      org_unit_name = EXCLUDED.org_unit_name,
      region = EXCLUDED.region,
      target_date = EXCLUDED.target_date,
      published_at = EXCLUDED.published_at,
      parcel_ref = EXCLUDED.parcel_ref,
      tags = EXCLUDED.tags,
      owner_name = EXCLUDED.owner_name,
      full_data = EXCLUDED.full_data,
      last_synced_at = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Active recommendation links with case details
CREATE OR REPLACE VIEW active_recommendation_links AS
SELECT
  rl.*,
  c.case_number,
  c.title AS case_title,
  c.status AS case_status,
  c.region AS case_region
FROM recommendation_links rl
JOIN cases c ON rl.legal_case_id = c.id
WHERE rl.link_status = 'linked';

-- View: Recommendations available for linking
CREATE OR REPLACE VIEW available_recommendations AS
SELECT
  recommendation_id,
  title,
  recommendation_text,
  risk_rating,
  priority,
  status,
  org_unit_name,
  region,
  target_date,
  published_at,
  parcel_ref,
  tags,
  owner_name
FROM materialized_recommendations
WHERE status = 'Published'
ORDER BY published_at DESC;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE recommendation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE materialized_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_sync_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view recommendation links for cases they can access
CREATE POLICY "Users can view recommendation links"
  ON recommendation_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = recommendation_links.legal_case_id
    )
  );

-- Policy: Case managers and admins can create links
CREATE POLICY "Managers can create recommendation links"
  ON recommendation_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'case_manager', 'legal_officer')
      AND users.status = 'active'
    )
  );

-- Policy: Case managers and admins can update links
CREATE POLICY "Managers can update recommendation links"
  ON recommendation_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'case_manager', 'legal_officer')
      AND users.status = 'active'
    )
  );

-- Policy: Users can view snapshots for their cases
CREATE POLICY "Users can view recommendation snapshots"
  ON recommendation_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = recommendation_snapshots.legal_case_id
    )
  );

-- Policy: All authenticated users can view published recommendations
CREATE POLICY "Users can view published recommendations"
  ON materialized_recommendations FOR SELECT
  USING (status = 'Published');

-- Policy: Admins can view sync logs
CREATE POLICY "Admins can view sync logs"
  ON compliance_sync_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.status = 'active'
    )
  );

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE recommendation_links IS 'Links between legal cases and compliance recommendations';
COMMENT ON TABLE recommendation_snapshots IS 'Immutable snapshots of recommendations at time of linking for evidentiary record';
COMMENT ON TABLE materialized_recommendations IS 'Local cache of published compliance recommendations for performance';
COMMENT ON TABLE compliance_sync_log IS 'Audit log of synchronization operations with compliance system';

COMMENT ON COLUMN recommendation_links.link_type IS 'Type of link: adopted_as_basis (primary reason for case), supporting_reference (supporting evidence), information_only (for context)';
COMMENT ON COLUMN recommendation_links.source_system IS 'Source system identifier, default is compliance';
COMMENT ON COLUMN recommendation_snapshots.snapshot_jsonb IS 'Complete recommendation data at time of snapshot (immutable)';
COMMENT ON COLUMN recommendation_snapshots.snapshot_hash IS 'SHA-256 hash for integrity verification';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA legal TO authenticated;

-- Grant permissions on tables
GRANT SELECT ON recommendation_links TO authenticated;
GRANT SELECT ON recommendation_snapshots TO authenticated;
GRANT SELECT ON materialized_recommendations TO authenticated;
GRANT SELECT ON compliance_sync_log TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION link_recommendation_to_case TO authenticated;
GRANT EXECUTE ON FUNCTION unlink_recommendation_from_case TO authenticated;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
