'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormBuilder, FormValues } from '@/components/form-builder/form-builder';
import { FormField, FormFieldEditor } from '@/components/form-builder/form-field-editor';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import { checkUserPermissions } from '@/lib/supabase/forms';
import { syncAuthUserWithDatabase } from '@/lib/supabase/user-sync';

export default function ImportWordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'form-details' | 'field-editor'>('form-details');
  const [formDetails, setFormDetails] = useState<FormValues | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const router = useRouter();
  
  // Get the form fields from sessionStorage on mount
  useEffect(() => {
    const storedFields = sessionStorage.getItem('importedFields');
    if (storedFields) {
      try {
        const parsedFields = JSON.parse(storedFields);
        if (Array.isArray(parsedFields) && parsedFields.length > 0) {
          // Ensure all fields have the required properties
          const validatedFields = parsedFields.map((field, index) => ({
            id: field.id || `field-${Date.now()}-${index}`,
            type: field.type || 'text',
            label: field.label || 'Untitled Field',
            required: field.required !== undefined ? field.required : false,
            placeholder: field.placeholder || '',
            options: field.options || [],
            conditional_logic: field.conditional_logic || undefined
          }));
          
          setFormFields(validatedFields);
          // Clear sessionStorage to avoid reusing these fields if the user navigates away
          sessionStorage.removeItem('importedFields');
        } else {
          // No valid fields found, redirect back to forms
          toast.error('No form fields found. Please try importing again.');
          router.push('/admin/forms');
        }
      } catch (e) {
        toast.error('Error processing imported fields');
        router.push('/admin/forms');
      }
    } else {
      // No fields in storage, redirect back to forms
      toast.error('No form fields found. Please try importing again.');
      router.push('/admin/forms');
    }
  }, [router]);
  
  // Get the current user ID and check permissions when the component mounts
  useEffect(() => {
    async function checkAuth() {
      try {
        // First sync the user with the database
        const syncResult = await syncAuthUserWithDatabase();
        
        if (!syncResult.success) {
          // Failed to sync user - redirect to login
          router.push('/admin/login');
          return;
        }
        
        // Then check permissions
        const permResult = await checkUserPermissions();
        
        if (permResult.authenticated) {
          setUserId(permResult.userId);
        } else {
          // Not authenticated - redirect to login
          router.push('/admin/login');
          return;
        }
      } catch (error) {
        // Error in authentication - redirect to login
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, [router]);
  
  async function handleSaveFormDetails(formData: FormValues) {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }
    
    setFormDetails(formData);
    setStep('field-editor');
    toast.success('Form details saved. Now add your form fields.');
  }
  
  async function handleSaveFormFields(fields: FormField[]) {
    if (!formDetails) {
      toast.error('Form details are missing');
      return;
    }
    
    if (!userId) {
      toast.error('You must be logged in to create a form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const supabase = getSupabaseClient();
      
      // First, insert the form
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .insert({
          title: formDetails.title,
          description: formDetails.description || null,
          active: formDetails.active,
          created_by: userId
        })
        .select()
        .single();
      
      if (formError) {
        throw new Error(formError.message);
      }
      
      if (!formData) {
        throw new Error('Failed to create form');
      }
      
      // Then, insert the form fields
      if (fields.length > 0) {
        const formattedFields = fields.map((field, index) => ({
          form_id: formData.id,
          type: field.type,
          label: field.label,
          options: field.options || null,
          required: field.required,
          placeholder: field.placeholder || null,
          order: index,
          conditional_logic: field.conditional_logic || null
        }));
        
        const { error: fieldsError } = await supabase
          .from('form_fields')
          .insert(formattedFields);
          
        if (fieldsError) {
          throw new Error(fieldsError.message);
        }
      }
      
      toast.success('Form created successfully');
      router.push('/admin/forms');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create form');
      // Don't redirect on error
    } finally {
      setIsSubmitting(false);
    }
  }
  
  function handleCancelForm() {
    router.push('/admin/forms');
  }
  
  function handleCancelFieldEditor() {
    setStep('form-details');
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Import Form from Word</h1>
      
      {step === 'form-details' && (
        <>
          <p className="mb-6 text-muted-foreground">
            Your Word document has been parsed successfully. We found {formFields.length} questions.
            Please provide some basic information about your form.
          </p>
          
          <FormBuilder 
            onSave={handleSaveFormDetails} 
            onCancel={handleCancelForm}
            showRedirectSuccess={false}
            initialData={formDetails || undefined}
          />
        </>
      )}
      
      {step === 'field-editor' && (
        <div>
          <p className="mb-6 text-muted-foreground">
            The AI has parsed {formFields.length} questions from your Word document. 
            Review and edit them as needed, then save to create your form.
          </p>
          
          <div className="bg-muted p-4 rounded-md mb-6">
            <h3 className="font-medium mb-2">Form Details</h3>
            <p><strong>Title:</strong> {formDetails?.title}</p>
            {formDetails?.description && <p><strong>Description:</strong> {formDetails.description}</p>}
            <p><strong>Status:</strong> {formDetails?.active ? 'Active' : 'Inactive'}</p>
          </div>
          
          <div>
            {/* Use the Field Editor component to edit the parsed fields */}
            <div className="mt-4">
              <FormFieldEditor 
                onSave={handleSaveFormFields} 
                onCancel={handleCancelFieldEditor}
                initialFields={formFields}
                formName={formDetails?.title || "Imported Form"}
                formDescription={formDetails?.description || ""}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 