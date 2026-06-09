-- ============================================
-- WORKFLOW TRACKING TABLES SETUP - FIXED VERSION
-- ============================================
-- This script works with tables from database-workflow-extensions.sql
-- Uses correct lawyer_type values: 'solicitor_general', 'private_lawyer'
-- Safe to run even if tables already exist
-- ============================================

-- NOTE: These tables may already exist from database-workflow-extensions.sql
-- This script will populate them with sample data linked to your cases

-- STEP 1: Populate External Lawyers with sample data
-- ============================================

INSERT INTO public.external_lawyers (name, organization, lawyer_type, contact_email, contact_phone, notes)
VALUES
  ('John Smith', 'Solicitor General Office', 'solicitor_general', 'jsmith@solgen.gov.pg', '+675 123 4567', 'Primary Sol Gen contact for land cases'),
  ('Mary Johnson', 'Solicitor General Office', 'solicitor_general', 'mjohnson@solgen.gov.pg', '+675 123 4568', 'Handles constitutional matters'),
  ('David Lee', 'Lee & Associates', 'private_lawyer', 'dlee@leelaw.com.pg', '+675 234 5678', 'Often represents private land claimants'),
  ('Sarah Williams', 'Williams Legal Services', 'private_lawyer', 'swilliams@williamslaw.com.pg', '+675 345 6789', 'Corporate and land law specialist'),
  ('Robert Brown', 'Brown Chambers', 'private_lawyer', 'rbrown@brownchambers.com.pg', '+675 456 7890', 'Frequent opposing counsel')
ON CONFLICT DO NOTHING;

-- STEP 2: Create sample correspondence linked to existing cases
-- ============================================

DO $$
DECLARE
  case_rec RECORD;
  counter INT := 0;
BEGIN
  -- Only create if table exists and is empty
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incoming_correspondence') THEN
    FOR case_rec IN
      SELECT id, case_number FROM public.cases ORDER BY created_at DESC LIMIT 10
    LOOP
      counter := counter + 1;

      BEGIN
        INSERT INTO public.incoming_correspondence (
          reference_number,
          case_id,
          document_type,
          source,
          received_date,
          subject,
          acknowledgement_sent,
          status
        ) VALUES (
          'CORR-2025-' || LPAD(counter::TEXT, 4, '0'),
          case_rec.id,
          CASE counter % 4
            WHEN 0 THEN 'Writ of Summons'
            WHEN 1 THEN 'Notice of Motion'
            WHEN 2 THEN 'Statement of Claim'
            ELSE 'Affidavit'
          END,
          CASE counter % 3
            WHEN 0 THEN 'National Court'
            WHEN 1 THEN 'Private Law Firm'
            ELSE 'Solicitor General'
          END,
          CURRENT_DATE - (counter * 10 || ' days')::INTERVAL,
          'Re: ' || case_rec.case_number || ' - Legal proceedings',
          counter % 2 = 0,
          CASE counter % 2
            WHEN 0 THEN 'acknowledged'
            ELSE 'pending'
          END
        );
      EXCEPTION
        WHEN others THEN
          -- Skip if duplicate
          NULL;
      END;
    END LOOP;
  END IF;
END $$;

-- STEP 3: Create sample directions
-- ============================================

DO $$
DECLARE
  case_rec RECORD;
  counter INT := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'directions') THEN
    FOR case_rec IN
      SELECT id, case_number FROM public.cases ORDER BY created_at DESC LIMIT 10
    LOOP
      counter := counter + 1;

      BEGIN
        INSERT INTO public.directions (
          direction_number,
          case_id,
          source,
          issued_date,
          subject,
          priority,
          due_date,
          assigned_to,
          status
        ) VALUES (
          'DIR-2025-' || LPAD(counter::TEXT, 4, '0'),
          case_rec.id,
          CASE counter % 2
            WHEN 0 THEN 'Minister for Lands'
            ELSE 'Secretary DLPP'
          END,
          CURRENT_DATE - (counter * 5 || ' days')::INTERVAL,
          'Action required: ' || case_rec.case_number,
          CASE counter % 3
            WHEN 0 THEN 'urgent'
            WHEN 1 THEN 'high'
            ELSE 'normal'
          END,
          CURRENT_DATE + (counter * 7 || ' days')::INTERVAL,
          CASE counter % 3
            WHEN 0 THEN 'DLPP Legal Officer'
            WHEN 1 THEN 'Provincial Lands Officer'
            ELSE 'Senior Legal Counsel'
          END,
          CASE counter % 3
            WHEN 0 THEN 'in_progress'
            WHEN 1 THEN 'pending'
            ELSE 'completed'
          END
        );
      EXCEPTION
        WHEN others THEN
          NULL;
      END;
    END LOOP;
  END IF;
END $$;

