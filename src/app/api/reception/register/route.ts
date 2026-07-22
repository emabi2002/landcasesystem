import { NextRequest, NextResponse } from 'next/server';
import {
  permissionErrorResponse,
  requireAnyModulePermission,
  requireModulePermission,
} from '@/lib/auth/require-permission';

export async function POST(request: NextRequest) {
  try {
    const { user, admin } = await requireAnyModulePermission([
      { moduleKey: 'correspondence', action: 'create' },
    ]);

    const formData = await request.json();

    if (typeof formData.document_type !== 'string' || !formData.document_type.trim()) {
      return NextResponse.json(
        { success: false, error: 'Document type is required' },
        { status: 400 }
      );
    }

    console.info('Reception registration request received', { userId: user.id });

    // Step 1: Generate serial number
    const { data: serialNumberData, error: serialError } = await admin.rpc(
      'generate_intake_serial_number' as never
    );

    if (serialError) {
      console.error('Serial number generation error');
      throw new Error('Failed to generate serial number');
    }

    const serialNumber =
      serialNumberData || `DLPP-DOC-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`;

    // Step 2: Insert intake record
    const { data: intakeRecord, error: intakeError } = await admin
      .from('case_intake_records' as never)
      .insert([
        {
          internal_serial_number: serialNumber,
          document_type: formData.document_type,
          source: formData.source,
          from_party_type: formData.from_party_type,
          from_office_name: formData.from_office_name,
          from_contact_person: formData.from_contact_person,
          delivered_by_name: formData.delivered_by_name,
          delivered_by_contact: formData.delivered_by_contact,
          physical_folder_number: formData.physical_folder_number,
          physical_location: formData.physical_location || 'Reception Desk',
          date_stamped: new Date().toISOString(),
          received_date: new Date().toISOString(),
          received_by: user.id,
          created_by: user.id,
          notes: formData.notes,
          urgent: formData.urgent || false,
          status: 'received',
          case_id: null,
        },
      ] as never)
      .select()
      .single();

    if (intakeError) {
      console.error('Intake record error');
      throw intakeError;
    }

    // Step 3: Upload document if provided
    if (formData.scanned_document_url) {
      const { error: docError } = await admin
        .from('case_intake_documents' as never)
        .insert({
          intake_record_id: (intakeRecord as { id: string }).id,
          file_name: formData.file_name || 'scanned-document.pdf',
          file_url: formData.scanned_document_url,
          file_size: formData.file_size || null,
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
        } as never);

      if (docError) {
        console.error('Document upload error');
        // Don't fail the whole operation if document upload fails
      }
    }

    return NextResponse.json({
      success: true,
      intake_record: intakeRecord,
      serial_number: serialNumber,
      message: 'Document registered successfully at front counter',
    });
  } catch (error: any) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Reception registration failed');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register document',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch intake records
export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireModulePermission('correspondence', 'read');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const today = searchParams.get('today') === 'true';

    let query = admin
      .from('case_intake_records' as never)
      .select('*, case_intake_documents(*)' as never);

    if (status) {
      query = query.eq('status', status);
    }

    if (today) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      query = query.gte('received_date', todayStart.toISOString());
    }

    query = query.order('received_date', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      records: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    const response = permissionErrorResponse(error);
    if (response) return response;

    console.error('Reception fetch failed');
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intake records' },
      { status: 500 }
    );
  }
}
