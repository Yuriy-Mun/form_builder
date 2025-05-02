import { createClient } from '@/lib/supabase/client';

// Function to test user permissions
export async function checkUserPermissions() {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || 'Not authenticated',
        authenticated: false,
        userId: null,
        permissions: []
      };
    }
    
    // Check user's permissions
    const { data: permissions, error: permError } = await supabase
      .from('user_permissions')
      .select('permission_code')
      .eq('user_id', authData.user.id);
      
    if (permError) {
      return {
        success: false,
        error: permError.message,
        authenticated: true,
        userId: authData.user.id,
        permissions: []
      };
    }
    
    // Test RLS on forms table directly
    const { error: testError } = await supabase
      .from('forms')
      .select('count(*)')
      .limit(1);
      
    return {
      success: !testError,
      error: testError?.message,
      authenticated: true,
      userId: authData.user.id,
      permissions: permissions?.map(p => p.permission_code) || [],
      canAccessForms: !testError
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      authenticated: false,
      userId: null,
      permissions: []
    };
  }
}

// Function to create a form with error handling
export async function createForm(formData: { 
  title: string; 
  description?: string | null; 
  active?: boolean;
}) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { 
        success: false, 
        error: 'User not authenticated' 
      };
    }
    
    // Create the form
    const { data, error } = await supabase
      .from('forms')
      .insert({
        title: formData.title,
        description: formData.description || null,
        active: formData.active ?? true,
        created_by: user.id
      })
      .select()
      .single();
      
    if (error) {
      return { 
        success: false, 
        error: error.message, 
        code: error.code,
        details: error.details
      };
    }
    
    return { 
      success: true, 
      data 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    };
  }
} 