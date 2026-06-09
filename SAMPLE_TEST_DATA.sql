-- ============================================
-- DLPP Legal CMS - SAMPLE TEST DATA
-- ============================================
-- All test data is prefixed with "TEST_" for easy identification
-- To delete all test data, run: DELETE_TEST_DATA.sql
--
-- Generated: January 2, 2026
-- ============================================

-- ============================================
-- 1. TEST USERS (Create in Supabase Auth first, then run this)
-- ============================================
-- NOTE: You must first create these users in Supabase Dashboard > Authentication > Users
-- Then use the generated UUIDs below

-- After creating users in Auth, insert their profiles:
INSERT INTO users (id, email, full_name, phone, role, is_active) VALUES
-- Replace these UUIDs with actual UUIDs from Supabase Auth after creating users
('00000000-0000-0000-0000-000000000001', 'test.admin@lands.gov.pg', 'TEST_Admin User', '+675 7000 0001', 'admin', true),
('00000000-0000-0000-0000-000000000002', 'test.director@lands.gov.pg', 'TEST_Director James', '+675 7000 0002', 'director', true),
('00000000-0000-0000-0000-000000000003', 'test.secretary@lands.gov.pg', 'TEST_Secretary Mary', '+675 7000 0003', 'secretary', true),
('00000000-0000-0000-0000-000000000004', 'test.legal.manager@lands.gov.pg', 'TEST_Legal Manager John', '+675 7000 0004', 'legal_manager', true),
('00000000-0000-0000-0000-000000000005', 'test.lawyer1@lands.gov.pg', 'TEST_Lawyer Peter', '+675 7000 0005', 'lawyer', true),
('00000000-0000-0000-0000-000000000006', 'test.lawyer2@lands.gov.pg', 'TEST_Lawyer Sarah', '+675 7000 0006', 'lawyer', true),
('00000000-0000-0000-0000-000000000007', 'test.officer@lands.gov.pg', 'TEST_Registry Officer', '+675 7000 0007', 'officer', true),
('00000000-0000-0000-0000-000000000008', 'test.clerk@lands.gov.pg', 'TEST_Registry Clerk', '+675 7000 0008', 'clerk', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. TEST CASES (10 sample cases across all workflow stages)
-- ============================================
INSERT INTO cases (id, case_number, title, description, status, case_type, priority, workflow_status, region, created_at) VALUES

-- Case 1: New case just registered (Step 1)
('11111111-1111-1111-1111-111111111101',
 'TEST_LC-2026-001',
 'TEST_Land Boundary Dispute - Kokopo District',
 'Test case for boundary dispute between two customary landowner groups in Kokopo. The dispute involves approximately 50 hectares of land near the main highway.',
 'open', 'boundary_dispute', 'high', 'registered', 'East New Britain', NOW() - INTERVAL '30 days'),

-- Case 2: Directions issued (Step 2)
('11111111-1111-1111-1111-111111111102',
 'TEST_LC-2026-002',
 'TEST_Illegal Land Grab - Lae City',
 'Test case involving alleged illegal occupation of state land in Lae Industrial area. Multiple structures built without proper authorization.',
 'open', 'illegal_occupation', 'urgent', 'directions_issued', 'Morobe', NOW() - INTERVAL '25 days'),

-- Case 3: Allocated to lawyer (Step 3)
('11111111-1111-1111-1111-111111111103',
 'TEST_LC-2026-003',
 'TEST_Title Registration Challenge - Port Moresby',
 'Test case challenging the validity of a land title registration in Gordons. Plaintiff claims fraud in the registration process.',
 'open', 'title_dispute', 'medium', 'allocated', 'NCD', NOW() - INTERVAL '20 days'),

-- Case 4: In litigation (Step 4)
('11111111-1111-1111-1111-111111111104',
 'TEST_LC-2026-004',
 'TEST_Customary Land Ownership - Mt Hagen',
 'Test case for customary land ownership determination. Three clans claiming ownership of ceremonial grounds.',
 'in_progress', 'customary_land', 'high', 'in_litigation', 'Western Highlands', NOW() - INTERVAL '60 days'),

-- Case 5: Compliance tracking (Step 5)
('11111111-1111-1111-1111-111111111105',
 'TEST_LC-2026-005',
 'TEST_Government Lease Violation - Madang',
 'Test case for violation of government lease conditions. Lessee failed to develop land within stipulated timeframe.',
 'in_progress', 'lease_violation', 'medium', 'compliance_monitoring', 'Madang', NOW() - INTERVAL '90 days'),

-- Case 6: Pending closure (Step 6)
('11111111-1111-1111-1111-111111111106',
 'TEST_LC-2026-006',
 'TEST_Survey Dispute Resolution - Wewak',
 'Test case for disputed survey boundaries resolved through mediation. Awaiting final documentation.',
 'resolved', 'survey_dispute', 'low', 'pending_closure', 'East Sepik', NOW() - INTERVAL '120 days'),

-- Case 7: Closed case
('11111111-1111-1111-1111-111111111107',
 'TEST_LC-2025-007',
 'TEST_Completed Land Compensation - Kimbe',
 'Test case for land compensation that has been fully resolved and closed.',
 'closed', 'compensation', 'medium', 'closed', 'West New Britain', NOW() - INTERVAL '180 days'),

-- Case 8: High priority urgent case
('11111111-1111-1111-1111-111111111108',
 'TEST_LC-2026-008',
 'TEST_Urgent Eviction Order - Rabaul',
 'Test urgent case requiring immediate attention. Illegal settlers on government reserved land near airport.',
 'open', 'eviction', 'urgent', 'in_litigation', 'East New Britain', NOW() - INTERVAL '5 days'),

-- Case 9: Complex multi-party case
('11111111-1111-1111-1111-111111111109',
 'TEST_LC-2026-009',
 'TEST_Multi-Party Land Claim - Goroka',
 'Test complex case with multiple claimants and government agencies involved. Land zoned for public infrastructure.',
 'in_progress', 'multiple_claims', 'high', 'allocated', 'Eastern Highlands', NOW() - INTERVAL '45 days'),

-- Case 10: Appeal case
('11111111-1111-1111-1111-111111111110',
 'TEST_LC-2026-010',
 'TEST_Appeal Against Land Board Decision - Alotau',
 'Test appeal case against Provincial Land Board decision. Appellant claims procedural irregularities.',
 'open', 'appeal', 'medium', 'directions_issued', 'Milne Bay', NOW() - INTERVAL '15 days')

ON CONFLICT (id) DO UPDATE SET
  case_number = EXCLUDED.case_number,
  title = EXCLUDED.title;

-- ============================================
-- 3. TEST DIRECTIONS (Step 2 data)
-- ============================================
INSERT INTO directions (id, case_id, direction_number, source, subject, content, priority, due_date, assigned_to, status, issued_date) VALUES

('22222222-2222-2222-2222-222222222201',
 '11111111-1111-1111-1111-111111111102',
 'TEST_DIR-2026-001',
 'Secretary DLPP',
 'TEST_Investigate Illegal Occupation',
 'Direct the Legal Division to investigate the alleged illegal occupation and prepare a comprehensive report on the current status of the land parcel. Include site inspection findings and recommendations for legal action.',
 'urgent',
 NOW() + INTERVAL '14 days',
 'TEST_Legal Manager John',
 'pending',
 NOW() - INTERVAL '20 days'),

('22222222-2222-2222-2222-222222222202',
 '11111111-1111-1111-1111-111111111103',
 'TEST_DIR-2026-002',
 'Director Legal',
 'TEST_Review Title Registration Documents',
 'Review all documents relating to the title registration process. Identify any irregularities and prepare a legal opinion on the validity of the current registration.',
 'high',
 NOW() + INTERVAL '21 days',
 'TEST_Lawyer Peter',
 'in_progress',
 NOW() - INTERVAL '15 days'),

('22222222-2222-2222-2222-222222222203',
 '11111111-1111-1111-1111-111111111110',
 'TEST_DIR-2026-003',
 'Legal Manager',
 'TEST_Prepare Appeal Response',
 'Prepare a comprehensive response to the appeal. Review the original Land Board decision and identify grounds for upholding or revising the decision.',
 'medium',
 NOW() + INTERVAL '30 days',
 'TEST_Lawyer Sarah',
 'pending',
 NOW() - INTERVAL '10 days'),

('22222222-2222-2222-2222-222222222204',
 '11111111-1111-1111-1111-111111111108',
 'TEST_DIR-2026-004',
 'Secretary DLPP',
 'TEST_Urgent Eviction Proceedings',
 'Initiate urgent eviction proceedings. Coordinate with Police and Provincial Administration for enforcement support.',
 'urgent',
 NOW() + INTERVAL '7 days',
 'TEST_Legal Manager John',
 'in_progress',
 NOW() - INTERVAL '3 days')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. TEST CASE DELEGATIONS (Step 3 data)
-- ============================================
INSERT INTO case_delegations (id, case_id, delegated_to, instructions, status, delegation_date) VALUES

('33333333-3333-3333-3333-333333333301',
 '11111111-1111-1111-1111-111111111103',
 'TEST_Lawyer Peter',
 'Take carriage of this matter. Review all documentation and prepare statement of claim if fraud is established.',
 'active',
 NOW() - INTERVAL '18 days'),

('33333333-3333-3333-3333-333333333302',
 '11111111-1111-1111-1111-111111111104',
 'TEST_Lawyer Sarah',
 'Handle customary land determination proceedings. Coordinate with Provincial Lands Office for historical records.',
 'active',
 NOW() - INTERVAL '55 days'),

('33333333-3333-3333-3333-333333333303',
 '11111111-1111-1111-1111-111111111109',
 'TEST_Lawyer Peter',
 'Lead counsel on this multi-party matter. Coordinate with other government agencies and prepare consolidated response.',
 'active',
 NOW() - INTERVAL '40 days'),

('33333333-3333-3333-3333-333333333304',
 '11111111-1111-1111-1111-111111111108',
 'TEST_Lawyer Sarah',
 'Urgent matter - expedite eviction proceedings. Daily progress reports required.',
 'active',
 NOW() - INTERVAL '4 days')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. TEST FILINGS (Step 4 data)
-- ============================================
INSERT INTO filings (id, case_id, filing_type, title, description, prepared_date, status) VALUES

('44444444-4444-4444-4444-444444444401',
 '11111111-1111-1111-1111-111111111104',
 'statement_of_claim',
 'TEST_Statement of Claim - Customary Land',
 'Test filing: Statement of claim asserting State interest in disputed ceremonial grounds based on historical land acquisition records.',
 NOW() - INTERVAL '50 days',
 'filed'),

('44444444-4444-4444-4444-444444444402',
 '11111111-1111-1111-1111-111111111104',
 'affidavit',
 'TEST_Affidavit of Provincial Lands Officer',
 'Test filing: Affidavit detailing historical land records and survey information.',
 NOW() - INTERVAL '45 days',
 'filed'),

('44444444-4444-4444-4444-444444444403',
 '11111111-1111-1111-1111-111111111108',
 'motion',
 'TEST_Motion for Urgent Eviction',
 'Test filing: Motion seeking urgent eviction orders against illegal settlers on government reserved land.',
 NOW() - INTERVAL '4 days',
 'filed'),

('44444444-4444-4444-4444-444444444404',
 '11111111-1111-1111-1111-111111111103',
 'legal_opinion',
 'TEST_Legal Opinion on Title Validity',
 'Test filing: Legal opinion analyzing the validity of the disputed title registration.',
 NOW() - INTERVAL '10 days',
 'draft'),

('44444444-4444-4444-4444-444444444405',
 '11111111-1111-1111-1111-111111111105',
 'notice',
 'TEST_Notice of Lease Termination',
 'Test filing: Formal notice of lease termination due to non-compliance with development conditions.',
 NOW() - INTERVAL '80 days',
 'served')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. TEST COMPLIANCE TRACKING (Step 5 data)
-- ============================================
INSERT INTO compliance_tracking (id, case_id, court_order_description, responsible_division, compliance_deadline, compliance_status, compliance_notes) VALUES

('55555555-5555-5555-5555-555555555501',
 '11111111-1111-1111-1111-111111111105',
 'TEST_Court Order: Vacate premises within 60 days',
 'Lands Administration',
 NOW() + INTERVAL '30 days',
 'pending',
 'Lessee has been formally notified. Monitoring compliance progress.'),

('55555555-5555-5555-5555-555555555502',
 '11111111-1111-1111-1111-111111111104',
 'TEST_Court Order: Submit clan genealogy records',
 'Legal Division',
 NOW() + INTERVAL '14 days',
 'in_progress',
 'Coordinating with claimant groups to obtain authenticated genealogy records.'),

('55555555-5555-5555-5555-555555555503',
 '11111111-1111-1111-1111-111111111106',
 'TEST_Mediation Agreement: Register boundary markers',
 'Survey Division',
 NOW() - INTERVAL '7 days',
 'completed',
 'All boundary markers installed and verified. Awaiting final sign-off.'),

('55555555-5555-5555-5555-555555555504',
 '11111111-1111-1111-1111-111111111108',
 'TEST_Emergency Order: Cease all construction',
 'Lands Enforcement',
 NOW() - INTERVAL '2 days',
 'complied',
 'Construction has ceased. Structures identified for removal pending eviction order.')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. TEST COMMUNICATIONS & ALERTS (Step 7 + Alert System)
-- ============================================
INSERT INTO communications (id, case_id, communication_type, direction, party_type, party_name, subject, content, recipient_role, priority, response_status, communication_date) VALUES

-- Regular communications (Step 7)
('66666666-6666-6666-6666-666666666601',
 '11111111-1111-1111-1111-111111111107',
 'notification',
 'outgoing',
 'landowner',
 'TEST_Kokopo Land Group Inc.',
 'TEST_Case Resolution Notification',
 'This is to notify you that your land compensation case has been resolved. Please contact our office to collect final documentation.',
 NULL,
 'medium',
 'sent',
 NOW() - INTERVAL '175 days'),

('66666666-6666-6666-6666-666666666602',
 '11111111-1111-1111-1111-111111111106',
 'letter',
 'outgoing',
 'both_parties',
 'TEST_All Parties',
 'TEST_Mediation Outcome Letter',
 'Formal notification of successful mediation outcome. All parties are requested to attend final documentation signing.',
 NULL,
 'medium',
 'sent',
 NOW() - INTERVAL '10 days'),

-- Alerts (for testing Alert System)
('66666666-6666-6666-6666-666666666603',
 '11111111-1111-1111-1111-111111111108',
 'alert',
 NULL,
 NULL,
 NULL,
 'TEST_URGENT: Eviction Resistance Expected',
 'Intelligence suggests illegal settlers may resist eviction. Recommend police escort for enforcement team. Requesting Director guidance.',
 'director',
 'urgent',
 'pending',
 NOW() - INTERVAL '2 days'),

('66666666-6666-6666-6666-666666666604',
 '11111111-1111-1111-1111-111111111104',
 'alert',
 NULL,
 NULL,
 NULL,
 'TEST_Legal Opinion Required',
 'Complex customary law issues arising. Need Legal Manager review of applicable precedents before proceeding with submissions.',
 'legal_manager',
 'high',
 'pending',
 NOW() - INTERVAL '5 days'),

('66666666-6666-6666-6666-666666666605',
 '11111111-1111-1111-1111-111111111102',
 'alert',
 NULL,
 NULL,
 NULL,
 'TEST_Budget Approval Needed',
 'Site inspection requires travel funding approval. Estimated cost K5,000 for team of 4 for 3 days in Lae.',
 'secretary',
 'medium',
 'responded',
 NOW() - INTERVAL '20 days'),

('66666666-6666-6666-6666-666666666606',
 '11111111-1111-1111-1111-111111111109',
 'alert',
 NULL,
 NULL,
 NULL,
 'TEST_Inter-Agency Coordination',
 'Multiple government agencies involved. Recommend Secretary-level meeting to coordinate positions before court appearance.',
 'secretary',
 'high',
 'pending',
 NOW() - INTERVAL '3 days')

ON CONFLICT (id) DO NOTHING;

-- Update the responded alert with a response
UPDATE communications
SET response = 'Approved. Use Legal Division operational budget code LD-2026-TRAVEL. Ensure proper acquittal within 14 days of return.',
    responded_at = NOW() - INTERVAL '18 days',
    response_status = 'responded'
WHERE id = '66666666-6666-6666-6666-666666666605';

-- ============================================
-- 8. TEST DOCUMENTS
-- ============================================
INSERT INTO documents (id, case_id, title, description, file_type, uploaded_at) VALUES

('77777777-7777-7777-7777-777777777701',
 '11111111-1111-1111-1111-111111111101',
 'TEST_Boundary Dispute Complaint Letter',
 'Initial complaint letter from affected landowner group',
 'application/pdf',
 NOW() - INTERVAL '30 days'),

('77777777-7777-7777-7777-777777777702',
 '11111111-1111-1111-1111-111111111101',
 'TEST_Survey Plan SP-2025-1234',
 'Survey plan showing disputed boundary lines',
 'application/pdf',
 NOW() - INTERVAL '28 days'),

('77777777-7777-7777-7777-777777777703',
 '11111111-1111-1111-1111-111111111102',
 'TEST_Site Inspection Report',
 'Detailed report from site inspection with photographs',
 'application/pdf',
 NOW() - INTERVAL '22 days'),

('77777777-7777-7777-7777-777777777704',
 '11111111-1111-1111-1111-111111111103',
 'TEST_Title Search Certificate',
 'Official title search certificate from Lands Registry',
 'application/pdf',
 NOW() - INTERVAL '19 days'),

('77777777-7777-7777-7777-777777777705',
 '11111111-1111-1111-1111-111111111104',
 'TEST_Clan Genealogy Chart',
 'Genealogy chart submitted by primary claimant group',
 'image/png',
 NOW() - INTERVAL '58 days'),

('77777777-7777-7777-7777-777777777706',
 '11111111-1111-1111-1111-111111111105',
 'TEST_Lease Agreement Copy',
 'Copy of original government lease agreement',
 'application/pdf',
 NOW() - INTERVAL '88 days'),

('77777777-7777-7777-7777-777777777707',
 '11111111-1111-1111-1111-111111111108',
 'TEST_Aerial Photographs',
 'Recent aerial photographs showing illegal structures',
 'image/jpeg',
 NOW() - INTERVAL '5 days')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 9. TEST PARTIES
-- ============================================
INSERT INTO parties (id, case_id, name, party_type, role, contact_info) VALUES

('88888888-8888-8888-8888-888888888801',
 '11111111-1111-1111-1111-111111111101',
 'TEST_Kokopo Land Group Inc.',
 'landowner_group',
 'plaintiff',
 '{"phone": "+675 7111 1111", "email": "kokopolandgroup@gmail.com", "address": "PO Box 123, Kokopo"}'),

('88888888-8888-8888-8888-888888888802',
 '11111111-1111-1111-1111-111111111101',
 'TEST_Raluana Clan Association',
 'landowner_group',
 'defendant',
 '{"phone": "+675 7222 2222", "email": "raluanaclan@gmail.com", "address": "PO Box 456, Rabaul"}'),

('88888888-8888-8888-8888-888888888803',
 '11111111-1111-1111-1111-111111111103',
 'TEST_John Waim',
 'individual',
 'plaintiff',
 '{"phone": "+675 7333 3333", "email": "jwaim@gmail.com", "address": "Section 45, Lot 12, Gordons, NCD"}'),

('88888888-8888-8888-8888-888888888804',
 '11111111-1111-1111-1111-111111111104',
 'TEST_Hagen Valley Clan',
 'clan',
 'claimant',
 '{"phone": "+675 7444 4444", "address": "Mt Hagen, Western Highlands"}'),

('88888888-8888-8888-8888-888888888805',
 '11111111-1111-1111-1111-111111111104',
 'TEST_Kuta Tribe',
 'clan',
 'claimant',
 '{"phone": "+675 7555 5555", "address": "Mt Hagen, Western Highlands"}'),

('88888888-8888-8888-8888-888888888806',
 '11111111-1111-1111-1111-111111111108',
 'TEST_Illegal Settlers Association',
 'group',
 'defendant',
 '{"address": "Government Reserve Land, Rabaul"}')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 10. TEST EVENTS
-- ============================================
INSERT INTO events (id, case_id, title, description, event_date, event_type, location) VALUES

('99999999-9999-9999-9999-999999999901',
 '11111111-1111-1111-1111-111111111104',
 'TEST_Court Hearing - Directions',
 'Directions hearing for customary land matter',
 NOW() + INTERVAL '14 days',
 'court_hearing',
 'National Court, Mt Hagen'),

('99999999-9999-9999-9999-999999999902',
 '11111111-1111-1111-1111-111111111108',
 'TEST_Eviction Enforcement',
 'Scheduled eviction enforcement with police support',
 NOW() + INTERVAL '7 days',
 'enforcement',
 'Government Reserve, Rabaul'),

('99999999-9999-9999-9999-999999999903',
 '11111111-1111-1111-1111-111111111101',
 'TEST_Site Inspection',
 'Joint site inspection with all parties',
 NOW() + INTERVAL '10 days',
 'inspection',
 'Disputed Land, Kokopo'),

('99999999-9999-9999-9999-999999999904',
 '11111111-1111-1111-1111-111111111109',
 'TEST_Inter-Agency Meeting',
 'Coordination meeting with Works, Lands, and Provincial Admin',
 NOW() + INTERVAL '5 days',
 'meeting',
 'DLPP Conference Room, Waigani'),

('99999999-9999-9999-9999-999999999905',
 '11111111-1111-1111-1111-111111111106',
 'TEST_Final Documentation Signing',
 'Signing of mediation agreement and boundary registration documents',
 NOW() + INTERVAL '3 days',
 'documentation',
 'Provincial Lands Office, Wewak')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 11. TEST TASKS
-- ============================================
INSERT INTO tasks (id, case_id, title, description, due_date, status, assigned_to, priority) VALUES

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001',
 '11111111-1111-1111-1111-111111111102',
 'TEST_Complete Site Inspection',
 'Conduct comprehensive site inspection and prepare report with photographs',
 NOW() + INTERVAL '7 days',
 'pending',
 'TEST_Lawyer Peter',
 'high'),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002',
 '11111111-1111-1111-1111-111111111103',
 'TEST_Draft Statement of Claim',
 'Prepare draft statement of claim based on legal opinion findings',
 NOW() + INTERVAL '14 days',
 'in_progress',
 'TEST_Lawyer Peter',
 'medium'),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003',
 '11111111-1111-1111-1111-111111111104',
 'TEST_File Submissions',
 'File final submissions before next court date',
 NOW() + INTERVAL '10 days',
 'pending',
 'TEST_Lawyer Sarah',
 'high'),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004',
 '11111111-1111-1111-1111-111111111108',
 'TEST_Coordinate Police Support',
 'Liaise with Police Commissioner office for eviction support',
 NOW() + INTERVAL '5 days',
 'in_progress',
 'TEST_Legal Manager John',
 'urgent'),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005',
 '11111111-1111-1111-1111-111111111105',
 'TEST_Verify Vacation of Premises',
 'Conduct site visit to verify lessee has vacated premises',
 NOW() + INTERVAL '35 days',
 'pending',
 'TEST_Registry Officer',
 'medium'),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa006',
 '11111111-1111-1111-1111-111111111110',
 'TEST_Prepare Appeal Response',
 'Draft comprehensive response to appeal grounds',
 NOW() + INTERVAL '21 days',
 'pending',
 'TEST_Lawyer Sarah',
 'medium')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 12. TEST LAND PARCELS
