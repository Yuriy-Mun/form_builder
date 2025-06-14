import { create } from 'zustand';
import { Form } from './form-meta-store';
import { apiClient } from '@/lib/api/client';

// Field-specific settings interfaces
interface NumberSettings {
  prefix?: string;
  suffix?: string;
  decimal_places?: '0' | '1' | '2' | '3' | '4';
  step?: number;
  currency?: string;
  format?: 'standard' | 'currency' | 'percentage';
}

interface DateSettings {
  format?: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'DD-MM-YYYY';
  enable_time?: boolean;
  time_format?: '12h' | '24h';
  show_calendar?: boolean;
  first_day_of_week?: 0 | 1; // 0 = Sunday, 1 = Monday
}

interface ValidationRules {
  min?: string;
  max?: string;
  pattern?: string;
  email?: boolean;
  url?: boolean;
  date?: boolean;
  min_date?: string;
  max_date?: string;
  integer?: boolean;
  allowed_extensions?: string;
  max_file_size?: string;
}

interface ConditionalLogic {
  enabled?: boolean;
  action?: 'show' | 'hide';  // What to do when condition is met
  depends_on?: string;  // ID of the field this field depends on
  condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value?: string;  // Value to compare against
}

export interface FormField {
  id: string;
  form_id: string;
  type: string;
  label: string;
  placeholder?: string;
  help_text?: string;
  options?: any;
  required?: boolean;
  conditional_logic?: ConditionalLogic;
  validation_rules?: ValidationRules;
  position: number;
  active?: boolean;
  // Additional fields
  default_value?: string;
  width?: 'full' | 'half' | 'third';
  hidden?: boolean;
  read_only?: boolean;
  css_class?: string;
  // Type-specific settings
  number_settings?: NumberSettings;
  date_settings?: DateSettings;
}

interface FormFieldsState {
  // Data state
  formFields: FormField[];
  selectedField: FormField | null;
  
  // Field editing state
  editingField: string | null;
  fieldLabel: string;
  fieldHelpText: string;
  
  // Loading state
  loading: boolean;
  error: string | null;
  isFieldSaving: boolean;
  
  // Защита от дублирования запросов
  isLoading: boolean;
  lastFetchedFormId: string | null;
  
  // Operations
  fetchFormFields: (formId: string) => Promise<void>;
  addField: (formId: string, fieldType: string) => Promise<void>;
  selectField: (field: FormField | null) => void;
  deselectField: () => void;
  deleteField: (fieldId: string) => Promise<void>;
  updateField: (fieldId: string, updates: Partial<FormField>) => Promise<void>;
  updateFieldPositions: (fields: FormField[]) => Promise<void>;
  
  // State management
  setFieldLabel: (label: string) => void;
  setFieldHelpText: (helpText: string) => void;
}

