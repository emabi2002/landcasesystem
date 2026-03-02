-- =====================================================
-- LITIGATION COSTS - SAMPLE DATA
-- Run this AFTER running database-litigation-costs.sql
-- =====================================================

-- First, get some case IDs from existing cases
-- This script assumes you have cases in the database

-- Insert sample litigation costs for existing cases
-- We'll use a DO block to dynamically insert based on existing cases

DO $$
DECLARE
    v_case_id UUID;
    v_category_id UUID;
    v_case_count INTEGER := 0;
BEGIN
    -- Get category IDs
    SELECT id INTO v_category_id FROM cost_categories WHERE code = 'LEGAL_EXTERNAL' LIMIT 1;

    -- Loop through first 5 cases and add sample costs
    FOR v_case_id IN (SELECT id FROM cases ORDER BY created_at DESC LIMIT 5)
    LOOP
        v_case_count := v_case_count + 1;

        -- Add External Legal Fees
        INSERT INTO litigation_costs (
            case_id, category_id, cost_type, amount, currency,
            date_incurred, payment_status, amount_paid,
            responsible_unit, responsible_authority,
            payee_name, payee_type, description, reference_number
        ) VALUES (
            v_case_id,
            (SELECT id FROM cost_categories WHERE code = 'LEGAL_EXTERNAL'),
            'Legal Fees (External Counsel)',
            50000.00 + (v_case_count * 10000),
            'PGK',
            CURRENT_DATE - INTERVAL '30 days' * v_case_count,
            CASE WHEN v_case_count <= 2 THEN 'paid' ELSE 'unpaid' END,
            CASE WHEN v_case_count <= 2 THEN 50000.00 + (v_case_count * 10000) ELSE 0 END,
            'Legal Division',
            'DLPP',
            'Allens Linklaters PNG',
            'law_firm',
            'Legal representation for case proceedings',
            'INV-2025-' || LPAD(v_case_count::TEXT, 4, '0')
        );

        -- Add Court Filing Fees
        INSERT INTO litigation_costs (
            case_id, category_id, cost_type, amount, currency,
            date_incurred, payment_status, amount_paid,
            responsible_unit, responsible_authority,
            payee_name, payee_type, description, reference_number
        ) VALUES (
            v_case_id,
            (SELECT id FROM cost_categories WHERE code = 'COURT_FILING'),
            'Court Filing Fees',
            2500.00,
            'PGK',
            CURRENT_DATE - INTERVAL '25 days' * v_case_count,
            'paid',
            2500.00,
            'Legal Division',
            'National Court',
            'National Court Registry',
            'court',
            'Filing fee for originating summons',
            'NCFEE-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || v_case_count
        );

        -- Add Disbursements
        INSERT INTO litigation_costs (
            case_id, category_id, cost_type, amount, currency,
            date_incurred, payment_status, amount_paid,
            responsible_unit, responsible_authority,
            payee_name, payee_type, description
        ) VALUES (
            v_case_id,
            (SELECT id FROM cost_categories WHERE code = 'DISBURSEMENT'),
            'Disbursements',
            5000.00 + (v_case_count * 500),
            'PGK',
            CURRENT_DATE - INTERVAL '20 days' * v_case_count,
            'partial',
            3000.00,
            'Legal Division',
            'DLPP',
            'Various Service Providers',
            'company',
            'Travel, copying, courier, and other out-of-pocket expenses'
        );

        -- Add Settlement for some cases
        IF v_case_count = 1 OR v_case_count = 3 THEN
            INSERT INTO litigation_costs (
                case_id, category_id, cost_type, amount, currency,
                date_incurred, payment_status, amount_paid,
                responsible_unit, responsible_authority,
                payee_name, payee_type, description, reference_number
            ) VALUES (
                v_case_id,
                (SELECT id FROM cost_categories WHERE code = 'SETTLEMENT'),
                'Settlements',
                250000.00 * v_case_count,
                'PGK',
                CURRENT_DATE - INTERVAL '10 days',
                CASE WHEN v_case_count = 1 THEN 'paid' ELSE 'unpaid' END,
                CASE WHEN v_case_count = 1 THEN 250000.00 ELSE 0 END,
                'Finance Division',
                'State',
                'Claimant Name ' || v_case_count,
                'individual',
                'Settlement amount as per consent order',
                'SETTLE-2025-' || LPAD(v_case_count::TEXT, 3, '0')
            );
        END IF;

        -- Add Compensation for one case
        IF v_case_count = 2 THEN
            INSERT INTO litigation_costs (
                case_id, category_id, cost_type, amount, currency,
                date_incurred, payment_status, amount_paid,
                responsible_unit, responsible_authority,
                payee_name, payee_type, description, reference_number
            ) VALUES (
                v_case_id,
                (SELECT id FROM cost_categories WHERE code = 'COMPENSATION'),
                'Compensation Payments',
                175000.00,
                'PGK',
                CURRENT_DATE - INTERVAL '5 days',
                'unpaid',
                0,
                'Secretary''s Office',
                'State',
                'Affected Community Group',
                'company',
                'Compensation for wrongful land acquisition as ordered by court',
                'COMP-2025-001'
            );
        END IF;

        -- Add Penalty for one case
        IF v_case_count = 4 THEN
            INSERT INTO litigation_costs (
                case_id, category_id, cost_type, amount, currency,
                date_incurred, payment_status, amount_paid,
                responsible_unit, responsible_authority,
                payee_name, payee_type, description, reference_number
            ) VALUES (
                v_case_id,
                (SELECT id FROM cost_categories WHERE code = 'PENALTY'),
                'Penalties',
                100000.00,
                'PGK',
                CURRENT_DATE - INTERVAL '3 days',
                'disputed',
                0,
                'Legal Division',
                'State',
                'Court Registry',
                'court',
                'Penalty for contempt of court order',
                'PEN-2025-001'
            );
        END IF;
    END LOOP;

    RAISE NOTICE 'Inserted sample litigation costs for % cases', v_case_count;
END $$;

-- Verify the inserted data
SELECT
    c.case_number,
    lc.cost_type,
    lc.amount,
    lc.payment_status,
    lc.payee_name,
    lc.date_incurred
FROM litigation_costs lc
JOIN cases c ON lc.case_id = c.id
ORDER BY c.case_number, lc.date_incurred DESC;

-- Summary
SELECT
    COUNT(*) as total_entries,
    SUM(amount) as total_amount,
    SUM(amount_paid) as total_paid,
    SUM(amount) - SUM(amount_paid) as total_outstanding
FROM litigation_costs
WHERE is_deleted = false;
