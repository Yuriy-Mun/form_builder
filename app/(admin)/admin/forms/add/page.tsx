'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormBuilder, FormValues } from '@/components/form-builder/form-builder';
import { FormFieldEditor, FormField } from '@/components/form-builder/form-field-editor';
import { toast } from 'sonner';
import { checkUserPermissions } from '@/lib/supabase/forms';
import { syncAuthUserWithDatabase } from '@/lib/supabase/user-sync';
import { apiClient } from '@/lib/api/client';

export default function AddFormPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'form-details' | 'field-editor'>('form-details');
  const [formDetails, setFormDetails] = useState<FormValues | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const router = useRouter();
  
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
      // First, create the form using our API
      const { form } = await apiClient.forms.create({
        title: formDetails.title,
        description: formDetails.description || null,
        active: formDetails.active,
      });
      
      if (!form) {
        throw new Error('Failed to create form');
      }
      
      // Then, create the form fields if any exist
      if (fields.length > 0) {
        const formattedFields = fields.map((field, index) => ({
          type: field.type,
          label: field.label,
          options: field.options || null,
          required: field.required,
          placeholder: field.placeholder || null,
          position: index, // Use position instead of order
          active: true,
        }));
        
        // Create fields one by one or use bulk update
        for (const field of formattedFields) {
          await apiClient.fields.create(form.id, field);
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
      <h1 className="text-3xl font-bold mb-8">Create New Form</h1>
      
      {step === 'form-details' ? (
        <FormBuilder 
          onSave={handleSaveFormDetails} 
          onCancel={handleCancelForm}
          showRedirectSuccess={false}
          initialData={formDetails || undefined}
        />
      ) : (
        <>
          <FormFieldEditor 
            onSave={handleSaveFormFields} 
            onCancel={handleCancelFieldEditor}
            initialFields={formFields}
            formName={formDetails?.title || "Untitled Form"}
            formDescription={formDetails?.description || ""}
          />
        </>
      )}
    </div>
  );
} 