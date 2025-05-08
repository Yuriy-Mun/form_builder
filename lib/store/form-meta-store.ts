import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface Form {
  id: string;
  title: string;
  description?: string | null;
  created_by?: string;
  active?: boolean;
  status?: 'draft' | 'published' | 'locked';
}

interface FormMetaState {
  // Form metadata state
  form: Form | null;
  formTitle: string;
  formDescription: string;
  formStatus: 'draft' | 'published' | 'locked';
  
  // Loading states
  loading: boolean;
  error: string | null;
  isSaving: boolean;
  
  // Operations
  fetchForm: (formId: string) => Promise<void>;
  updateFormTitle: (title: string) => Promise<void>;
  updateFormDescription: (description: string) => Promise<void>;
  updateFormStatus: (status: 'draft' | 'published' | 'locked') => Promise<void>;
  setForm: (form: Form | null) => void;
}

export const useFormMetaStore = create<FormMetaState>((set, get) => ({
  // Initial state
  form: null,
  formTitle: '',
  formDescription: '',
  formStatus: 'draft',
  loading: true,
  error: null,
  isSaving: false,
  
  // Fetch form
  fetchForm: async (formId: string) => {
    const supabase = getSupabaseClient();
    
    set({ loading: true, error: null });
    
    try {
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User authentication error:', userError);
        throw new Error('You must be logged in to view this form');
      }
      
      // Fetch form
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
        
      if (formError) {
        console.error('Error fetching form:', formError);
        if (formError.code === 'PGRST116') {
          throw new Error('Form not found');
        }
        throw new Error(formError.message);
      }
      
      if (!formData) {
        throw new Error('Form not found');
      }
      
      set({
        form: formData,
        formTitle: formData.title,
        formDescription: formData.description || '',
        formStatus: formData.status || 'draft',
      });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      set({ error: errorMessage });
      
      // If error is form not found, initialize new form
      if (errorMessage === 'Form not found' && formId) {
        const newForm = {
          id: formId,
          title: 'Untitled',
          status: 'draft' as const,
        };
        set({
          form: newForm,
          formTitle: newForm.title,
          formDescription: '',
          formStatus: 'draft',
        });
        console.log('Form not found, initializing as new untitled form.');
      }
    } finally {
      set({ loading: false });
    }
  },
  
  setForm: (form: Form | null) => {
    set({ 
      form,
      formTitle: form?.title || '',
      formDescription: form?.description || '',
      formStatus: (form?.status as 'draft' | 'published' | 'locked') || 'draft'
    });
  },
  
  // Update form title
  updateFormTitle: async (title: string) => {
    const { form } = get();
    const supabase = getSupabaseClient();
    
    if (!form || title.trim() === '' || title === form.title) return;
    
    set({ isSaving: true });
    
    try {
      const { error } = await supabase
        .from('forms')
        .update({ title })
        .eq('id', form.id);
        
      if (error) {
        console.error('Error updating form title:', error);
        return;
      }
      
      set({ form: { ...form, title }, formTitle: title });
    } catch (err) {
      console.error('Error updating title:', err);
    } finally {
      set({ isSaving: false });
    }
  },
  
  // Update form description
  updateFormDescription: async (description: string) => {
    const { form } = get();
    const supabase = getSupabaseClient();
    
    if (!form || description === form.description) return;
    
    set({ isSaving: true });
    
    try {
      const { error } = await supabase
        .from('forms')
        .update({ description })
        .eq('id', form.id);
        
      if (error) {
        console.error('Error updating form description:', error);
        return;
      }
      
      set({ form: { ...form, description }, formDescription: description });
    } catch (err) {
      console.error('Error updating description:', err);
    } finally {
      set({ isSaving: false });
    }
  },
  
  // Update form status
  updateFormStatus: async (status: 'draft' | 'published' | 'locked') => {
    const { form } = get();
    const supabase = getSupabaseClient();
    
    if (!form) return;
    
    set({ isSaving: true });
    
    try {
      const { error } = await supabase
        .from('forms')
        .update({ status })
        .eq('id', form.id);
        
      if (error) {
        console.error('Error updating form status:', error);
        return;
      }
      
      set({ form: { ...form, status }, formStatus: status });
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      set({ isSaving: false });
    }
  },
})); 