import { NextResponse } from 'next/server';
import { setupPermissionsTable } from '@/lib/supabase-admin';

export async function GET() {
  try {
    // Initialize the permissions table
    const result = await setupPermissionsTable();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json(
      { error: 'Failed to set up database' },
      { status: 500 }
    );
  }
} 