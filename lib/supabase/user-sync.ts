import { createClient } from '@/lib/supabase/client';

/**
 * Checks if the current logged-in user exists in the users table,
 * and creates them if they don't, assigning a basic role.
 */
export async function syncAuthUserWithDatabase() {
  try {
    const supabase = createClient();
    
    // Get the current auth user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const userId = authData.user.id;
    const userEmail = authData.user.email;
    
    if (!userEmail) {
      return { success: false, error: 'User email not available' };
    }
    
    // Check if user exists in the users table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    // If user doesn't exist in the users table, create them
    if (!existingUser && !userError?.code?.includes('PGRST116')) {
      // Get a default role (user role)
      const { data: defaultRole, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('code', 'user')
        .single();
      
      if (roleError) {
        return { success: false, error: 'Default role not found' };
      }
      
      // Insert the user into the users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          role_id: defaultRole.id
        });
      
      if (insertError) {
        return { success: false, error: insertError.message };
      }
      
      return { success: true, message: 'User created in database', isNew: true };
    }
    
    return { 
      success: true, 
      message: 'User already exists in database', 
      isNew: false, 
      user: existingUser 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
} 