-- ============================================
INSERT INTO land_parcels (id, case_id, parcel_number, location, area, notes) VALUES

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
 '11111111-1111-1111-1111-111111111101',
 'TEST_PORTION-1234-ENB',
 'Kokopo District, East New Britain Province',
 50.5,
 'Disputed boundary between two customary groups. Eastern boundary unclear.'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
 '11111111-1111-1111-1111-111111111102',
 'TEST_SL-5678-LAE',
 'Lae Industrial Area, Morobe Province',
 12.3,
 'State land illegally occupied. Multiple structures identified for removal.'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03',
 '11111111-1111-1111-1111-111111111103',
 'TEST_ALLOT-45-12-GORDONS',
 'Section 45, Gordons, National Capital District',
 0.2,
 'Residential allotment with disputed title registration.'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04',
 '11111111-1111-1111-1111-111111111104',
 'TEST_CL-HAGEN-789',
 'Mt Hagen District, Western Highlands Province',
 75.8,
 'Traditional ceremonial grounds claimed by three clans.'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb05',
 '11111111-1111-1111-1111-111111111108',
 'TEST_GR-RABAUL-001',
 'Government Reserve, Rabaul, East New Britain Province',
 8.5,
 'Reserved for airport expansion. Currently illegally occupied.')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 13. TEST CASE HISTORY (Audit Trail)
