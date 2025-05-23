import { useEffect } from 'react';

interface ThemeSettings {
  primaryColor: string;
  formTheme: string;
  layout: string;
}

interface UseFormThemeProps {
  themeSettings?: ThemeSettings;
}

// Цветовая палитра с соответствующими CSS переменными
const colorMappings: Record<string, string> = {
  '#4f46e5': 'indigo', // Indigo
  '#0ea5e9': 'sky', // Blue
  '#10b981': 'emerald', // Emerald
  '#f59e0b': 'amber', // Amber
  '#ef4444': 'red', // Rose
  '#8b5cf6': 'violet', // Purple
  '#14b8a6': 'teal', // Teal
  '#f97316': 'orange', // Orange
};

export function useFormTheme({ themeSettings }: UseFormThemeProps) {
  useEffect(() => {
    if (!themeSettings) return;

    const { primaryColor, formTheme, layout } = themeSettings;
    
    // Получаем корневой элемент
    const root = document.documentElement;
    
    // Применяем основной цвет
    if (primaryColor) {
      // Находим соответствующий цвет из палитры Tailwind
      const colorName = colorMappings[primaryColor];
      
      if (colorName) {
        // Устанавливаем CSS переменные для основного цвета
        root.style.setProperty('--form-primary-color', `var(--color-${colorName}-500)`);
        root.style.setProperty('--form-primary-color-hover', `var(--color-${colorName}-600)`);
        root.style.setProperty('--form-primary-color-light', `var(--color-${colorName}-50)`);
        root.style.setProperty('--form-primary-color-dark', `var(--color-${colorName}-900)`);
        
        // Устанавливаем переменные для разных оттенков
        for (let i = 50; i <= 950; i += i < 100 ? 50 : 100) {
          root.style.setProperty(`--form-primary-${i}`, `var(--color-${colorName}-${i})`);
        }
      } else {
        // Если цвет не найден в палитре, используем прямое значение
        root.style.setProperty('--form-primary-color', primaryColor);
        root.style.setProperty('--form-primary-color-hover', primaryColor);
        root.style.setProperty('--form-primary-color-light', `${primaryColor}10`);
        root.style.setProperty('--form-primary-color-dark', primaryColor);
      }
    }
    
    // Применяем тему формы
    if (formTheme) {
      root.setAttribute('data-form-theme', formTheme);
    }
    
    // Применяем макет
    if (layout) {
      root.setAttribute('data-form-layout', layout);
    }
    
    // Cleanup function
    return () => {
      // Удаляем CSS переменные при размонтировании
      root.style.removeProperty('--form-primary-color');
      root.style.removeProperty('--form-primary-color-hover');
      root.style.removeProperty('--form-primary-color-light');
      root.style.removeProperty('--form-primary-color-dark');
      
      // Удаляем переменные для оттенков
      for (let i = 50; i <= 950; i += i < 100 ? 50 : 100) {
        root.style.removeProperty(`--form-primary-${i}`);
      }
      
      root.removeAttribute('data-form-theme');
      root.removeAttribute('data-form-layout');
    };
  }, [themeSettings]);
  
  return {
    primaryColor: themeSettings?.primaryColor,
    formTheme: themeSettings?.formTheme,
    layout: themeSettings?.layout,
  };
} 