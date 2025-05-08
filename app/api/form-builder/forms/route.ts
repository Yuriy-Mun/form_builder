import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Supabase error getting session:', sessionError);
      return NextResponse.json({ error: 'Error getting user session' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create a new form in the 'forms' table
    // Assuming your table has a 'user_id' column to associate the form with the user
    const { data, error } = await supabase
      .from('forms')
      .insert([{ 
        title: title, 
        description: null, // Default value
        active: true,      // Default value
        user_id: session.user.id // Associate with the logged-in user
      }]) 
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating form:', error);
      // Check if it's an RLS violation error specifically
      if (error.message.includes('violates row-level security policy')) {
        return NextResponse.json({ error: `RLS: ${error.message}` }, { status: 403 }); // Forbidden
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      console.error('Supabase error: No data returned after insert');
      return NextResponse.json({ error: 'Failed to create form, no data returned.' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Error processing POST request:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
} 