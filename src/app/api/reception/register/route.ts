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

    console.log('📝 Registering document at front counter...');

    // Step 1: Generate serial number
    const { data: serialNumberData, error: serialError } = await supabase
      .rpc('generate_intake_serial_number');

    if (serialError) {
      console.error('Serial number generation error:', serialError);
      throw new Error('Failed to generate serial number');
    }

    const serialNumber = serialNumberData || `DLPP-DOC-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`;
    console.log(`🔢 Generated serial number: ${serialNumber}`);

    // Step 2: Insert intake record
    const { data: intakeRecord, error: intakeError } = await supabase
      .from('case_intake_records')
      .insert([{
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
        received_by: formData.user_id,
        created_by: formData.user_id,
        notes: formData.notes,
        urgent: formData.urgent || false,
        status: 'received',
        case_id: null, // Document received before case created
      }])
      .select()
      .single();

    if (intakeError) {
      console.error('Intake record error:', intakeError);
      throw intakeError;
    }

    console.log(`✅ Intake record created: ${intakeRecord.id}`);

    // Step 3: Upload document if provided
    if (formData.scanned_document_url) {
      const { error: docError } = await supabase
        .from('case_intake_documents')
        .insert({
          intake_record_id: intakeRecord.id,
          file_name: formData.file_name || 'scanned-document.pdf',
          file_url: formData.scanned_document_url,
          file_size: formData.file_size || null,
          uploaded_by: formData.user_id,
          uploaded_at: new Date().toISOString(),
        });

      if (docError) {
        console.error('Document upload error:', docError);
        // Don't fail the whole operation if document upload fails
      } else {
        console.log('✅ Document uploaded');
      }
    }

    return NextResponse.json({
      success: true,
      intake_record: intakeRecord,
      serial_number: serialNumber,
      message: 'Document registered successfully at front counter',
    });

  } catch (error: any) {
    console.error('❌ Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to register document'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch intake records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const today = searchParams.get('today') === 'true';

    let query = supabase
      .from('case_intake_records')
      .select('*, case_intake_documents(*)');

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
    console.error('❌ Fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