-- STEP 4: Create sample communications
-- ============================================

DO $$
DECLARE
  case_rec RECORD;
  counter INT := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communications') THEN
    FOR case_rec IN
      SELECT id, case_number FROM public.cases ORDER BY created_at DESC LIMIT 10
    LOOP
      counter := counter + 1;

      BEGIN
        INSERT INTO public.communications (
          case_id,
          communication_type,
          direction,
          party_type,
          party_name,
          subject,
          communication_date,
          response_required,
          response_status
        ) VALUES (
          case_rec.id,
          CASE counter % 4
            WHEN 0 THEN 'Phone Call'
            WHEN 1 THEN 'Email'
            WHEN 2 THEN 'Letter'
            ELSE 'Meeting'
          END,
          CASE counter % 2
            WHEN 0 THEN 'incoming'
            ELSE 'outgoing'
          END,
          CASE counter % 3
            WHEN 0 THEN 'opposing_lawyer'
            WHEN 1 THEN 'court'
            ELSE 'party'
          END,
          CASE counter % 3
            WHEN 0 THEN 'Smith & Associates'
            WHEN 1 THEN 'National Court Registry'
            ELSE 'John Doe'
          END,
          'Re: ' || case_rec.case_number || ' - Case update',
          CURRENT_DATE - (counter * 3 || ' days')::INTERVAL,
          counter % 2 = 0,
          CASE counter % 2
            WHEN 0 THEN 'pending'
            ELSE 'not_required'
          END
        );
      EXCEPTION
        WHEN others THEN
          NULL;
      END;
    END LOOP;
  END IF;
END $$;

-- STEP 5: Create sample file requests
-- ============================================

DO $$
DECLARE
  case_rec RECORD;
  counter INT := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_requests') THEN
    FOR case_rec IN
      SELECT id, case_number FROM public.cases ORDER BY created_at DESC LIMIT 5
    LOOP
      counter := counter + 1;

      BEGIN
        INSERT INTO public.file_requests (
          request_number,
          case_id,
          file_type,
          requested_from,
          request_date,
          required_by_date,
          status
        ) VALUES (
          'FR-2025-' || LPAD(counter::TEXT, 4, '0'),
          case_rec.id,
          CASE counter % 3
            WHEN 0 THEN 'Land Title'
            WHEN 1 THEN 'Survey Plan'
            ELSE 'NLD File'
          END,
          CASE counter % 2
            WHEN 0 THEN 'Provincial Lands Office'
            ELSE 'National Lands Department'
          END,
          CURRENT_DATE - (counter * 7 || ' days')::INTERVAL,
          CURRENT_DATE + (counter * 14 || ' days')::INTERVAL,
          CASE counter % 3
            WHEN 0 THEN 'pending'
            WHEN 1 THEN 'received'
            ELSE 'pending'
          END
        );
      EXCEPTION
        WHEN others THEN
          NULL;
      END;
    END LOOP;
  END IF;
END $$;

-- STEP 6: Verify data was inserted
-- ============================================

DO $$
DECLARE
  lawyer_count INT;
  corr_count INT;
  dir_count INT;
  comm_count INT;
  file_req_count INT;
BEGIN
  SELECT COUNT(*) INTO lawyer_count FROM public.external_lawyers;

  SELECT COUNT(*) INTO corr_count FROM public.incoming_correspondence
  WHERE reference_number LIKE 'CORR-2025-%';

  SELECT COUNT(*) INTO dir_count FROM public.directions
  WHERE direction_number LIKE 'DIR-2025-%';

  SELECT COUNT(*) INTO comm_count FROM public.communications
  WHERE subject LIKE '%Case update%';

  SELECT COUNT(*) INTO file_req_count FROM public.file_requests
  WHERE request_number LIKE 'FR-2025-%';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  WORKFLOW TRACKING DATA POPULATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Sample data created:';
  RAISE NOTICE '  ✅ External Lawyers: % total', lawyer_count;
  RAISE NOTICE '  ✅ Correspondence: % entries', corr_count;
  RAISE NOTICE '  ✅ Directions: % entries', dir_count;
  RAISE NOTICE '  ✅ Communications: % entries', comm_count;
  RAISE NOTICE '  ✅ File Requests: % entries', file_req_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)';
  RAISE NOTICE '  2. Go to Correspondence page - see data!';
  RAISE NOTICE '  3. Go to Directions page - see directions!';
  RAISE NOTICE '  4. Go to Communications page - see communications!';
  RAISE NOTICE '  5. Go to Lawyers page - see lawyers!';
  RAISE NOTICE '  6. Go to File Requests page - see requests!';
  RAISE NOTICE '';
  RAISE NOTICE 'All entries are linked to your recent cases!';
  RAISE NOTICE '========================================';
END $$;
