'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormBuilder, FormValues } from '@/components/form-builder/form-builder';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function EditFormPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isUserChecking, setIsUserChecking] = useState(true);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  // Get the current user ID first
  useEffect(() => {
    async function getCurrentUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setIsUserChecking(false);
      }
    }
    
    getCurrentUser();
  }, []);

  // Load form data after we have the user ID
  useEffect(() => {
    async function loadForm() {
      if (isUserChecking) return; // Wait until user check is complete
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single();

        if (error) {
          throw error;
        }

        setFormData({
          title: data.title,
          description: data.description || '',
          active: data.active,
        });
      } catch (error: any) {
        console.error('Error loading form:', error);
        toast.error(error.message || 'Failed to load form data');
        router.push('/admin/forms');
      } finally {
        setIsLoading(false);
      }
    }

    if (formId) {
      loadForm();
    }
  }, [formId, router, isUserChecking]);

  async function handleSaveForm(values: FormValues) {
    if (!values.title) {
      toast.error('Title is required');
      return;
    }
    
    if (!userId) {
      toast.error('You must be logged in to update a form');
      router.push('/admin/login');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('forms')
        .update({
          title: values.title,
          description: values.description || null,
          active: values.active,
        })
        .eq('id', formId);

      if (error) {
        throw error;
      }

      toast.success('Form updated successfully');
      router.push('/admin/forms');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating form:', error);
      toast.error(error.message || 'Failed to update form');
    }
  }

  function handleCancel() {
    router.push('/admin/forms');
  }

  if (isUserChecking || isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-muted-foreground">
            {isUserChecking ? 'Checking user permissions...' : 'Loading form data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Edit Form</h1>
      {formData && (
        <FormBuilder 
          onSave={handleSaveForm} 
          initialData={formData} 
          isEditing={true}
          onCancel={handleCancel}
          showRedirectSuccess={true}
        />
      )}
    </div>
  );
} 