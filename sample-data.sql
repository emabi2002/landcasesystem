-- DLPP Legal Case Management System - Sample Data
-- Run this AFTER setting up the database schema and creating your admin user
-- This will populate the system with realistic test data

-- ============================================
-- 1. SAMPLE PROFILES (Users)
-- ============================================
-- Note: You need to create these users in Supabase Authentication first, then use their UUIDs here
-- For now, we'll insert sample profiles that you can link to auth users later

-- Sample Legal Officers (replace UUIDs with actual auth user IDs)
INSERT INTO public.profiles (id, email, full_name, role, department, phone) VALUES
('00000000-0000-0000-0000-000000000001', 'john.kila@lands.gov.pg', 'John Kila', 'legal_officer', 'Legal Division', '+675 321 4567'),
('00000000-0000-0000-0000-000000000002', 'mary.tau@lands.gov.pg', 'Mary Tau', 'legal_officer', 'Legal Division', '+675 321 4568'),
('00000000-0000-0000-0000-000000000003', 'peter.wari@lands.gov.pg', 'Peter Wari', 'registrar', 'Registry', '+675 321 4569'),
('00000000-0000-0000-0000-000000000004', 'sarah.baki@lands.gov.pg', 'Sarah Baki', 'survey_officer', 'Survey Division', '+675 321 4570'),
('00000000-0000-0000-0000-000000000005', 'david.pato@lands.gov.pg', 'David Pato', 'director', 'Administration', '+675 321 4571')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. SAMPLE CASES
-- ============================================
INSERT INTO public.cases (id, case_number, title, description, status, case_type, priority, region, assigned_officer_id, created_by, created_at) VALUES
-- Case 1: Land Dispute
('10000000-0000-0000-0000-000000000001',
 'DLPP-2025-001',
 'Land Boundary Dispute - Hohola, Port Moresby',
 'Dispute between two landowners regarding boundary demarcation in Hohola, National Capital District. Survey plans from 1985 show conflicting boundaries. Requires urgent resolution as construction is pending.',
 'in_court',
 'dispute',
 'high',
 'National Capital District',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 '2025-01-15 09:00:00+00'),

