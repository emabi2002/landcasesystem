/**
 * Create Admin User Script
 *
 * This script creates an admin user in Supabase Auth and assigns them to the Super Admin group.
 *
 * Usage:
 *   bun run scripts/create-admin-user.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Make sure .env.local has:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client (uses service role key)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ADMIN_EMAIL = 'admin@dlpp.gov.pg';
const ADMIN_PASSWORD = 'Admin@2025';

async function createAdminUser() {
  console.log('🔧 Creating Admin User...\n');

  try {
    // Step 1: Check if user already exists
    console.log('📧 Checking if admin user exists...');
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const adminExists = existingUser?.users?.find(u => u.email === ADMIN_EMAIL);

    let userId: string;

    if (adminExists) {
      console.log('✅ Admin user already exists:', ADMIN_EMAIL);
      userId = adminExists.id;
    } else {
      // Create new admin user
      console.log('➕ Creating new admin user...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'System Administrator',
          role: 'admin'
        }
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      if (!newUser?.user) {
        throw new Error('No user data returned');
      }

      userId = newUser.user.id;
      console.log('✅ Admin user created:', ADMIN_EMAIL);
    }

    // Step 2: Ensure Super Admin group exists
    console.log('\n👥 Checking Super Admin group...');
    let { data: groups, error: groupError } = await (supabase as any)
      .from('groups')
      .select('id, group_name')
      .eq('group_name', 'Super Admin')
      .single();

    if (groupError && groupError.code !== 'PGRST116') {
      throw new Error(`Failed to check group: ${groupError.message}`);
    }

    let groupId: string;

    if (!groups) {
      // Create Super Admin group
      console.log('➕ Creating Super Admin group...');
      const { data: newGroup, error: createGroupError } = await (supabase as any)
        .from('groups')
        .insert({
          group_name: 'Super Admin',
          description: 'Full system access - all modules, all permissions'
        })
        .select()
        .single();

      if (createGroupError) {
        throw new Error(`Failed to create group: ${createGroupError.message}`);
      }

      groupId = newGroup.id;
      console.log('✅ Super Admin group created');
    } else {
      groupId = groups.id;
      console.log('✅ Super Admin group already exists');
    }

    // Step 3: Assign user to group
    console.log('\n🔗 Assigning user to Super Admin group...');
    const { error: assignError } = await (supabase as any)
      .from('user_groups')
      .insert({
        user_id: userId,
        group_id: groupId
      })
      .select();

    if (assignError && assignError.code !== '23505') { // Ignore duplicate error
      throw new Error(`Failed to assign user to group: ${assignError.message}`);
    }

    console.log('✅ User assigned to Super Admin group');

    // Step 4: Grant all permissions to Super Admin group
    console.log('\n🔐 Granting permissions to Super Admin group...');

    // Get all modules
    const { data: modules, error: modulesError } = await (supabase as any)
      .from('modules')
      .select('id, module_key, module_name');

    if (modulesError) {
      console.warn('⚠️  Could not load modules:', modulesError.message);
      console.warn('   Permissions may need to be set manually via UI');
    } else if (modules && modules.length > 0) {
      // Grant full permissions for each module
      const permissions = modules.map((module: any) => ({
        group_id: groupId,
        module_id: module.id,
        can_create: true,
        can_read: true,
        can_update: true,
        can_delete: true,
        can_print: true,
        can_approve: true,
        can_export: true
      }));

      const { error: permError } = await (supabase as any)
        .from('group_module_permissions')
        .upsert(permissions, {
          onConflict: 'group_id,module_id',
          ignoreDuplicates: false
        });

      if (permError) {
        console.warn('⚠️  Could not grant all permissions:', permError.message);
        console.warn('   Permissions may need to be set manually via UI');
      } else {
        console.log(`✅ Granted full permissions for ${modules.length} modules`);
      }
    } else {
      console.warn('⚠️  No modules found in database');
      console.warn('   Run RBAC setup scripts first, or use UI to create modules');
    }

    // Success!
    console.log('\n✅ ========================================');
    console.log('✅ ADMIN USER SETUP COMPLETE!');
    console.log('✅ ========================================\n');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('👥 Group: Super Admin');
    console.log('🔐 Permissions: Full access (if modules exist)\n');
    console.log('🚀 You can now login at: http://localhost:3000/login\n');

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ ERROR CREATING ADMIN USER');
    console.error('❌ ========================================\n');

    if (error instanceof Error) {
      console.error('Error:', error.message);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error('Error:', error);
    }

    console.error('\n📚 Please refer to SETUP_ADMIN_USER.md for manual setup instructions');
    process.exit(1);
  }
}

// Run the script
createAdminUser();
