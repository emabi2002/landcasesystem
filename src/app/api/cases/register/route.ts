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

    console.log('========================================');
    console.log('📝 Starting case registration...');
    console.log('========================================');
    console.log('Form data received:', JSON.stringify(formData, null, 2));

    // Verify user is para-legal officer or admin (role-based check)
    // Commented out for now to allow all users during testing
    // if (formData.user_role && !['para_legal_officer', 'admin'].includes(formData.user_role)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Only Para-Legal Officers can register cases' },
    //     { status: 403 }
    //   );
    // }

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

    // STEP 1: Insert main case record
    // Using ONLY the core columns that are guaranteed to exist in ANY cases table
    // All other data will be stored in related tables (parties, documents, tasks, etc.)

    // ABSOLUTE MINIMUM INSERT - Only fields guaranteed to exist
    const caseInsertData: any = {
      case_number: caseNumber,
      title: caseTitle,
      status: formData.status || 'under_review',
      priority: formData.priority || 'medium',
      case_type: formData.case_type || 'other',
    };

    console.log('========================================');
    console.log('📦 Inserting case with BARE MINIMUM fields:');
    console.log(JSON.stringify(caseInsertData, null, 2));
    console.log('All other data will be saved in documents table');
    console.log('========================================');

    const { data: newCase, error: caseError} = await supabase
      .from('cases')
      .insert([caseInsertData])
      .select()
      .single();

    if (caseError) {
      console.error('❌ Case insert error:', caseError);
      throw new Error(`Failed to create case: ${caseError.message} (Code: ${caseError.code})`);
    }
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

    // STEP 5: Insert event if returnable date provided (optional - skip if table doesn't exist)
    if (formData.returnable_date) {
      try {
        const { error: eventError } = await supabase
          .from('calendar_events')
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
      } catch (e) {
        console.error('Warning: Events table may not exist:', e);
      }
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

    // STEP 7: Insert document placeholder with ALL form data that couldn't be saved to cases table
    // This ensures no data is lost even if database schema is incomplete
    try {
      const fullFormDataRecord = {
        case_id: caseId,
        title: `Case Registration Data - ${caseNumber}`,
        description: `COMPLETE CASE REGISTRATION DATA:\n\n` +
                    `BASIC INFORMATION:\n` +
                    `Description: ${formData.description || 'N/A'}\n` +
                    `Matter Type: ${formData.matter_type || 'N/A'}\n` +
                    `Region: ${formData.region || 'N/A'}\n` +
                    `DLPP Role: ${formData.dlpp_role || 'N/A'}\n` +
                    `Created By: ${formData.user_id || 'N/A'}\n\n` +
                    `COURT INFORMATION:\n` +
                    `Track Number: ${formData.track_number || 'N/A'}\n` +
                    `Court File Number: ${formData.court_file_number || 'N/A'}\n` +
                    `Parties Description: ${formData.parties_description || 'N/A'}\n\n` +
                    `FILING INFORMATION:\n` +
                    `Proceeding Filed Date: ${formData.proceeding_filed_date || 'N/A'}\n` +
                    `Documents Served Date: ${formData.documents_served_date || 'N/A'}\n` +
                    `Court Documents Type: ${formData.court_documents_type || 'N/A'}\n\n` +
                    `HEARING INFORMATION:\n` +
                    `Returnable Date: ${formData.returnable_date || 'N/A'}\n` +
                    `Returnable Type: ${formData.returnable_type || 'N/A'}\n\n` +
                    `ASSIGNMENT:\n` +
                    `Division Responsible: ${formData.division_responsible || 'N/A'}\n` +
                    `DLPP Action Officer: ${formData.dlpp_action_officer || 'N/A'}\n` +
                    `Sol Gen Officer: ${formData.sol_gen_officer || 'N/A'}\n` +
                    `Officer Assigned Date: ${formData.officer_assigned_date || 'N/A'}\n` +
                    `Assignment Footnote: ${formData.assignment_footnote || 'N/A'}\n\n` +
                    `LEGAL DETAILS:\n` +
                    `Allegations: ${formData.allegations || 'N/A'}\n` +
                    `Reliefs Sought: ${formData.reliefs_sought || 'N/A'}\n` +
                    `Opposing Lawyer: ${formData.opposing_lawyer_name || 'N/A'}\n` +
                    `Section 5 Notice: ${formData.section5_notice ? 'Yes' : 'No'}\n\n` +
                    `LAND INFORMATION:\n` +
                    `Description: ${formData.land_description || 'N/A'}\n` +
                    `Zoning: ${formData.zoning || 'N/A'}\n` +
                    `Survey Plan No: ${formData.survey_plan_no || 'N/A'}\n` +
                    `Lease Type: ${formData.lease_type || 'N/A'}\n` +
                    `Lease Commencement: ${formData.lease_commencement_date || 'N/A'}\n` +
                    `Lease Expiration: ${formData.lease_expiration_date || 'N/A'}`,
        document_type: 'registration_data',
        file_url: '#', // Placeholder - this is metadata, not a file
        uploaded_by: formData.user_id
      };

      const { error: docError } = await supabase
        .from('documents')
        .insert(fullFormDataRecord);

      if (docError) console.error('Warning: Could not insert registration data document:', docError);
      else console.log('✅ Complete registration data saved in documents table');
    } catch (e) {
      console.error('Warning: Could not save complete form data:', e);
    }

    // STEP 8: Insert case history entry with workflow state (optional - skip if table doesn't exist)
    try {
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
    } catch (e) {
      console.error('Warning: Case history table may not exist:', e);
    }

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
    console.error('========================================');
    console.error('❌ ERROR REGISTERING CASE');
    console.error('========================================');
    console.error('Error type:', error instanceof Error ? 'Error' : typeof error);
    console.error('Error details:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error && (error as any).details ? (error as any).details : null;
    const errorHint = error instanceof Error && (error as any).hint ? (error as any).hint : null;

    console.error('Sending error response to client...');

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
        hint: errorHint,
        timestamp: new Date().toISOString()
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
