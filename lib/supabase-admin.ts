import { createClient } from '@supabase/supabase-js';

// For server-side operations with elevated privileges
export const createAdminClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

// Create permissions table if it doesn't exist
export const setupPermissionsTable = async () => {
  const supabase = createAdminClient();
  
  // Check if the permissions table exists
  const { error: checkError } = await supabase
    .from('permissions')
    .select('name')
    .limit(1);
  
  // If the table doesn't exist, create it
  if (checkError && checkError.message.includes('relation "permissions" does not exist')) {
    console.log('Creating permissions table...');
    const { error: createError } = await supabase.rpc('create_permissions_table');
    
    if (createError) {
      console.error('Error creating permissions table:', createError);
      return { success: false, error: createError };
    }
    
    console.log('Permissions table created successfully');
    return { success: true };
  }
  
  return { success: true, message: 'Permissions table already exists' };
};

// Add a new permission
export const addPermission = async (name: string, slug: string) => {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('permissions')
    .insert([
      { name, slug }
    ])
    .select();
  
  if (error) {
    console.error('Error adding permission:', error);
    return { success: false, error };
  }
  
  return { success: true, data };
};

// Get all permissions
export const getAllPermissions = async () => {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching permissions:', error);
    return { success: false, error };
  }
  
  return { success: true, data };
}; 