-- =====================================================
-- LITIGATION COSTING MODULE - STANDALONE SCHEMA
-- Department of Lands & Physical Planning (DLPP)
-- Papua New Guinea
-- =====================================================
-- This version does NOT require the profiles table.
-- User IDs are stored as plain UUIDs without foreign keys.
-- =====================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.litigation_cost_documents CASCADE;
DROP TABLE IF EXISTS public.litigation_cost_history CASCADE;
DROP TABLE IF EXISTS public.litigation_costs CASCADE;
DROP TABLE IF EXISTS public.cost_categories CASCADE;

-- =====================================================
-- 1. COST CATEGORIES REFERENCE TABLE
-- =====================================================
CREATE TABLE public.cost_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_group VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default cost categories
INSERT INTO public.cost_categories (code, name, description, category_group, display_order) VALUES
    ('LEGAL_INTERNAL', 'Legal Fees (Internal Counsel)', 'Fees for internal legal staff time and resources', 'Legal Fees', 1),
    ('LEGAL_EXTERNAL', 'Legal Fees (External Counsel)', 'Fees paid to external law firms and solicitors', 'Legal Fees', 2),
    ('COURT_FILING', 'Court Filing Fees', 'Fees for filing documents with the court', 'Court Fees', 3),
    ('COURT_PROCESSING', 'Court Processing Fees', 'Administrative court processing charges', 'Court Fees', 4),
    ('SETTLEMENT', 'Settlements', 'Agreed settlement amounts paid to resolve disputes', 'Settlements', 5),
    ('CONSENT_AWARD', 'Consent Awards', 'Court-approved consent judgment amounts', 'Settlements', 6),
    ('PENALTY', 'Penalties', 'Penalty payments ordered by court', 'Penalties', 7),
    ('COMPENSATION', 'Compensation Payments', 'Compensation paid to affected parties', 'Penalties', 8),
    ('DISBURSEMENT', 'Disbursements', 'Out-of-pocket expenses (travel, copying, etc.)', 'Disbursements', 9),
    ('INCIDENTAL', 'Incidental Legal Costs', 'Other miscellaneous legal-related costs', 'Disbursements', 10);

-- =====================================================
-- 2. LITIGATION COSTS TABLE (Main cost entries)
-- =====================================================
CREATE TABLE public.litigation_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,

    -- Cost Details
    category_id UUID REFERENCES public.cost_categories(id),
    cost_type VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'PGK',

    -- Date Information
    date_incurred DATE NOT NULL,
    date_paid DATE,

    -- Payment Status
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('paid', 'unpaid', 'partial', 'waived', 'disputed')),
    amount_paid DECIMAL(15, 2) DEFAULT 0 CHECK (amount_paid >= 0),

    -- Responsibility
    responsible_unit VARCHAR(255),
    responsible_authority VARCHAR(255),
    approved_by VARCHAR(255),

    -- Description
    description TEXT,
    reference_number VARCHAR(100),

    -- Vendor/Payee Information
    payee_name VARCHAR(255),
    payee_type VARCHAR(50),

    -- Audit Fields (stored as UUID without foreign key constraint)
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

-- Create indexes for performance
CREATE INDEX idx_litigation_costs_case_id ON public.litigation_costs(case_id);
CREATE INDEX idx_litigation_costs_category_id ON public.litigation_costs(category_id);
CREATE INDEX idx_litigation_costs_date_incurred ON public.litigation_costs(date_incurred);
CREATE INDEX idx_litigation_costs_payment_status ON public.litigation_costs(payment_status);
CREATE INDEX idx_litigation_costs_cost_type ON public.litigation_costs(cost_type);
CREATE INDEX idx_litigation_costs_created_at ON public.litigation_costs(created_at);

-- =====================================================
-- 3. LITIGATION COST DOCUMENTS (Supporting documents)
-- =====================================================
CREATE TABLE public.litigation_cost_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_id UUID NOT NULL REFERENCES public.litigation_costs(id) ON DELETE CASCADE,

    -- Document Details
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100),
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),

    -- Metadata
    description TEXT,

    -- Audit Fields
    uploaded_by UUID,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_litigation_cost_documents_cost_id ON public.litigation_cost_documents(cost_id);

-- =====================================================
-- 4. LITIGATION COST HISTORY (Audit trail)
-- =====================================================
CREATE TABLE public.litigation_cost_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_id UUID NOT NULL REFERENCES public.litigation_costs(id) ON DELETE CASCADE,

    -- Change Details
    action VARCHAR(20) NOT NULL,
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,

    -- Audit Fields
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Snapshot of the record at time of change
    record_snapshot JSONB
);

