import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key for full database access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    console.log('📝 Registering new litigation case with workflow...');

    // Verify user is para-legal officer or admin (role-based check)
    if (formData.user_role && !['para_legal_officer', 'admin'].includes(formData.user_role)) {
      return NextResponse.json(
        { success: false, error: 'Only Para-Legal Officers can register cases' },
        { status: 403 }
      );
    }

    // Auto-generate case number if not provided
    let caseNumber = formData.case_number;
    if (!caseNumber || caseNumber.trim() === '') {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      caseNumber = `LIT-${year}-${timestamp}`;
      console.log(`🔢 Auto-generated case number: ${caseNumber}`);
    }

    // Auto-generate title if not provided
    let caseTitle = formData.title;
    if (!caseTitle || caseTitle.trim() === '') {
      const roleDesc = formData.dlpp_role === 'defendant' ? 'as Defendant' : 'as Plaintiff';
      caseTitle = `Case ${caseNumber} - DLPP ${roleDesc}`;
      console.log(`📝 Auto-generated title: ${caseTitle}`);
    }

    // STEP 1: Insert main case record with litigation workflow
    const { data: newCase, error: caseError } = await supabase
      .from('cases')
      .insert([{
        case_number: caseNumber,
        title: caseTitle,
        description: formData.description,
        status: formData.status || 'under_review',
        priority: formData.priority || 'medium',
        case_type: formData.case_type || 'court_matter',
        region: formData.region,

        // LITIGATION WORKFLOW: Set initial state
        workflow_state: 'REGISTERED',

        // Litigation fields
        mode_of_proceeding: formData.mode_of_proceeding,
        court_file_number: formData.court_file_number,
        parties_description: formData.parties_description,
        plaintiff_lawyer_contact: formData.plaintiff_lawyer_contact,
        osg_lawyer_contact: formData.osg_lawyer_contact,

        // Legacy workflow fields (keep for compatibility)
        dlpp_role: formData.dlpp_role,
        track_number: formData.track_number,
        proceeding_filed_date: formData.proceeding_filed_date,
        documents_served_date: formData.documents_served_date,
        court_documents_type: formData.court_documents_type,
        matter_type: formData.matter_type,
        returnable_date: formData.returnable_date,
        returnable_type: formData.returnable_type,
        division_responsible: formData.division_responsible,
        allegations: formData.allegations,
        reliefs_sought: formData.reliefs_sought,
        opposing_lawyer_name: formData.opposing_lawyer_name,
        sol_gen_officer: formData.sol_gen_officer,
        dlpp_action_officer: formData.dlpp_action_officer,
        officer_assigned_date: formData.officer_assigned_date,
        assignment_footnote: formData.assignment_footnote,
        section5_notice: formData.section5_notice,
        land_description: formData.land_description,
        zoning: formData.zoning,
        survey_plan_no: formData.survey_plan_no,
        lease_type: formData.lease_type,
        lease_commencement_date: formData.lease_commencement_date,
        lease_expiration_date: formData.lease_expiration_date,

        created_by: formData.user_id,
      }])
      .select()
      .single();

    if (caseError) throw caseError;
    if (!newCase) throw new Error('No case data returned');

    const caseId = newCase.id;
    console.log(`✅ Case created: ${newCase.case_number} (WORKFLOW_STATE: REGISTERED)`);

    // STEP 2: Insert DLPP as a party
    const { error: dlppPartyError } = await supabase
      .from('parties')
      .insert({
        case_id: caseId,
        name: 'Department of Lands & Physical Planning',
        role: formData.dlpp_role, // 'plaintiff' or 'defendant'
        party_type: 'government_entity',
        contact_info: {
          department: 'DLPP',
          division: formData.division_responsible
        }
      });

    if (dlppPartyError) console.error('Warning: Could not insert DLPP party:', dlppPartyError);
    else console.log('✅ DLPP party added');

    // STEP 3: Extract and insert opposing party from parties_description
    if (formData.parties_description) {
      const opposingPartyName = extractOpposingParty(
        formData.parties_description,
        formData.dlpp_role
      );

      if (opposingPartyName) {
        const { error: opposingPartyError } = await supabase
          .from('parties')
          .insert({
            case_id: caseId,
            name: opposingPartyName,
            role: formData.dlpp_role === 'plaintiff' ? 'defendant' : 'plaintiff',
            party_type: 'individual',
            contact_info: {
              lawyer: formData.opposing_lawyer_name
            }
          });

        if (opposingPartyError) console.error('Warning: Could not insert opposing party:', opposingPartyError);
        else console.log(`✅ Opposing party added: ${opposingPartyName}`);
      }
    }

    // STEP 4: Insert land parcel if land data provided
    if (formData.land_description) {
      const { error: landError } = await supabase
        .from('land_parcels')
        .insert({
          case_id: caseId,
          parcel_number: formData.survey_plan_no || 'N/A',
          location: formData.region || 'Not specified',
          notes: `Land Description: ${formData.land_description}\n` +
                 `Zoning: ${formData.zoning || 'N/A'}\n` +
                 `Survey Plan: ${formData.survey_plan_no || 'N/A'}\n` +
                 `Lease Type: ${formData.lease_type || 'N/A'}\n` +
                 `Lease Period: ${formData.lease_commencement_date || 'N/A'} to ${formData.lease_expiration_date || 'N/A'}`
        });

      if (landError) console.error('Warning: Could not insert land parcel:', landError);
      else console.log('✅ Land parcel added');
    }

    // STEP 5: Insert event if returnable date provided
    if (formData.returnable_date) {
      const { error: eventError } = await supabase
        .from('events')
        .insert({
          case_id: caseId,
          event_type: 'hearing',
          title: `${formData.returnable_type || 'Hearing'} - ${formData.case_number}`,
          description: `Case: ${formData.title}\nMatter Type: ${formData.matter_type || 'N/A'}\nCourt Reference: ${formData.court_file_number || 'N/A'}`,
          event_date: formData.returnable_date,
          location: 'Court',
          auto_created: true
        });

      if (eventError) console.error('Warning: Could not insert event:', eventError);
      else console.log('✅ Event added with 3-day alert');
    }

    // STEP 6: Insert task if officer assigned
    if (formData.dlpp_action_officer) {
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          case_id: caseId,
          title: `Case Assignment: ${formData.case_number}`,
          description: `DLPP Action Officer: ${formData.dlpp_action_officer}\n` +
                      `Sol Gen Officer: ${formData.sol_gen_officer || 'Not assigned'}\n` +
                      `Division Responsible: ${formData.division_responsible || 'Not specified'}\n` +
                      `Assignment Date: ${formData.officer_assigned_date || 'N/A'}\n` +
                      `Notes: ${formData.assignment_footnote || 'N/A'}`,
          due_date: formData.returnable_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          priority: formData.priority
        });

      if (taskError) console.error('Warning: Could not insert task:', taskError);
      else console.log('✅ Task added for officer');
    }

    // STEP 7: Insert document placeholder if court documents exist
    if (formData.court_file_number) {
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          case_id: caseId,
          title: `Court Documents - ${formData.court_file_number}`,
          description: `Court Reference: ${formData.court_file_number}\n` +
                      `Document Type: ${formData.court_documents_type || 'N/A'}\n` +
                      `Filed Date: ${formData.proceeding_filed_date || 'N/A'}\n` +
                      `Served Date: ${formData.documents_served_date || 'N/A'}`,
          document_type: 'filing',
          file_url: '#' // Placeholder - actual documents to be uploaded
        });

      if (docError) console.error('Warning: Could not insert document:', docError);
      else console.log('✅ Document placeholder added');
    }

    // STEP 8: Insert case history entry with workflow state
    const { error: historyError } = await supabase
      .from('case_history')
      .insert({
        case_id: caseId,
        action: 'case_registered',
        description: `Case registered with court reference: ${formData.court_file_number || 'N/A'}`,
        workflow_state_to: 'REGISTERED',
        metadata: {
          court_reference: formData.court_file_number,
          dlpp_role: formData.dlpp_role,
          matter_type: formData.matter_type,
          mode_of_proceeding: formData.mode_of_proceeding,
          registration_method: 'web_form'
        }
      });

    if (historyError) console.error('Warning: Could not insert case history:', historyError);
    else console.log('✅ Case history added');

    // STEP 9: Notify managers/senior legal officers for assignment
    const { data: managers } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['manager_legal_services', 'senior_legal_officer_litigation']);

    if (managers && managers.length > 0) {
      const notifications = managers.map(manager => ({
        user_id: manager.id,
        case_id: caseId,
        title: 'New Case Registered - Awaiting Assignment',
        message: `New litigation case ${caseNumber} has been registered and is awaiting action officer assignment.`,
        type: 'case_update'
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) console.error('Warning: Could not send notifications:', notifError);
      else console.log(`✅ Notifications sent to ${managers.length} manager(s)`);
    }

    console.log('🎉 Litigation case registration complete with workflow!');

    return NextResponse.json({
      success: true,
      case: newCase,
      workflow_state: 'REGISTERED',
      message: 'Case registered successfully. Managers have been notified for assignment.'
    });

  } catch (error) {
    console.error('❌ Error registering case:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to extract opposing party name from parties description
function extractOpposingParty(partiesDescription: string, dlppRole: string): string {
  // Format: "Plaintiff Name -v- Defendant Name"
  const parts = partiesDescription.split(' -v- ');

  if (parts.length !== 2) {
    return partiesDescription.trim();
  }

  // If DLPP is plaintiff, opposing party is defendant (second part)
  // If DLPP is defendant, opposing party is plaintiff (first part)
  const opposingPart = dlppRole === 'plaintiff' ? parts[1] : parts[0];

  return opposingPart.trim();
}
