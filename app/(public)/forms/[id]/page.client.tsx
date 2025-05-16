"use client";

import { useState, useEffect } from "react";
import { ModernFormRenderer } from "@/components/form-builder/modern-form-renderer";
import { FormSkeleton } from "@/components/form-builder/form-skeleton";
import { FormError } from "@/components/form-builder/form-error";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface PublicFormPageClientProps {
  initialFormData: {
    form: any;
    fields: any[];
  } | null;
  initialError: string | null;
}

export default function PublicFormPageClient({ 
  initialFormData, 
  initialError 
}: PublicFormPageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(!!initialFormData?.form?.require_login);
  const [error, setError] = useState<string | null>(initialError);
  const [form, setForm] = useState<any>(initialFormData?.form || null);
  const [fields, setFields] = useState<any[]>(initialFormData?.fields || []);

  // Authentication check and client-side data loading if needed
  useEffect(() => {
    // Start authentication check if the form is provided and requires login
    const checkAuthAndLoadData = async () => {
      try {
        // If initial data wasn't provided, load it on the client
        if (!initialFormData && !initialError) {
          await loadFormData();
          return;
        }

        // If there's an error, don't perform authentication check
        if (initialError) {
          setLoading(false);
          return;
        }

        // If the form requires authentication, verify
        if (initialFormData?.form?.require_login) {
          setAuthChecking(true);
          const supabase = getSupabaseClient();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            setError('Authentication is required to access this form');
          }
          
          setAuthChecking(false);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error during authentication check:', err);
        setError(err.message || 'An error occurred during authentication check');
        setAuthChecking(false);
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [initialFormData, initialError]);

  // Function to load form data on the client
  const loadFormData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get ID from URL
      const formId = window.location.pathname.split('/').pop();
      
      if (!formId) {
        throw new Error('Form not found');
      }

      const supabase = getSupabaseClient();
      
      // Request the form
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('active', true)
        .single();
      
      if (formError) throw new Error(formError.message);
      if (!formData) throw new Error('Form not found');
      
      // Check if authentication is required
      if (formData.require_login) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Authentication is required for this form');
        }
      }
      
      // Request form fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formId)
        .eq('active', true)
        .order('position', { ascending: true });
      
      if (fieldsError) throw new Error(fieldsError.message);
      
      setForm(formData);
      setFields(fieldsData || []);
    } catch (err: any) {
      console.error('Error loading form:', err);
      setError(err.message || 'Failed to load form');
    } finally {
      setLoading(false);
      setAuthChecking(false);
    }
  };

  // Redirect to login page
  const handleLogin = () => {
    // Save current URL for return after authentication
    const returnUrl = window.location.pathname;
    localStorage.setItem('authReturnUrl', returnUrl);
    router.push('/auth/login');
  };
  
  if (loading || authChecking) {
    return <FormSkeleton />;
  }
  
  if (error) {
    // If the error is related to authentication, show login button
    if (error.includes('Authentication') || error.includes('login')) {
      return (
        <FormError
          title="Authentication Required"
          message={error}
          action={{
            label: "Log In",
            onClick: handleLogin
          }}
        />
      );
    }
    
    return (
      <FormError
        title="Error"
        message={error}
      />
    );
  }
  
  if (!form) {
    return (
      <FormError
        title="Form Not Found"
        message="The form you are looking for does not exist or is no longer active."
      />
    );
  }
  
  return <ModernFormRenderer form={form} fields={fields} />;
} 