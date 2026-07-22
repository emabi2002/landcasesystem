-- Complete Instruction System Migration
-- Run this in Supabase SQL Editor
-- This creates all necessary tables for the instruction system

-- 1. Create case_assignments table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS case_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  officer_user_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_by_user_id UUID REFERENCES auth.users(id),
  briefing_note TEXT,
  instructions TEXT,
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  reassignment_reason TEXT,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledgment_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for case_assignments
CREATE INDEX IF NOT EXISTS idx_case_assignments_case_id ON case_assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_officer ON case_assignments(officer_user_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_status ON case_assignments(status);

-- 2. Case Assignment History Table
CREATE TABLE IF NOT EXISTS case_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  assignment_id UUID,
  action VARCHAR(50) NOT NULL,
  from_officer_user_id UUID,
  to_officer_user_id UUID,
  performed_by_user_id UUID,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_assignment_history_case ON case_assignment_history(case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignment_history_assignment ON case_assignment_history(assignment_id);

-- 3. Instruction Templates Table
CREATE TABLE IF NOT EXISTS instruction_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instruction_templates_category ON instruction_templates(category);

-- 4. Instruction History Table
CREATE TABLE IF NOT EXISTS instruction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  assignment_id UUID,
  previous_instructions TEXT,
  new_instructions TEXT,
  change_type VARCHAR(50) DEFAULT 'update',
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_instruction_history_case_id ON instruction_history(case_id);
CREATE INDEX IF NOT EXISTS idx_instruction_history_assignment_id ON instruction_history(assignment_id);

-- 5. Enable RLS on all tables
ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruction_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruction_history ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for case_assignments
DROP POLICY IF EXISTS "Anyone can view case assignments" ON case_assignments;
CREATE POLICY "Anyone can view case assignments"
  ON case_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage assignments" ON case_assignments;
CREATE POLICY "Authenticated users can manage assignments"
  ON case_assignments FOR ALL USING (auth.uid() IS NOT NULL);

-- 7. RLS Policies for other tables
DROP POLICY IF EXISTS "Anyone can view assignment history" ON case_assignment_history;
CREATE POLICY "Anyone can view assignment history"
  ON case_assignment_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can manage history" ON case_assignment_history;
CREATE POLICY "Authenticated can manage history"
  ON case_assignment_history FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view templates" ON instruction_templates;
CREATE POLICY "Anyone can view templates"
  ON instruction_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can manage templates" ON instruction_templates;
CREATE POLICY "Authenticated can manage templates"
  ON instruction_templates FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view instruction history" ON instruction_history;
CREATE POLICY "Anyone can view instruction history"
  ON instruction_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can manage instruction history" ON instruction_history;
CREATE POLICY "Authenticated can manage instruction history"
  ON instruction_history FOR ALL USING (auth.uid() IS NOT NULL);

-- 8. Grant permissions
GRANT ALL ON case_assignments TO authenticated;
GRANT ALL ON case_assignment_history TO authenticated;
GRANT ALL ON instruction_templates TO authenticated;
GRANT ALL ON instruction_history TO authenticated;

-- 9. Insert default templates
INSERT INTO instruction_templates (name, description, content, category, is_default) VALUES
('Standard Case Review', 'Basic case review instructions', 
'• Review all case documents and prepare a summary
• Identify key issues and legal points
• Note any missing documentation
• Prepare preliminary assessment within 5 working days', 'review', true),

('Urgent Response Required', 'For time-sensitive matters', 
'• URGENT: Immediate attention required
• Review case documents within 24 hours
• Prepare response/action plan within 48 hours
• Escalate any blocking issues immediately
• Report progress daily until resolved', 'urgent', true),

('Court Preparation', 'Preparing for court proceedings', 
'• Review all case files and court documents
• Prepare witness list and statements
• Organize evidence and exhibits
• Draft court submissions
• Schedule pre-trial meeting with parties
• Ensure all deadlines are met', 'court', true),

('Mediation/Settlement', 'For settlement discussions', 
'• Review case for settlement potential
• Assess strengths and weaknesses
• Prepare settlement proposal options
• Schedule mediation session
• Document all negotiations
• Keep parties informed of progress', 'mediation', true),

('Document Collection', 'Gathering case documentation', 
'• Identify all required documents
• Send document requests to relevant parties
• Follow up on outstanding documents
• Organize received documents chronologically
• Prepare document summary index
• Flag any missing critical documents', 'documentation', true),

('New Case Assessment', 'Initial case evaluation', 
'• Review case registration details
• Verify all parties are correctly identified
• Check jurisdiction and legal basis
• Assess case merits and complexity
• Estimate timeline and resources needed
• Recommend appropriate case strategy', 'assessment', true)
ON CONFLICT DO NOTHING;

-- Done!
SELECT 'Migration completed successfully!' as status;