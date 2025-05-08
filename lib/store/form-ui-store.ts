import { create } from 'zustand';

interface FormUIState {
  // Theme state
  primaryColor: string;
  formTheme: string;
  devicePreview: 'desktop' | 'tablet' | 'mobile';
  
  // UI operations
  setDevicePreview: (device: 'desktop' | 'tablet' | 'mobile') => void;
  setPrimaryColor: (color: string) => void;
  setFormTheme: (theme: string) => void;
}

export const useFormUIStore = create<FormUIState>((set) => ({
  // Initial state
  primaryColor: '#4f46e5',
  formTheme: 'default',
  devicePreview: 'desktop',
  
  // Device preview setter
  setDevicePreview: (device: 'desktop' | 'tablet' | 'mobile') => {
    set({ devicePreview: device });
  },
  
  // Primary color setter
  setPrimaryColor: (color: string) => {
    set({ primaryColor: color });
  },
  
  // Form theme setter
  setFormTheme: (theme: string) => {
    set({ formTheme: theme });
  },
})); 