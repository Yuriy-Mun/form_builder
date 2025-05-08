/**
 * @deprecated This file is kept for backwards compatibility. Use the separate stores instead:
 * - form-meta-store.ts - for form metadata (title, description, status)
 * - form-fields-store.ts - for form fields
 * - form-ui-store.ts - for UI states (device preview, theme)
 */

import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase/client';
import { 
  useFormMetaStore, 
  Form 
} from './form-meta-store';
import { 
  useFormFieldsStore, 
  FormField 
} from './form-fields-store';
import { useFormUIStore } from './form-ui-store';

// Re-export types for backward compatibility
export type { Form, FormField };

// Create a proxy store that combines all the other stores
interface FormEditorState {
  // Supabase client
  supabase: any;
  
  // Form and fields state
  loading: boolean;
  error: string | null;
  form: Form | null;
  formFields: FormField[];
  
  // Form metadata state
  formTitle: string;
  formDescription: string;
  formStatus: 'draft' | 'published' | 'locked';
  
  // Field editing state
  editingField: string | null;
  selectedField: FormField | null;
  fieldLabel: string;
  fieldHelpText: string;
  
  // Theme state
  primaryColor: string;
  formTheme: string;
  devicePreview: 'desktop' | 'tablet' | 'mobile';
  
  // Saving state indicators
  isSaving: boolean;
  isFormSettingsSaving: boolean;
  isFieldSaving: boolean;
  
  // Form operations
  initSupabase: () => void;
  fetchFormAndFields: (formId: string) => Promise<void>;
  updateFormTitle: (title: string) => Promise<void>;
  updateFormDescription: (description: string) => Promise<void>;
  updateFormStatus: (status: 'draft' | 'published' | 'locked') => Promise<void>;
  
  // Field operations
  addField: (fieldType: string) => Promise<void>;
  selectField: (field: FormField) => void;
  deselectField: () => void;
  deleteField: (fieldId: string) => Promise<void>;
  updateField: (fieldId: string, updates: Partial<FormField>) => Promise<void>;
  updateFieldPositions: (fields: FormField[]) => Promise<void>;
  
  // UI state operations
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFieldLabel: (label: string) => void;
  setFieldHelpText: (helpText: string) => void;
  setDevicePreview: (device: 'desktop' | 'tablet' | 'mobile') => void;
  setPrimaryColor: (color: string) => void;
  setFormTheme: (theme: string) => void;
}

export const useFormEditorStore = create<FormEditorState>((set, get) => ({
  // Proxy state that pulls from individual stores
  get supabase() { return getSupabaseClient(); },
  get loading() { 
    return useFormMetaStore.getState().loading || useFormFieldsStore.getState().loading; 
  },
  get error() { 
    return useFormMetaStore.getState().error || useFormFieldsStore.getState().error; 
  },
  get form() { return useFormMetaStore.getState().form; },
  get formFields() { return useFormFieldsStore.getState().formFields; },
  get formTitle() { return useFormMetaStore.getState().formTitle; },
  get formDescription() { return useFormMetaStore.getState().formDescription; },
  get formStatus() { return useFormMetaStore.getState().formStatus; },
  get editingField() { return useFormFieldsStore.getState().editingField; },
  get selectedField() { return useFormFieldsStore.getState().selectedField; },
  get fieldLabel() { return useFormFieldsStore.getState().fieldLabel; },
  get fieldHelpText() { return useFormFieldsStore.getState().fieldHelpText; },
  get primaryColor() { return useFormUIStore.getState().primaryColor; },
  get formTheme() { return useFormUIStore.getState().formTheme; },
  get devicePreview() { return useFormUIStore.getState().devicePreview; },
  get isSaving() { return useFormMetaStore.getState().isSaving; },
  get isFormSettingsSaving() { return useFormMetaStore.getState().isSaving; },
  get isFieldSaving() { return useFormFieldsStore.getState().isFieldSaving; },
  
  // Proxy methods
  // Keep for backward compatibility but warn about deprecation
  initSupabase: () => {
    console.warn('initSupabase is deprecated and no longer needed with the new store architecture');
    // Initialize happens automatically through getSupabaseClient now
  },
  
  fetchFormAndFields: async (formId: string) => {
    console.warn('fetchFormAndFields is deprecated. Use loadFormWithFields from form-utils.ts instead');
    const fetchForm = useFormMetaStore.getState().fetchForm;
    const fetchFields = useFormFieldsStore.getState().fetchFormFields;
    
    await Promise.all([
      fetchForm(formId),
      fetchFields(formId)
    ]);
  },
  
  // Form operations
  updateFormTitle: (title: string) => useFormMetaStore.getState().updateFormTitle(title),
  updateFormDescription: (description: string) => useFormMetaStore.getState().updateFormDescription(description),
  updateFormStatus: (status: 'draft' | 'published' | 'locked') => useFormMetaStore.getState().updateFormStatus(status),
  
  // Field operations
  addField: async (fieldType: string) => {
    // We need to get the form ID from the meta store
    const formId = useFormMetaStore.getState().form?.id;
    if (!formId) {
      console.error('Cannot add field: No form ID available');
      return;
    }
    
    return await useFormFieldsStore.getState().addField(formId, fieldType);
  },
  selectField: (field: FormField) => useFormFieldsStore.getState().selectField(field),
  deselectField: () => useFormFieldsStore.getState().deselectField(),
  deleteField: (fieldId: string) => useFormFieldsStore.getState().deleteField(fieldId),
  updateField: (fieldId: string, updates: Partial<FormField>) => useFormFieldsStore.getState().updateField(fieldId, updates),
  updateFieldPositions: (fields: FormField[]) => useFormFieldsStore.getState().updateFieldPositions(fields),
  
  // UI state operations
  setLoading: (loading: boolean) => {
    console.warn('setLoading is deprecated and should not be used directly');
  },
  setError: (error: string | null) => {
    console.warn('setError is deprecated and should not be used directly');
  },
  setFieldLabel: (label: string) => useFormFieldsStore.getState().setFieldLabel(label),
  setFieldHelpText: (helpText: string) => useFormFieldsStore.getState().setFieldHelpText(helpText),
  setDevicePreview: (device: 'desktop' | 'tablet' | 'mobile') => useFormUIStore.getState().setDevicePreview(device),
  setPrimaryColor: (color: string) => useFormUIStore.getState().setPrimaryColor(color),
  setFormTheme: (theme: string) => useFormUIStore.getState().setFormTheme(theme),
})); 