export const useFormFieldsStore = create<FormFieldsState>((set, get) => ({
  // Initial state
  formFields: [],
  selectedField: null,
  editingField: null,
  fieldLabel: '',
  fieldHelpText: '',
  loading: false,
  error: null,
  isFieldSaving: false,
  isLoading: false,
  lastFetchedFormId: null,
  
  // Fetch form fields
  fetchFormFields: async (formId: string) => {
    const { isLoading, lastFetchedFormId } = get();
    
    // Предотвращаем дублирование запросов
    if (isLoading || lastFetchedFormId === formId) {
      return;
    }
    
    set({ loading: true, error: null, isLoading: true });
    
    try {
      // Fetch form fields
      const { fields: fieldsData } = await apiClient.fields.list(formId);
      
      set({
        formFields: fieldsData || [],
        lastFetchedFormId: formId,
      });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      set({ error: errorMessage });
    } finally {
      set({ loading: false, isLoading: false });
    }
  },
  
  // Add a new field
  addField: async (formId: string, fieldType: string) => {
    const { formFields } = get();
    
    if (!formId) return;
    
    set({ isFieldSaving: true });
    
    try {
      const defaultLabel = `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}`;
      const maxPosition = formFields.length > 0 
        ? Math.max(...formFields.map(f => f.position)) 
        : -1;
      
      // Default options for fields that need them
      const needsOptions = ['select', 'radio', 'checkbox', 'multiselect'].includes(fieldType);
      const defaultOptions = needsOptions ? [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' }
      ] : undefined;
      
      const newField: Partial<FormField> = {
        form_id: formId,
        type: fieldType,
        label: defaultLabel,
        placeholder: '',
        help_text: '',
        required: false,
        position: maxPosition + 1,
        active: true,
        options: defaultOptions,
        // Default type-specific settings
        ...(fieldType === 'number' ? { 
          number_settings: { decimal_places: '2' } 
        } : {}),
        ...(fieldType === 'date' ? { 
          date_settings: { format: 'YYYY-MM-DD', enable_time: false } 
        } : {})
      };
      
      const { field: data } = await apiClient.fields.create(formId, newField);
      
      set({ 
        formFields: [...formFields, data], 
        selectedField: data, 
        fieldLabel: data.label,
        fieldHelpText: data.help_text || '',
      });
      
      return data;
    } catch (err) {
      console.error('Error adding field:', err);
    } finally {
      set({ isFieldSaving: false });
    }
  },
  
  // Select a field for editing
  selectField: (field: FormField | null) => {
    set({ 
      selectedField: field,
      editingField: field?.id || null,
      fieldLabel: field?.label || '',
      fieldHelpText: field?.help_text || '',
    });
  },
  
  // Deselect the current field
  deselectField: () => {
    set({ 
      selectedField: null,
      editingField: null,
      fieldLabel: '',
      fieldHelpText: '',
    });
  },
  
  // Delete a field
  deleteField: async (fieldId: string) => {
    const { formFields, selectedField } = get();
    
    set({ isFieldSaving: true });
    
    try {
      // Find the field to get the form_id
      const fieldToDelete = formFields.find(f => f.id === fieldId);
      if (!fieldToDelete) {
        throw new Error('Field not found');
      }
      
      await apiClient.fields.delete(fieldToDelete.form_id, fieldId);
      
      // Remove field from local state and deselect if it was selected
      const updatedFields = formFields.filter(f => f.id !== fieldId);
      set({ formFields: updatedFields });
      
      if (selectedField?.id === fieldId) {
        get().deselectField();
      }
      
      // Update field positions to be sequential
      if (updatedFields.length > 0) {
        const reorderedFields = updatedFields.map((field, index) => ({
          ...field,
          position: index
        }));
        
        await get().updateFieldPositions(reorderedFields);
      }
    } catch (err) {
      console.error('Error deleting field:', err);
    } finally {
      set({ isFieldSaving: false });
    }
  },
  
  // Update a field
  updateField: async (fieldId: string, updates: Partial<FormField>) => {
    const { formFields, selectedField } = get();
    
    set({ isFieldSaving: true });
    
    try {
      // Find the field to get the form_id
      const fieldToUpdate = formFields.find(f => f.id === fieldId);
      if (!fieldToUpdate) {
        throw new Error('Field not found');
      }
      
      const { field: data } = await apiClient.fields.update(fieldToUpdate.form_id, fieldId, updates);
      
      // Update field in local state
      const updatedFields = formFields.map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      );
      
      set({ 
        formFields: updatedFields,
        // If updating the currently selected field, update selectedField as well
        selectedField: selectedField?.id === fieldId 
          ? { ...selectedField, ...updates } 
          : selectedField
      });
      
      return data;
    } catch (err) {
      console.error('Error updating field:', err);
    } finally {
      set({ isFieldSaving: false });
    }
  },
  
  // Update field positions (used for drag and drop)
  updateFieldPositions: async (fields: FormField[]) => {
    set({ isFieldSaving: true });
    
    try {
      // Get form_id from the first field
      if (fields.length === 0) return;
      
      const formId = fields[0].form_id;
      
      // Use bulk update API
      const { fields: updatedFields } = await apiClient.fields.bulkUpdate(formId, fields);
      
      set({ formFields: updatedFields });
    } catch (err) {
      console.error('Error updating field positions:', err);
    } finally {
      set({ isFieldSaving: false });
    }
  },
  
  // Set field label (for UI state before saving)
  setFieldLabel: (label: string) => {
    set({ fieldLabel: label });
  },
  
  // Set field help text (for UI state before saving)
  setFieldHelpText: (helpText: string) => {
    set({ fieldHelpText: helpText });
  },
}));