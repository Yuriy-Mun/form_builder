import { createAdminClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const filePath = path.join(process.cwd(), 'lib', 'supabase', 'sql', 'user_permissions.sql');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'SQL file not found' }, { status: 404 });
    }
    
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the SQL to create the view
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error creating user_permissions view:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'User permissions view created successfully' });
  } catch (error: any) {
    console.error('Error in setup route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 