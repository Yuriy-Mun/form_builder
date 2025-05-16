import { create } from "zustand";

export interface FormData {
  id?: string;
  title: string;
  description?: string;
  active?: boolean;
  status?: string;
  // Advanced settings
  email_notifications?: boolean;
  confirmation_message?: string;
  require_login?: boolean;
  limit_submissions?: boolean;
  max_submissions_per_user?: number;
  // Metadata
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface FormStore {
  form: FormData;
  isLoading: boolean;
  error: string | null;
  setForm: (form: FormData) => void;
  updateForm: (updates: Partial<FormData>) => void;
  resetForm: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultForm: FormData = {
  title: "",
  description: "",
  status: "draft",
  active: true,
  email_notifications: false,
  confirmation_message: "",
  require_login: false,
  limit_submissions: false,
  max_submissions_per_user: 1,
};

export const useFormStore = create<FormStore>((set) => ({
  form: { ...defaultForm },
  isLoading: false,
  error: null,
  setForm: (form) => set({ form }),
  updateForm: (updates) => set((state) => ({ form: { ...state.form, ...updates } })),
  resetForm: () => set({ form: { ...defaultForm } }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
})); 