-- ============================================
INSERT INTO case_history (id, case_id, action, description, metadata, created_at) VALUES

('cccccccc-cccc-cccc-cccc-cccccccccc01',
 '11111111-1111-1111-1111-111111111101',
 'created',
 'TEST_Case registered in the system',
 '{"source": "Direct complaint", "received_by": "Registry Clerk"}',
 NOW() - INTERVAL '30 days'),

('cccccccc-cccc-cccc-cccc-cccccccccc02',
 '11111111-1111-1111-1111-111111111102',
 'status_change',
 'TEST_Case status changed from registered to directions_issued',
 '{"old_status": "registered", "new_status": "directions_issued"}',
 NOW() - INTERVAL '23 days'),

('cccccccc-cccc-cccc-cccc-cccccccccc03',
 '11111111-1111-1111-1111-111111111103',
 'allocated',
 'TEST_Case allocated to lawyer',
 '{"lawyer": "TEST_Lawyer Peter", "instructions": "Review and advise"}',
 NOW() - INTERVAL '18 days'),

('cccccccc-cccc-cccc-cccc-cccccccccc04',
 '11111111-1111-1111-1111-111111111104',
 'filing_added',
 'TEST_Statement of Claim filed with court',
 '{"filing_type": "statement_of_claim", "court": "National Court Mt Hagen"}',
 NOW() - INTERVAL '50 days'),

