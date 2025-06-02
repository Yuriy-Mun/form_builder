import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';

export interface Form {
  id: string;
  title: string;
  description?: string | null;
  created_by?: string;
  active?: boolean;
  status?: 'draft' | 'published' | 'locked';
  theme_settings?: {
    primaryColor: string;
    formTheme: string;
    layout: string;
  };
}

interface FormMetaState {
  // Form metadata state
  form: Form | null;
  formTitle: string;
  formDescription: string;
  formStatus: 'draft' | 'published' | 'locked';
  themeSettings: {
    primaryColor: string;
    formTheme: string;
    layout: string;
  };
  
  // Loading states
  loading: boolean;
  error: string | null;
  isSaving: boolean;
  
  // Защита от дублирования запросов
  isLoading: boolean;
  lastFetchedFormId: string | null;
  
  // Operations
  fetchForm: (formId: string) => Promise<void>;
  updateFormTitle: (title: string) => Promise<void>;
  updateFormDescription: (description: string) => Promise<void>;
  updateFormStatus: (status: 'draft' | 'published' | 'locked') => Promise<void>;
  updateThemeSettings: (settings: Partial<{ primaryColor: string; formTheme: string; layout: string }>) => Promise<void>;
  setForm: (form: Form | null) => void;
}

export const useFormMetaStore = create<FormMetaState>((set, get) => ({
  // Initial state
  form: null,
  formTitle: '',
  formDescription: '',
  formStatus: 'draft',
  themeSettings: {
    primaryColor: '#4f46e5',
    formTheme: 'default',
    layout: 'default',
  },
  loading: true,
  error: null,
  isSaving: false,
  isLoading: false,
  lastFetchedFormId: null,
  
  // Fetch form
  fetchForm: async (formId: string) => {
    const { isLoading, lastFetchedFormId } = get();
    
    // Предотвращаем дублирование запросов
    if (isLoading || lastFetchedFormId === formId) {
      return;
    }
    
    set({ loading: true, error: null, isLoading: true });
    
    try {
      // Check if user is authenticated
      try {
        await apiClient.auth.getUser();
      } catch (userError) {
        console.error('User authentication error:', userError);
        throw new Error('You must be logged in to view this form');
      }
      
      // Fetch form
      const { form: formData } = await apiClient.forms.get(formId);
      
      if (!formData) {
        throw new Error('Form not found');
      }
      
      set({
        form: formData,
        formTitle: formData.title,
        formDescription: formData.description || '',
        formStatus: formData.status || 'draft',
        themeSettings: formData.theme_settings || {
          primaryColor: '#4f46e5',
          formTheme: 'default',
          layout: 'default',
        },
        lastFetchedFormId: formId,
      });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      set({ error: errorMessage });
      
      // If error is form not found, initialize new form
      if (errorMessage.includes('not found') && formId) {
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
          themeSettings: {
            primaryColor: '#4f46e5',
            formTheme: 'default',
            layout: 'default',
          },
          lastFetchedFormId: formId,
        });
        console.log('Form not found, initializing as new untitled form.');
      }
    } finally {
      set({ loading: false, isLoading: false });
    }
  },
  
  setForm: (form: Form | null) => {
    set({ 
      form,
      formTitle: form?.title || '',
      formDescription: form?.description || '',
      formStatus: (form?.status as 'draft' | 'published' | 'locked') || 'draft',
      themeSettings: form?.theme_settings || {
        primaryColor: '#4f46e5',
        formTheme: 'default',
        layout: 'default',
      },
    });
  },
  
  // Update form title
  updateFormTitle: async (title: string) => {
    const { form } = get();
    
    if (!form || title.trim() === '' || title === form.title) return;
    
    set({ isSaving: true });
    
    try {
      const { form: updatedForm } = await apiClient.forms.update(form.id, { title });
      
      set({ form: updatedForm, formTitle: title });
    } catch (err) {
      console.error('Error updating title:', err);
    } finally {
      set({ isSaving: false });
    }
  },
  
  // Update form description
  updateFormDescription: async (description: string) => {
    const { form } = get();
    
    if (!form || description === form.description) return;
    
    set({ isSaving: true });
    
    try {
      const { form: updatedForm } = await apiClient.forms.update(form.id, { description });
      
      set({ form: updatedForm, formDescription: description });
    } catch (err) {
      console.error('Error updating description:', err);
    } finally {
      set({ isSaving: false });
    }
  },
  
  // Update form status
  updateFormStatus: async (status: 'draft' | 'published' | 'locked') => {
    const { form } = get();
    
    if (!form) return;
    
    set({ isSaving: true });
    
    try {
      const { form: updatedForm } = await apiClient.forms.update(form.id, { status });
      
      set({ form: updatedForm, formStatus: status });
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      set({ isSaving: false });
    }
  },
  
  // Update theme settings
  updateThemeSettings: async (settings: Partial<{ primaryColor: string; formTheme: string; layout: string }>) => {
    const { form, themeSettings } = get();
    
    if (!form) return;
    
    set({ isSaving: true });
    
    try {
      const currentThemeSettings = form.theme_settings || {
        primaryColor: '#4f46e5',
        formTheme: 'default',
        layout: 'default'
      };
      
      const updatedThemeSettings = { ...currentThemeSettings, ...settings };
      
      const { form: updatedForm } = await apiClient.forms.update(form.id, { 
        theme_settings: updatedThemeSettings 
      });
      
      set({
        form: updatedForm,
        themeSettings: updatedThemeSettings,
      });
    } catch (err) {
      console.error('Error updating theme settings:', err);
    } finally {
      set({ isSaving: false });
    }
  },
})); 