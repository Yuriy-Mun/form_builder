import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated and has admin privileges
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has admin privileges
    const { data: userPermissions, error: permissionError } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('permission_slug', 'admin.access')
      .single();
    
    if (permissionError || !userPermissions) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Execute the SQL to add the status column to forms table
    const addStatusSQL = `
      -- Add status column to forms table
      ALTER TABLE forms ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' NOT NULL;
      
      -- Create index on status for faster filtering
      CREATE INDEX IF NOT EXISTS forms_status_idx ON forms (status);
      
      -- Update function to include status field in table creation
      CREATE OR REPLACE FUNCTION create_forms_table()
      RETURNS JSON AS $$
      BEGIN
        -- Create the table if it doesn't exist
        CREATE TABLE IF NOT EXISTS forms (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          active BOOLEAN NOT NULL DEFAULT true,
          status VARCHAR(20) DEFAULT 'draft' NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS forms_created_by_idx ON forms (created_by);
        CREATE INDEX IF NOT EXISTS forms_active_idx ON forms (active);
        CREATE INDEX IF NOT EXISTS forms_status_idx ON forms (status);
        
        RETURN json_build_object('success', true, 'message', 'Forms table created successfully');
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Execute the SQL using PostgreSQL functions
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: addStatusSQL });
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      return NextResponse.json(
        { error: 'Failed to execute SQL migration', details: sqlError.message },
        { status: 500 }
      );
    }
    
    // Update existing records to have the status field
    const { error: updateError } = await supabase
      .from('forms')
      .update({ status: 'draft' })
      .is('status', null);
    
    if (updateError) {
      console.error('Error updating existing forms:', updateError);
      return NextResponse.json(
        { error: 'Failed to update existing forms', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully added status field to forms table'
    });
  } catch (err) {
    console.error('Error in forms/status API:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
} 