('cccccccc-cccc-cccc-cccc-cccccccccc05',
 '11111111-1111-1111-1111-111111111107',
 'closed',
 'TEST_Case closed - compensation paid',
 '{"closure_type": "resolved", "outcome": "Compensation of K150,000 paid to landowners"}',
 NOW() - INTERVAL '175 days')

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify test data was inserted:

SELECT 'TEST DATA SUMMARY' as report;
SELECT 'Cases' as table_name, COUNT(*) as test_records FROM cases WHERE case_number LIKE 'TEST_%';
SELECT 'Directions' as table_name, COUNT(*) as test_records FROM directions WHERE direction_number LIKE 'TEST_%';
SELECT 'Delegations' as table_name, COUNT(*) as test_records FROM case_delegations WHERE delegated_to LIKE 'TEST_%';
SELECT 'Filings' as table_name, COUNT(*) as test_records FROM filings WHERE title LIKE 'TEST_%';
SELECT 'Compliance' as table_name, COUNT(*) as test_records FROM compliance_tracking WHERE court_order_description LIKE 'TEST_%';
SELECT 'Communications' as table_name, COUNT(*) as test_records FROM communications WHERE subject LIKE 'TEST_%';
SELECT 'Documents' as table_name, COUNT(*) as test_records FROM documents WHERE title LIKE 'TEST_%';
SELECT 'Parties' as table_name, COUNT(*) as test_records FROM parties WHERE name LIKE 'TEST_%';
SELECT 'Events' as table_name, COUNT(*) as test_records FROM events WHERE title LIKE 'TEST_%';
SELECT 'Tasks' as table_name, COUNT(*) as test_records FROM tasks WHERE title LIKE 'TEST_%';
SELECT 'Land Parcels' as table_name, COUNT(*) as test_records FROM land_parcels WHERE parcel_number LIKE 'TEST_%';
SELECT 'Case History' as table_name, COUNT(*) as test_records FROM case_history WHERE description LIKE 'TEST_%';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ =============================================';
    RAISE NOTICE '✅ TEST DATA LOADED SUCCESSFULLY!';
    RAISE NOTICE '✅ =============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Test Data Summary:';
    RAISE NOTICE '   • 10 Test Cases (all workflow stages)';
    RAISE NOTICE '   • 4 Test Directions';
    RAISE NOTICE '   • 4 Test Delegations';
    RAISE NOTICE '   • 5 Test Filings';
    RAISE NOTICE '   • 4 Test Compliance Records';
    RAISE NOTICE '   • 6 Test Communications/Alerts';
    RAISE NOTICE '   • 7 Test Documents';
    RAISE NOTICE '   • 6 Test Parties';
    RAISE NOTICE '   • 5 Test Events';
    RAISE NOTICE '   • 6 Test Tasks';
    RAISE NOTICE '   • 5 Test Land Parcels';
    RAISE NOTICE '   • 5 Test History Records';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 All test data is prefixed with "TEST_"';
    RAISE NOTICE '🗑️  To delete: Run DELETE_TEST_DATA.sql';
    RAISE NOTICE '';
END $$;