CREATE INDEX idx_litigation_cost_history_cost_id ON public.litigation_cost_history(cost_id);
CREATE INDEX idx_litigation_cost_history_changed_at ON public.litigation_cost_history(changed_at);

-- =====================================================
-- 5. TRIGGERS FOR AUDIT TRAIL
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_litigation_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_litigation_costs_updated_at ON public.litigation_costs;
CREATE TRIGGER trigger_update_litigation_costs_updated_at
    BEFORE UPDATE ON public.litigation_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_litigation_costs_updated_at();

-- Function to log changes to litigation_cost_history
CREATE OR REPLACE FUNCTION log_litigation_cost_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.litigation_cost_history (
            cost_id, action, changed_by, record_snapshot
        ) VALUES (
            NEW.id, 'created', NEW.created_by, to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.amount != NEW.amount THEN
            INSERT INTO public.litigation_cost_history (
                cost_id, action, field_changed, old_value, new_value, changed_by, record_snapshot
            ) VALUES (
                NEW.id, 'updated', 'amount', OLD.amount::TEXT, NEW.amount::TEXT, NEW.updated_by, to_jsonb(NEW)
            );
        END IF;
        IF OLD.payment_status != NEW.payment_status THEN
            INSERT INTO public.litigation_cost_history (
                cost_id, action, field_changed, old_value, new_value, changed_by, record_snapshot
            ) VALUES (
                NEW.id, 'updated', 'payment_status', OLD.payment_status, NEW.payment_status, NEW.updated_by, to_jsonb(NEW)
            );
        END IF;
        IF OLD.amount_paid != NEW.amount_paid THEN
            INSERT INTO public.litigation_cost_history (
                cost_id, action, field_changed, old_value, new_value, changed_by, record_snapshot
            ) VALUES (
                NEW.id, 'updated', 'amount_paid', OLD.amount_paid::TEXT, NEW.amount_paid::TEXT, NEW.updated_by, to_jsonb(NEW)
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.litigation_cost_history (
            cost_id, action, changed_by, record_snapshot
        ) VALUES (
            OLD.id, 'deleted', OLD.deleted_by, to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for audit logging
DROP TRIGGER IF EXISTS trigger_log_litigation_cost_changes ON public.litigation_costs;
CREATE TRIGGER trigger_log_litigation_cost_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.litigation_costs
    FOR EACH ROW
    EXECUTE FUNCTION log_litigation_cost_changes();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litigation_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litigation_cost_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litigation_cost_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view cost categories" ON public.cost_categories;
DROP POLICY IF EXISTS "Admins can manage cost categories" ON public.cost_categories;
DROP POLICY IF EXISTS "Authenticated users can view litigation costs" ON public.litigation_costs;
DROP POLICY IF EXISTS "Legal and Finance can manage litigation costs" ON public.litigation_costs;
DROP POLICY IF EXISTS "Legal and Finance can update litigation costs" ON public.litigation_costs;
DROP POLICY IF EXISTS "Authenticated users can view cost documents" ON public.litigation_cost_documents;
DROP POLICY IF EXISTS "Legal and Finance can manage cost documents" ON public.litigation_cost_documents;
DROP POLICY IF EXISTS "Authenticated users can view cost history" ON public.litigation_cost_history;

-- Cost Categories: All authenticated users can read
CREATE POLICY "Anyone can view cost categories"
    ON public.cost_categories FOR SELECT
    TO authenticated
    USING (true);

-- Cost Categories: All authenticated users can manage (simplified)
CREATE POLICY "Authenticated users can manage cost categories"
    ON public.cost_categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Litigation Costs: Read access for authenticated users
CREATE POLICY "Authenticated users can view litigation costs"
    ON public.litigation_costs FOR SELECT
    TO authenticated
    USING (is_deleted = false);

-- Litigation Costs: All authenticated users can insert (simplified)
CREATE POLICY "Authenticated users can add litigation costs"
    ON public.litigation_costs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Litigation Costs: All authenticated users can update (simplified)
CREATE POLICY "Authenticated users can update litigation costs"
    ON public.litigation_costs FOR UPDATE
    TO authenticated
    USING (true);

-- Cost Documents: Read access
CREATE POLICY "Authenticated users can view cost documents"
    ON public.litigation_cost_documents FOR SELECT
    TO authenticated
    USING (true);

-- Cost Documents: Insert access
CREATE POLICY "Authenticated users can add cost documents"
    ON public.litigation_cost_documents FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Cost History: Read-only for all authenticated users
CREATE POLICY "Authenticated users can view cost history"
    ON public.litigation_cost_history FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- 7. VIEWS FOR REPORTING
-- =====================================================

-- View: Case Cost Summary
CREATE OR REPLACE VIEW public.v_case_cost_summary AS
SELECT
    c.id AS case_id,
    c.case_number,
    c.title AS case_title,
    c.status AS case_status,
    c.case_type,
    COUNT(lc.id) AS total_cost_entries,
    COALESCE(SUM(lc.amount), 0) AS total_amount,
    COALESCE(SUM(lc.amount_paid), 0) AS total_paid,
    COALESCE(SUM(lc.amount), 0) - COALESCE(SUM(lc.amount_paid), 0) AS total_outstanding,
    COUNT(CASE WHEN lc.payment_status = 'paid' THEN 1 END) AS paid_entries,
    COUNT(CASE WHEN lc.payment_status = 'unpaid' THEN 1 END) AS unpaid_entries,
    MIN(lc.date_incurred) AS first_cost_date,
    MAX(lc.date_incurred) AS last_cost_date
FROM public.cases c
LEFT JOIN public.litigation_costs lc ON c.id = lc.case_id AND lc.is_deleted = false
GROUP BY c.id, c.case_number, c.title, c.status, c.case_type;

-- View: Monthly Cost Aggregation
CREATE OR REPLACE VIEW public.v_monthly_cost_summary AS
SELECT
    DATE_TRUNC('month', lc.date_incurred) AS month,
    cc.category_group,
    cc.name AS category_name,
    COUNT(lc.id) AS entry_count,
    SUM(lc.amount) AS total_amount,
    SUM(lc.amount_paid) AS total_paid,
    SUM(lc.amount) - SUM(lc.amount_paid) AS outstanding
FROM public.litigation_costs lc
JOIN public.cost_categories cc ON lc.category_id = cc.id
WHERE lc.is_deleted = false
GROUP BY DATE_TRUNC('month', lc.date_incurred), cc.category_group, cc.name
ORDER BY month DESC, cc.category_group, cc.name;

-- View: Cost by Case Type
CREATE OR REPLACE VIEW public.v_cost_by_case_type AS
SELECT
    c.case_type,
    COUNT(DISTINCT c.id) AS case_count,
    COUNT(lc.id) AS cost_entries,
    COALESCE(SUM(lc.amount), 0) AS total_amount,
    COALESCE(SUM(lc.amount_paid), 0) AS total_paid,
    COALESCE(AVG(lc.amount), 0) AS avg_cost_per_entry
FROM public.cases c
LEFT JOIN public.litigation_costs lc ON c.id = lc.case_id AND lc.is_deleted = false
GROUP BY c.case_type
ORDER BY total_amount DESC;

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to get total costs for a case
CREATE OR REPLACE FUNCTION get_case_total_costs(p_case_id UUID)
RETURNS TABLE (
    total_amount DECIMAL(15,2),
    total_paid DECIMAL(15,2),
    total_outstanding DECIMAL(15,2),
    entry_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(lc.amount), 0::DECIMAL(15,2)) AS total_amount,
        COALESCE(SUM(lc.amount_paid), 0::DECIMAL(15,2)) AS total_paid,
        COALESCE(SUM(lc.amount) - SUM(lc.amount_paid), 0::DECIMAL(15,2)) AS total_outstanding,
        COUNT(lc.id)::INTEGER AS entry_count
    FROM public.litigation_costs lc
    WHERE lc.case_id = p_case_id AND lc.is_deleted = false;
END;
$$ LANGUAGE plpgsql;

-- Function to get cost breakdown by category for a case
CREATE OR REPLACE FUNCTION get_case_cost_breakdown(p_case_id UUID)
RETURNS TABLE (
    category_name VARCHAR(255),
    category_group VARCHAR(100),
    total_amount DECIMAL(15,2),
    entry_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.name AS category_name,
        cc.category_group,
        COALESCE(SUM(lc.amount), 0::DECIMAL(15,2)) AS total_amount,
        COUNT(lc.id)::INTEGER AS entry_count
    FROM public.cost_categories cc
    LEFT JOIN public.litigation_costs lc ON cc.id = lc.category_id
        AND lc.case_id = p_case_id
        AND lc.is_deleted = false
    WHERE cc.is_active = true
    GROUP BY cc.id, cc.name, cc.category_group, cc.display_order
    ORDER BY cc.display_order;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- This standalone version works without the profiles table.
-- User IDs are stored but not enforced with foreign keys.
-- =====================================================