-- Case 2: Title Claim
('10000000-0000-0000-0000-000000000002',
 'DLPP-2025-002',
 'Customary Land Title Claim - Madang Province',
 'Application for conversion of customary land to state lease for agricultural development project. Involves multiple clan groups and requires extensive consultation.',
 'under_review',
 'title_claim',
 'medium',
 'Madang Province',
 '00000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 '2025-01-20 10:30:00+00'),

-- Case 3: Court Matter
('10000000-0000-0000-0000-000000000003',
 'DLPP-2025-003',
 'Illegal Occupation - Mount Hagen',
 'Government land illegally occupied by settlers in Mount Hagen area. Eviction notice served. Matter now before District Court for enforcement order.',
 'in_court',
 'court_matter',
 'urgent',
 'Western Highlands Province',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000003',
 '2025-02-01 08:15:00+00'),

-- Case 4: Administrative Review
('10000000-0000-0000-0000-000000000004',
 'DLPP-2025-004',
 'State Lease Rental Review - Lae Industrial Area',
 'Request for review of state lease rental rates for industrial properties in Lae. Multiple lessees have submitted objections to proposed rate increases.',
 'mediation',
 'administrative_review',
 'medium',
 'Morobe Province',
 '00000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000003',
 '2025-02-05 11:00:00+00'),

-- Case 5: Land Dispute
('10000000-0000-0000-0000-000000000005',
 'DLPP-2025-005',
 'Inheritance Dispute - Rabaul',
 'Dispute over inheritance of freehold land in Rabaul between three siblings. Estate of late landowner needs to be settled before property can be transferred.',
 'settled',
 'dispute',
 'low',
 'East New Britain Province',
 '00000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 '2024-12-10 14:20:00+00'),

-- Case 6: Court Matter
('10000000-0000-0000-0000-000000000006',
 'DLPP-2025-006',
 'Fraudulent Land Sale - Port Moresby',
 'Investigation into fraudulent sale of government land. Documents forged, matter referred to police. Civil proceedings pending for recovery of land.',
 'judgment',
 'court_matter',
 'urgent',
 'National Capital District',
 '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000003',
 '2025-01-25 13:45:00+00'),

-- Case 7: Title Claim
('10000000-0000-0000-0000-000000000007',
 'DLPP-2025-007',
 'Mining Lease Application - Southern Highlands',
 'Application for special mining lease over customary land. Environmental impact assessment completed. Awaiting final approval from Minister.',
 'tribunal',
 'title_claim',
 'high',
 'Southern Highlands Province',
 '00000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 '2025-02-10 09:30:00+00');

-- ============================================
-- 3. SAMPLE PARTIES
-- ============================================
INSERT INTO public.parties (case_id, name, party_type, role, contact_info) VALUES
-- Case 1 Parties
('10000000-0000-0000-0000-000000000001', 'Joseph Kome', 'individual', 'plaintiff', '{"phone": "+675 7123 4567", "address": "Section 45, Hohola, NCD"}'),
('10000000-0000-0000-0000-000000000001', 'Margaret Toea', 'individual', 'defendant', '{"phone": "+675 7234 5678", "address": "Section 46, Hohola, NCD"}'),
('10000000-0000-0000-0000-000000000001', 'PNG Surveying Ltd', 'company', 'witness', '{"phone": "+675 325 1234", "email": "info@pngsurvey.com.pg"}'),

-- Case 2 Parties
('10000000-0000-0000-0000-000000000002', 'Bougainville Clan Group', 'other', 'plaintiff', '{"representative": "Chief Thomas Biri", "phone": "+675 7345 6789"}'),
('10000000-0000-0000-0000-000000000002', 'Department of Lands', 'government_entity', 'other', '{"department": "Customary Land", "officer": "John Kila"}'),
('10000000-0000-0000-0000-000000000002', 'Madang Agricultural Co.', 'company', 'other', '{"phone": "+675 422 1234", "email": "contact@madangagri.com.pg"}'),

-- Case 3 Parties
('10000000-0000-0000-0000-000000000003', 'State of Papua New Guinea', 'government_entity', 'plaintiff', '{"department": "Department of Lands", "representative": "State Solicitor"}'),
('10000000-0000-0000-0000-000000000003', 'Mount Hagen Settlers Association', 'other', 'defendant', '{"representative": "Paul Kewa", "phone": "+675 7456 7890"}'),

-- Case 4 Parties
('10000000-0000-0000-0000-000000000004', 'Lae Industrial Association', 'other', 'plaintiff', '{"president": "Robert Kila", "phone": "+675 472 2345"}'),
('10000000-0000-0000-0000-000000000004', 'Department of Lands - Valuation', 'government_entity', 'defendant', '{"officer": "Sarah Baki", "phone": "+675 321 4570"}'),
('10000000-0000-0000-0000-000000000004', 'ABC Manufacturing Ltd', 'company', 'other', '{"phone": "+675 472 3456", "lease_number": "SL-LAE-1234"}'),

-- Case 5 Parties
('10000000-0000-0000-0000-000000000005', 'James Tavul', 'individual', 'plaintiff', '{"phone": "+675 7567 8901", "relationship": "Eldest son"}'),
('10000000-0000-0000-0000-000000000005', 'Grace Tavul', 'individual', 'plaintiff', '{"phone": "+675 7678 9012", "relationship": "Daughter"}'),
('10000000-0000-0000-0000-000000000005', 'Peter Tavul', 'individual', 'plaintiff', '{"phone": "+675 7789 0123", "relationship": "Youngest son"}'),
('10000000-0000-0000-0000-000000000005', 'Estate of Late Michael Tavul', 'other', 'other', '{"executor": "Public Trustee", "deceased": "2024-06-15"}'),

-- Case 6 Parties
('10000000-0000-0000-0000-000000000006', 'State of Papua New Guinea', 'government_entity', 'plaintiff', '{"department": "Department of Lands"}'),
('10000000-0000-0000-0000-000000000006', 'Steven Karo', 'individual', 'defendant', '{"status": "Charged with fraud", "phone": "+675 7890 1234"}'),
('10000000-0000-0000-0000-000000000006', 'Innocent Purchaser Ltd', 'company', 'other', '{"phone": "+675 325 5678", "status": "Claimed as bona fide purchaser"}'),

-- Case 7 Parties
('10000000-0000-0000-0000-000000000007', 'PNG Mining Corporation', 'company', 'plaintiff', '{"phone": "+675 321 7890", "email": "legal@pngmining.com.pg"}'),
('10000000-0000-0000-0000-000000000007', 'Tari Landowner Association', 'other', 'other', '{"chairman": "James Haro", "phone": "+675 7901 2345"}'),
('10000000-0000-0000-0000-000000000007', 'Mineral Resources Authority', 'government_entity', 'other', '{"representative": "Mining Registrar"}');

-- ============================================
-- 4. SAMPLE DOCUMENTS
-- ============================================
INSERT INTO public.documents (case_id, title, description, file_url, file_type, file_size, document_type, uploaded_by, uploaded_at) VALUES
-- Case 1 Documents
('10000000-0000-0000-0000-000000000001', 'Survey Plan 1985 - Lot 45', 'Original survey plan showing boundaries of Lot 45, Hohola', '/placeholder/survey-plan-45.pdf', 'application/pdf', 2458000, 'survey_report', '00000000-0000-0000-0000-000000000001', '2025-01-15 10:30:00+00'),
('10000000-0000-0000-0000-000000000001', 'Survey Plan 1985 - Lot 46', 'Original survey plan showing boundaries of Lot 46, Hohola', '/placeholder/survey-plan-46.pdf', 'application/pdf', 2312000, 'survey_report', '00000000-0000-0000-0000-000000000001', '2025-01-15 10:32:00+00'),
('10000000-0000-0000-0000-000000000001', 'Writ of Summons', 'Court writ issued to defendant', '/placeholder/writ-summons.pdf', 'application/pdf', 856000, 'filing', '00000000-0000-0000-0000-000000000001', '2025-01-16 14:00:00+00'),
('10000000-0000-0000-0000-000000000001', 'Affidavit - Joseph Kome', 'Sworn affidavit from plaintiff', '/placeholder/affidavit-kome.pdf', 'application/pdf', 1234000, 'affidavit', '00000000-0000-0000-0000-000000000001', '2025-01-18 09:15:00+00'),
('10000000-0000-0000-0000-000000000001', 'Photographs - Site Visit', 'Photos taken during site inspection', '/placeholder/site-photos.jpg', 'image/jpeg', 3456000, 'evidence', '00000000-0000-0000-0000-000000000001', '2025-01-20 11:00:00+00'),

-- Case 2 Documents
('10000000-0000-0000-0000-000000000002', 'ILG Certificate', 'Incorporated Land Group Certificate', '/placeholder/ilg-cert.pdf', 'application/pdf', 1567000, 'contract', '00000000-0000-0000-0000-000000000002', '2025-01-21 08:30:00+00'),
('10000000-0000-0000-0000-000000000002', 'Clan Genealogy Report', 'Documentation of clan membership and land rights', '/placeholder/genealogy.pdf', 'application/pdf', 2890000, 'other', '00000000-0000-0000-0000-000000000002', '2025-01-21 09:00:00+00'),
('10000000-0000-0000-0000-000000000002', 'Development Proposal', 'Agricultural development project proposal', '/placeholder/dev-proposal.pdf', 'application/pdf', 4567000, 'other', '00000000-0000-0000-0000-000000000002', '2025-01-22 10:00:00+00'),
('10000000-0000-0000-0000-000000000002', 'Consultation Minutes', 'Minutes from landowner consultation meetings', '/placeholder/consultation-minutes.pdf', 'application/pdf', 1234000, 'correspondence', '00000000-0000-0000-0000-000000000002', '2025-01-25 14:30:00+00'),

-- Case 3 Documents
('10000000-0000-0000-0000-000000000003', 'Eviction Notice', 'Formal notice to vacate government land', '/placeholder/eviction-notice.pdf', 'application/pdf', 678000, 'correspondence', '00000000-0000-0000-0000-000000000001', '2025-02-01 09:00:00+00'),
('10000000-0000-0000-0000-000000000003', 'Police Report', 'Report of illegal occupation', '/placeholder/police-report.pdf', 'application/pdf', 890000, 'evidence', '00000000-0000-0000-0000-000000000003', '2025-02-02 11:00:00+00'),
('10000000-0000-0000-0000-000000000003', 'Court Application', 'Application for enforcement order', '/placeholder/court-application.pdf', 'application/pdf', 1456000, 'filing', '00000000-0000-0000-0000-000000000001', '2025-02-05 10:00:00+00'),

-- Case 4 Documents
('10000000-0000-0000-0000-000000000004', 'Rental Rate Schedule 2024', 'Current rental rates for industrial properties', '/placeholder/rental-rates-2024.pdf', 'application/pdf', 567000, 'other', '00000000-0000-0000-0000-000000000002', '2025-02-05 12:00:00+00'),
('10000000-0000-0000-0000-000000000004', 'Proposed Rates 2025', 'Proposed new rental rate schedule', '/placeholder/proposed-rates-2025.pdf', 'application/pdf', 589000, 'other', '00000000-0000-0000-0000-000000000002', '2025-02-05 12:05:00+00'),
('10000000-0000-0000-0000-000000000004', 'Objection Letters', 'Compilation of objection letters from lessees', '/placeholder/objections.pdf', 'application/pdf', 2345000, 'correspondence', '00000000-0000-0000-0000-000000000002', '2025-02-06 09:00:00+00'),

-- Case 5 Documents
('10000000-0000-0000-0000-000000000005', 'Death Certificate', 'Death certificate of late Michael Tavul', '/placeholder/death-cert.pdf', 'application/pdf', 456000, 'evidence', '00000000-0000-0000-0000-000000000002', '2024-12-11 08:00:00+00'),
('10000000-0000-0000-0000-000000000005', 'Will and Testament', 'Last will of deceased', '/placeholder/will.pdf', 'application/pdf', 789000, 'contract', '00000000-0000-0000-0000-000000000002', '2024-12-11 08:30:00+00'),
('10000000-0000-0000-0000-000000000005', 'Title Certificate', 'Freehold title certificate for the property', '/placeholder/title-cert.pdf', 'application/pdf', 1234000, 'other', '00000000-0000-0000-0000-000000000002', '2024-12-11 09:00:00+00'),
('10000000-0000-0000-0000-000000000005', 'Settlement Agreement', 'Signed settlement agreement between siblings', '/placeholder/settlement.pdf', 'application/pdf', 1567000, 'contract', '00000000-0000-0000-0000-000000000002', '2025-01-10 15:00:00+00');

-- ============================================
-- 5. SAMPLE TASKS
-- ============================================
INSERT INTO public.tasks (case_id, title, description, assigned_to, due_date, status, priority, created_by) VALUES
-- Case 1 Tasks
('10000000-0000-0000-0000-000000000001', 'Review Survey Plans', 'Compare 1985 survey plans for both lots to identify discrepancies', '00000000-0000-0000-0000-000000000004', '2025-02-20 17:00:00+00', 'in_progress', 'high', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000001', 'Draft Court Affidavit', 'Prepare affidavit for upcoming court hearing', '00000000-0000-0000-0000-000000000001', '2025-02-18 17:00:00+00', 'pending', 'high', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000001', 'Engage Independent Surveyor', 'Contract independent surveyor for site inspection', '00000000-0000-0000-0000-000000000003', '2025-02-25 17:00:00+00', 'pending', 'medium', '00000000-0000-0000-0000-000000000001'),

-- Case 2 Tasks
('10000000-0000-0000-0000-000000000002', 'Verify ILG Registration', 'Confirm ILG is properly registered and up to date', '00000000-0000-0000-0000-000000000003', '2025-02-28 17:00:00+00', 'completed', 'medium', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000002', 'Schedule Community Consultation', 'Arrange meetings with all affected clan groups', '00000000-0000-0000-0000-000000000002', '2025-03-05 17:00:00+00', 'in_progress', 'high', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000002', 'Prepare Ministerial Brief', 'Draft briefing paper for Minister\'s approval', '00000000-0000-0000-0000-000000000002', '2025-03-15 17:00:00+00', 'pending', 'medium', '00000000-0000-0000-0000-000000000002'),

-- Case 3 Tasks
('10000000-0000-0000-0000-000000000003', 'Prepare Court Documents', 'File application for enforcement order', '00000000-0000-0000-0000-000000000001', '2025-02-15 17:00:00+00', 'overdue', 'high', '00000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000003', 'Coordinate with Police', 'Arrange police presence for eviction', '00000000-0000-0000-0000-000000000003', '2025-02-20 17:00:00+00', 'pending', 'high', '00000000-0000-0000-0000-000000000003'),

-- Case 4 Tasks
('10000000-0000-0000-0000-000000000004', 'Analyze Market Rates', 'Research comparable rental rates in other industrial areas', '00000000-0000-0000-0000-000000000004', '2025-02-28 17:00:00+00', 'in_progress', 'medium', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000004', 'Schedule Mediation Session', 'Organize mediation meeting with all parties', '00000000-0000-0000-0000-000000000002', '2025-03-10 17:00:00+00', 'pending', 'medium', '00000000-0000-0000-0000-000000000002'),

-- Case 5 Tasks (Completed)
('10000000-0000-0000-0000-000000000005', 'Verify Will Authenticity', 'Confirm will is properly executed and witnessed', '00000000-0000-0000-0000-000000000002', '2024-12-15 17:00:00+00', 'completed', 'high', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000005', 'Draft Settlement Terms', 'Prepare settlement agreement for all parties', '00000000-0000-0000-0000-000000000002', '2024-12-20 17:00:00+00', 'completed', 'medium', '00000000-0000-0000-0000-000000000002'),

-- Case 6 Tasks
('10000000-0000-0000-0000-000000000006', 'Forensic Document Analysis', 'Send documents for forensic examination', '00000000-0000-0000-0000-000000000001', '2025-02-15 17:00:00+00', 'in_progress', 'high', '00000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000006', 'Liaise with Police Investigation', 'Coordinate with fraud squad on criminal case', '00000000-0000-0000-0000-000000000001', '2025-02-25 17:00:00+00', 'pending', 'high', '00000000-0000-0000-0000-000000000003'),

-- Case 7 Tasks
('10000000-0000-0000-0000-000000000007', 'Review Environmental Report', 'Assess environmental impact assessment compliance', '00000000-0000-0000-0000-000000000002', '2025-03-01 17:00:00+00', 'in_progress', 'high', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000007', 'Prepare Tribunal Submission', 'Draft submission for Land Board tribunal', '00000000-0000-0000-0000-000000000002', '2025-03-10 17:00:00+00', 'pending', 'high', '00000000-0000-0000-0000-000000000001');

-- ============================================
-- 6. SAMPLE EVENTS
-- ============================================
INSERT INTO public.events (case_id, event_type, title, description, event_date, location, created_by) VALUES
-- Case 1 Events
('10000000-0000-0000-0000-000000000001', 'hearing', 'Preliminary Hearing', 'First hearing to determine procedural matters', '2025-03-15 10:00:00+00', 'National Court, Waigani', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000001', 'filing_deadline', 'Affidavit Filing Deadline', 'Last date to file sworn affidavits', '2025-03-10 16:00:00+00', 'National Court Registry', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000001', 'meeting', 'Site Inspection', 'Court-ordered site inspection with surveyor', '2025-03-08 09:00:00+00', 'Lot 45-46, Hohola', '00000000-0000-0000-0000-000000000001'),

-- Case 2 Events
('10000000-0000-0000-0000-000000000002', 'meeting', 'Community Consultation - First Session', 'Initial meeting with Bougainville Clan Group', '2025-03-05 14:00:00+00', 'Madang Community Hall', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000002', 'meeting', 'Community Consultation - Second Session', 'Follow-up meeting with all stakeholders', '2025-03-12 14:00:00+00', 'Madang Community Hall', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000002', 'response_deadline', 'Objection Period Closes', 'Last date for objections to land conversion', '2025-03-20 16:00:00+00', 'DLPP Head Office', '00000000-0000-0000-0000-000000000002'),

-- Case 3 Events
('10000000-0000-0000-0000-000000000003', 'hearing', 'Enforcement Application Hearing', 'Court hearing for eviction enforcement order', '2025-02-22 09:30:00+00', 'Mount Hagen District Court', '00000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000003', 'response_deadline', 'Response to Application', 'Defendant response due', '2025-02-18 16:00:00+00', 'District Court Registry', '00000000-0000-0000-0000-000000000003'),

-- Case 4 Events
('10000000-0000-0000-0000-000000000004', 'meeting', 'Mediation Session', 'Mediation between DLPP and Industrial Association', '2025-03-10 10:00:00+00', 'DLPP Conference Room, Lae', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000004', 'meeting', 'Follow-up Mediation', 'Second mediation session if required', '2025-03-17 10:00:00+00', 'DLPP Conference Room, Lae', '00000000-0000-0000-0000-000000000002'),

-- Case 5 Events (Historical)
('10000000-0000-0000-0000-000000000005', 'meeting', 'Family Settlement Meeting', 'Negotiation between siblings', '2025-01-08 14:00:00+00', 'DLPP Office, Rabaul', '00000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000005', 'other', 'Settlement Signing', 'Formal signing of settlement agreement', '2025-01-10 11:00:00+00', 'DLPP Office, Rabaul', '00000000-0000-0000-0000-000000000002'),

-- Case 6 Events
('10000000-0000-0000-0000-000000000006', 'hearing', 'Judgment Delivery', 'Court to deliver judgment on civil claim', '2025-03-05 10:00:00+00', 'National Court, Waigani', '00000000-0000-0000-0000-000000000003'),

-- Case 7 Events
('10000000-0000-0000-0000-000000000007', 'hearing', 'Land Board Tribunal Hearing', 'Tribunal hearing for mining lease approval', '2025-03-18 09:00:00+00', 'Land Board, DLPP Head Office', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000007', 'filing_deadline', 'Submission Deadline', 'Final submissions to Land Board', '2025-03-12 16:00:00+00', 'DLPP Head Office', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000007', 'meeting', 'Landowner Presentation', 'Landowners to present their position', '2025-03-15 14:00:00+00', 'Tari District Office', '00000000-0000-0000-0000-000000000001');

-- ============================================
-- 7. SAMPLE LAND PARCELS
-- ============================================
INSERT INTO public.land_parcels (case_id, parcel_number, location, coordinates, area_sqm, survey_plan_url, notes) VALUES
-- Case 1 Land Parcels
('10000000-0000-0000-0000-000000000001',
 'LOT 45, SEC 38, HOHOLA',
 'Hohola, National Capital District',
 '{"type": "Polygon", "coordinates": [[[147.1234, -9.4567], [147.1245, -9.4567], [147.1245, -9.4578], [147.1234, -9.4578], [147.1234, -9.4567]]]}',
 800.00,
 '/placeholder/survey-lot-45.pdf',
 'Disputed boundary on eastern side with Lot 46'),

('10000000-0000-0000-0000-000000000001',
 'LOT 46, SEC 38, HOHOLA',
 'Hohola, National Capital District',
 '{"type": "Polygon", "coordinates": [[[147.1245, -9.4567], [147.1256, -9.4567], [147.1256, -9.4578], [147.1245, -9.4578], [147.1245, -9.4567]]]}',
 750.00,
 '/placeholder/survey-lot-46.pdf',
 'Disputed boundary on western side with Lot 45'),

-- Case 2 Land Parcel
('10000000-0000-0000-0000-000000000002',
 'CUSTOMARY LAND - MADANG',
 'Bogia District, Madang Province',
 '{"type": "Polygon", "coordinates": [[[145.1234, -4.5678], [145.1334, -4.5678], [145.1334, -4.5778], [145.1234, -4.5778], [145.1234, -4.5678]]]}',
 250000.00,
 '/placeholder/customary-land-madang.pdf',
 'Customary land owned by Bougainville Clan Group - suitable for agriculture'),

-- Case 3 Land Parcel
('10000000-0000-0000-0000-000000000003',
 'STATE LEASE SL-WHP-8745',
 'Mount Hagen, Western Highlands Province',
 '{"type": "Polygon", "coordinates": [[[144.2345, -5.6789], [144.2445, -5.6789], [144.2445, -5.6889], [144.2345, -5.6889], [144.2345, -5.6789]]]}',
 5000.00,
 '/placeholder/state-lease-hagen.pdf',
 'Government land illegally occupied since 2024'),

-- Case 4 Land Parcels
('10000000-0000-0000-0000-000000000004',
 'INDUSTRIAL LOT 12, LAE',
 'Lae Industrial Estate, Morobe Province',
 '{"type": "Polygon", "coordinates": [[[147.0123, -6.7234], [147.0223, -6.7234], [147.0223, -6.7334], [147.0123, -6.7334], [147.0123, -6.7234]]]}',
 10000.00,
 '/placeholder/industrial-lae-12.pdf',
 'Current rental: K15,000/year, Proposed: K25,000/year'),

('10000000-0000-0000-0000-000000000004',
 'INDUSTRIAL LOT 13, LAE',
 'Lae Industrial Estate, Morobe Province',
 '{"type": "Polygon", "coordinates": [[[147.0223, -6.7234], [147.0323, -6.7234], [147.0323, -6.7334], [147.0223, -6.7334], [147.0223, -6.7234]]]}',
 12000.00,
 '/placeholder/industrial-lae-13.pdf',
 'Current rental: K18,000/year, Proposed: K30,000/year'),

-- Case 5 Land Parcel
('10000000-0000-0000-0000-000000000005',
 'FREEHOLD TITLE VOL 45 FOL 123',
 'Rabaul Town, East New Britain Province',
 '{"type": "Polygon", "coordinates": [[[152.1234, -4.2345], [152.1334, -4.2345], [152.1334, -4.2445], [152.1234, -4.2445], [152.1234, -4.2345]]]}',
 1200.00,
 '/placeholder/freehold-rabaul.pdf',
 'Estate of late Michael Tavul - settled between 3 siblings'),

-- Case 7 Land Parcel
('10000000-0000-0000-0000-000000000007',
 'MINING LEASE APPLICATION MLA-2025-034',
 'Tari District, Southern Highlands Province',
 '{"type": "Polygon", "coordinates": [[[142.9123, -5.8234], [143.0123, -5.8234], [143.0123, -5.9234], [142.9123, -5.9234], [142.9123, -5.8234]]]}',
 5000000.00,
 '/placeholder/mining-lease-tari.pdf',
 'Special Mining Lease over customary land - gold deposits identified');

-- ============================================
-- 8. SAMPLE CASE HISTORY (Automatic via triggers)
-- ============================================
-- Note: Case history is automatically created by database triggers
-- The following are additional manual entries for demonstration

INSERT INTO public.case_history (case_id, action, description, performed_by, metadata) VALUES
('10000000-0000-0000-0000-000000000001', 'Status Changed', 'Status changed from under_review to in_court', '00000000-0000-0000-0000-000000000001', '{"previous_status": "under_review", "new_status": "in_court", "date": "2025-02-01"}'),
('10000000-0000-0000-0000-000000000001', 'Document Uploaded', 'Survey plans uploaded to case', '00000000-0000-0000-0000-000000000001', '{"document_count": 2, "type": "survey_report"}'),
('10000000-0000-0000-0000-000000000001', 'Party Added', 'PNG Surveying Ltd added as witness', '00000000-0000-0000-0000-000000000001', '{"party_name": "PNG Surveying Ltd", "role": "witness"}'),

('10000000-0000-0000-0000-000000000005', 'Status Changed', 'Status changed from mediation to settled', '00000000-0000-0000-0000-000000000002', '{"previous_status": "mediation", "new_status": "settled", "date": "2025-01-10"}'),
('10000000-0000-0000-0000-000000000005', 'Settlement Reached', 'All parties signed settlement agreement', '00000000-0000-0000-0000-000000000002', '{"settlement_date": "2025-01-10", "parties": 3}'),

('10000000-0000-0000-0000-000000000006', 'Status Changed', 'Status changed from in_court to judgment', '00000000-0000-0000-0000-000000000003', '{"previous_status": "in_court", "new_status": "judgment", "date": "2025-02-15"}');

-- ============================================
-- 9. SAMPLE EVIDENCE
-- ============================================
INSERT INTO public.evidence (case_id, title, description, file_url, media_type, captured_at, gps_location, captured_by) VALUES
-- Case 1 Evidence
('10000000-0000-0000-0000-000000000001',
 'Site Photo 1 - Disputed Boundary',
 'Photograph showing fence line between Lot 45 and 46',
 '/placeholder/evidence-boundary-1.jpg',
 'photo',
 '2025-01-20 10:30:00+00',
 '{"latitude": -9.4572, "longitude": 147.1240, "accuracy": 5}',
 '00000000-0000-0000-0000-000000000004'),

('10000000-0000-0000-0000-000000000001',
 'Site Photo 2 - Existing Structure',
 'Building constructed near disputed boundary',
 '/placeholder/evidence-structure.jpg',
 'photo',
 '2025-01-20 10:45:00+00',
 '{"latitude": -9.4573, "longitude": 147.1242, "accuracy": 5}',
 '00000000-0000-0000-0000-000000000004'),

('10000000-0000-0000-0000-000000000001',
 'Witness Interview - Recording',
 'Audio recording of neighbor testimony',
 '/placeholder/witness-audio.mp3',
 'audio',
 '2025-01-22 14:00:00+00',
 '{"latitude": -9.4570, "longitude": 147.1238}',
 '00000000-0000-0000-0000-000000000001'),

-- Case 3 Evidence
('10000000-0000-0000-0000-000000000003',
 'Illegal Settlement Photo 1',
 'Overview of unauthorized structures',
 '/placeholder/settlement-photo-1.jpg',
 'photo',
 '2025-02-01 09:30:00+00',
 '{"latitude": -5.6845, "longitude": 144.2390}',
 '00000000-0000-0000-0000-000000000003'),

('10000000-0000-0000-0000-000000000003',
 'Illegal Settlement Photo 2',
 'Close-up of permanent structures',
 '/placeholder/settlement-photo-2.jpg',
 'photo',
 '2025-02-01 09:45:00+00',
 '{"latitude": -5.6847, "longitude": 144.2392}',
 '00000000-0000-0000-0000-000000000003'),

('10000000-0000-0000-0000-000000000003',
 'Drone Footage - Settlement Area',
 'Aerial video of full settlement extent',
 '/placeholder/drone-video.mp4',
 'video',
 '2025-02-02 08:00:00+00',
 '{"latitude": -5.6840, "longitude": 144.2385}',
 '00000000-0000-0000-0000-000000000004'),

-- Case 6 Evidence
('10000000-0000-0000-0000-000000000006',
 'Forged Document - Sample 1',
 'Suspected forged title certificate',
 '/placeholder/forged-doc-1.jpg',
 'photo',
 '2025-01-26 11:00:00+00',
 NULL,
 '00000000-0000-0000-0000-000000000003'),

('10000000-0000-0000-0000-000000000006',
 'Forensic Analysis Report',
 'Expert report on document forgery',
 '/placeholder/forensic-report.pdf',
 'other',
 '2025-02-10 09:00:00+00',
 NULL,
 '00000000-0000-0000-0000-000000000001');

-- ============================================
-- 10. SAMPLE NOTIFICATIONS
-- ============================================
INSERT INTO public.notifications (user_id, case_id, title, message, type, read) VALUES
-- Notifications for John Kila
('00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000001',
 'Upcoming Hearing - Case DLPP-2025-001',
 'Preliminary hearing scheduled for March 15, 2025 at 10:00 AM',
 'event',
 false),

('00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000001',
 'Deadline Approaching - Affidavit Filing',
 'Affidavit filing deadline is March 10, 2025 - 3 days remaining',
 'deadline',
 false),

('00000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000003',
 'Overdue Task - Case DLPP-2025-003',
 'Task "Prepare Court Documents" is overdue',
 'task',
 false),

-- Notifications for Mary Tau
('00000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000002',
 'Community Consultation Scheduled',
 'First consultation meeting on March 5, 2025 at 2:00 PM',
 'event',
 false),

('00000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000004',
 'Mediation Session Confirmed',
 'Mediation with Industrial Association confirmed for March 10',
 'event',
 false),

('00000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000005',
 'Case Settled - DLPP-2025-005',
 'Settlement agreement signed. Case can be closed.',
 'case_update',
 true),

-- Notifications for Peter Wari
('00000000-0000-0000-0000-000000000003',
 '10000000-0000-0000-0000-000000000003',
 'Court Hearing Next Week',
 'Enforcement hearing scheduled for February 22, 2025',
 'event',
 false),

-- Notifications for Sarah Baki
('00000000-0000-0000-0000-000000000004',
 '10000000-0000-0000-0000-000000000001',
 'Survey Review Required',
 'Please review survey plans for Case DLPP-2025-001',
 'task',
 false),

('00000000-0000-0000-0000-000000000004',
 '10000000-0000-0000-0000-000000000004',
 'Market Analysis Due',
 'Rental rate market analysis due by February 28',
 'deadline',
 false);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '===================================================';
    RAISE NOTICE 'Sample data successfully inserted!';
    RAISE NOTICE '===================================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - 5 User Profiles (legal officers, registrar, survey officer, director)';
    RAISE NOTICE '  - 7 Legal Cases (various types and statuses)';
    RAISE NOTICE '  - 24 Parties (individuals, companies, government entities)';
    RAISE NOTICE '  - 19 Documents (PDFs, images, evidence files)';
    RAISE NOTICE '  - 17 Tasks (various priorities and statuses)';
    RAISE NOTICE '  - 19 Events (hearings, deadlines, meetings)';
    RAISE NOTICE '  - 8 Land Parcels (with coordinates and details)';
    RAISE NOTICE '  - 6 Case History Entries';
    RAISE NOTICE '  - 8 Evidence Items (photos, videos, audio)';
    RAISE NOTICE '  - 9 Notifications (for various users)';
    RAISE NOTICE '===================================================';
    RAISE NOTICE 'You can now explore the system with realistic data!';
    RAISE NOTICE '===================================================';
END $$;
