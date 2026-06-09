-- Cost Alerts Table
-- Run this in your Supabase SQL Editor

-- Create cost_alerts table for threshold notifications
CREATE TABLE IF NOT EXISTS cost_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('case_threshold', 'category_threshold', 'monthly_threshold', 'outstanding_threshold')),
    threshold_amount DECIMAL(15,2) NOT NULL,
    notify_email BOOLEAN DEFAULT true,
    notify_in_app BOOLEAN DEFAULT true,
    recipient_role VARCHAR(50) DEFAULT 'senior_legal_officer',
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create index for active alerts lookup
CREATE INDEX IF NOT EXISTS idx_cost_alerts_active ON cost_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cost_alerts_case ON cost_alerts(case_id);

-- Enable RLS
ALTER TABLE cost_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to manage cost alerts"
ON cost_alerts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create cost_alert_notifications table to track triggered alerts
CREATE TABLE IF NOT EXISTS cost_alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES cost_alerts(id) ON DELETE CASCADE,
    cost_id UUID REFERENCES litigation_costs(id) ON DELETE SET NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    triggered_amount DECIMAL(15,2) NOT NULL,
    threshold_amount DECIMAL(15,2) NOT NULL,
    notification_type VARCHAR(20) DEFAULT 'in_app',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for unread notifications
CREATE INDEX IF NOT EXISTS idx_alert_notifications_unread ON cost_alert_notifications(is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE cost_alert_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow authenticated users to manage alert notifications"
ON cost_alert_notifications
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to check cost thresholds after insert
CREATE OR REPLACE FUNCTION check_cost_thresholds()
RETURNS TRIGGER AS $$
DECLARE
    alert_record RECORD;
    case_total DECIMAL(15,2);
    case_outstanding DECIMAL(15,2);
BEGIN
    -- Get case totals
    SELECT
        COALESCE(SUM(amount), 0),
        COALESCE(SUM(amount - amount_paid), 0)
    INTO case_total, case_outstanding
    FROM litigation_costs
    WHERE case_id = NEW.case_id AND is_deleted = false;

    -- Check case threshold alerts
    FOR alert_record IN
        SELECT * FROM cost_alerts
        WHERE is_active = true
        AND (case_id IS NULL OR case_id = NEW.case_id)
        AND alert_type = 'case_threshold'
        AND threshold_amount <= case_total
    LOOP
        -- Create notification
        INSERT INTO cost_alert_notifications (
            alert_id, cost_id, case_id, triggered_amount, threshold_amount, notification_type
        ) VALUES (
            alert_record.id, NEW.id, NEW.case_id, case_total, alert_record.threshold_amount, 'in_app'
        );

        -- Update last triggered
        UPDATE cost_alerts SET last_triggered_at = NOW() WHERE id = alert_record.id;
    END LOOP;

    -- Check outstanding threshold alerts
    FOR alert_record IN
        SELECT * FROM cost_alerts
        WHERE is_active = true
        AND (case_id IS NULL OR case_id = NEW.case_id)
        AND alert_type = 'outstanding_threshold'
        AND threshold_amount <= case_outstanding
    LOOP
        INSERT INTO cost_alert_notifications (
            alert_id, cost_id, case_id, triggered_amount, threshold_amount, notification_type
        ) VALUES (
            alert_record.id, NEW.id, NEW.case_id, case_outstanding, alert_record.threshold_amount, 'in_app'
        );

        UPDATE cost_alerts SET last_triggered_at = NOW() WHERE id = alert_record.id;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for cost threshold checking
DROP TRIGGER IF EXISTS check_cost_thresholds_trigger ON litigation_costs;
CREATE TRIGGER check_cost_thresholds_trigger
AFTER INSERT ON litigation_costs
FOR EACH ROW
EXECUTE FUNCTION check_cost_thresholds();
