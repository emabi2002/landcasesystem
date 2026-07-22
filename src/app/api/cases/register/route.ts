import { NextRequest, NextResponse } from 'next/server';
import { permissionErrorResponse, requireModulePermission } from '@/lib/auth/require-permission';

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

export async function POST(request: NextRequest) {
  try {
    const { user, admin } = await requireModulePermission('cases', 'create');
    const formData = await request.json();

    console.info('Case registration request received', { userId: user.id });

    if (formData.case_number !== undefined && typeof formData.case_number !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid case number' }, { status: 400 });
    }

    // Auto-generate case number if not provided
    let caseNumber = formData.case_number;
    if (!caseNumber || caseNumber.trim() === '') {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      caseNumber = `LIT-${year}-${timestamp}`;
      console.info('Auto-generated case number', { caseNumber });
    }

    // Auto-generate title if not provided
    let caseTitle = formData.title;
    if (!caseTitle || caseTitle.trim() === '') {
      const roleDesc = formData.dlpp_role === 'defendant' ? 'as Defendant' : 'as Plaintiff';
      caseTitle = `Case ${caseNumber} - DLPP ${roleDesc}`;
      console.info('Auto-generated case title', { caseTitle });
    }

    // STEP 1: Insert main case record
    // Using ONLY the core columns that are guaranteed to exist in ANY cases table
    // All other data will be stored in related tables (parties, documents, tasks, etc.)
    const caseInsertData: any = {
      case_number: caseNumber,
      title: caseTitle,
      status: formData.status || 'under_review',
      priority: formData.priority || 'medium',
      case_type: formData.case_type || 'other',
    };

    console.info('Inserting case with minimum fields');

    const { data: newCase, error: caseError } = await admin
      .from('cases' as never)
      .insert([caseInsertData] as never)
      .select()
      .single();

    if (caseError) {
      console.error('Case insert error');
      throw new Error(`Failed to create case: ${caseError.message} (Code: ${caseError.code})`);
    }
    if (!newCase) throw new Error('No case data returned');

    const caseId = (newCase as { id: string }).id;
    console.info('Case created', { userId: user.id, caseId });

    // STEP 2: Insert DLPP as a party
    const { error: dlppPartyError } = await admin
      .from('parties' as never)
      .insert(
        {
          case_id: caseId,
          name: 'Department of Lands & Physical Planning',
          role: formData.dlpp_role, // 'plaintiff' or 'defendant'
          party_type: 'government_entity',
          contact_info: {
            department: 'DLPP',
            division: formData.division_responsible
          }
        } as never
      );

    if (dlppPartyError) console.error('Warning: Could not insert DLPP party');
    else console.info('DLPP party added');

    // STEP 3: Extract and insert opposing party from parties_description
    if (formData.parties_description) {
      const opposingPartyName = extractOpposingParty(
        formData.parties_description,
        formData.dlpp_role
      );

      if (opposingPartyName) {
        const { error: opposingPartyError } = await admin
          .from('parties' as never)
          .insert(
            {
              case_id: caseId,
              name: opposingPartyName,
              role: formData.dlpp_role === 'plaintiff' ? 'defendant' : 'plaintiff',
              party_type: 'individual',
              contact_info: {
                lawyer: formData.opposing_lawyer_name
              }
            } as never
          );

        if (opposingPartyError) console.error('Warning: Could not insert opposing party');
        else console.info('Opposing party added');
      }
    }

    // STEP 4: Insert land parcel if land data provided
    if (formData.land_description) {
      const { error: landError } = await admin
        .from('land_parcels' as never)
        .insert(
          {
            case_id: caseId,
            parcel_number: formData.survey_plan_no || 'N/A',
            location: formData.region || 'Not specified',
            notes: `Land Description: ${formData.land_description}\n` +
                   `Zoning: ${formData.zoning || 'N/A'}\n` +
                   `Survey Plan: ${formData.survey_plan_no || 'N/A'}\n` +
                   `Lease Type: ${formData.lease_type || 'N/A'}\n` +
                   `Lease Period: ${formData.lease_commencement_date || 'N/A'} to ${formData.lease_expiration_date || 'N/A'}`
          } as never
        );

      if (landError) console.error('Warning: Could not insert land parcel');
      else console.info('Land parcel added');
    }

    // STEP 5: Insert event if returnable date provided (optional - skip if table doesn't exist)
    if (formData.returnable_date) {
      try {
        const { error: eventError } = await admin
          .from('events' as never)
          .insert(
            {
              case_id: caseId,
              event_type: 'hearing',
              title: `${formData.returnable_type || 'Hearing'} - ${formData.case_number}`,
              description: `Case: ${formData.title}\nMatter Type: ${formData.matter_type || 'N/A'}\nCourt Reference: ${formData.court_file_number || 'N/A'}`,
              event_date: formData.returnable_date,
              location: 'Court',
              auto_created: true
            } as never
          );

        if (eventError) console.error('Warning: Could not insert event');
        else console.info('Event added');
      } catch {
        console.error('Warning: Events table may not exist');
      }
    }

    // STEP 6: Insert task if officer assigned
    if (formData.dlpp_action_officer) {
      const { error: taskError } = await admin
        .from('tasks' as never)
        .insert(
          {
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
          } as never
        );

      if (taskError) console.error('Warning: Could not insert task');
      else console.info('Task added for officer');
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
        uploaded_by: user.id
      };

      const { error: docError } = await admin
        .from('documents' as never)
        .insert(fullFormDataRecord as never);

      if (docError) console.error('Warning: Could not insert registration data document');
      else console.info('Complete registration data saved in documents table');
    } catch {
      console.error('Warning: Could not save complete form data');
    }

    // STEP 8: Insert case history entry with workflow state (optional - skip if table doesn't exist)
    try {
      const { error: historyError } = await admin
        .from('case_history' as never)
        .insert(
          {
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
            },
            created_by: user.id
          } as never
        );

      if (historyError) console.error('Warning: Could not insert case history');
      else console.info('Case history added');
    } catch {
      console.error('Warning: Case history table may not exist');
    }

    // STEP 9: Notify managers/senior legal officers for assignment
    const { data: managers } = await admin
      .from('profiles' as never)
      .select('id')
      .in('role', ['manager_legal_services', 'senior_legal_officer_litigation']);

    if (managers && managers.length > 0) {
      const notifications = managers.map((manager: { id: string }) => ({
        user_id: manager.id,
        case_id: caseId,
        title: 'New Case Registered - Awaiting Assignment',
        message: `New litigation case ${caseNumber} has been registered and is awaiting action officer assignment.`,
        type: 'case_update'
      }));

      const { error: notifError } = await admin
        .from('notifications' as never)
        .insert(notifications as never);

      if (notifError) console.error('Warning: Could not send notifications');
      else console.info(`Notifications sent to ${managers.length} manager(s)`);
    }

    console.info('Litigation case registration complete with workflow');

    return NextResponse.json({
      success: true,
      case: newCase,
      workflow_state: 'REGISTERED',
      message: 'Case registered successfully. Managers have been notified for assignment.'
    });
  } catch (error: any) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Case registration failed');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to register case'
      },
      { status: 500 }
    );
  }
}
