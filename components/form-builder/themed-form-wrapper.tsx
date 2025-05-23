"use client";

import { ReactNode } from 'react';
import { useFormTheme } from '@/hooks/use-form-theme';
import { FloatingParticles } from './floating-particles';
import { cn } from '@/lib/utils';

interface ThemeSettings {
  primaryColor: string;
  formTheme: string;
  layout: string;
}

interface ThemedFormWrapperProps {
  children: ReactNode;
  themeSettings?: ThemeSettings;
  className?: string;
}

export function ThemedFormWrapper({ 
  children, 
  themeSettings, 
  className 
}: ThemedFormWrapperProps) {
  // Применяем тему
  const { formTheme, layout } = useFormTheme({ themeSettings });
  
  // Определяем классы на основе темы
  const getThemeClasses = () => {
    const baseClasses = "min-h-screen transition-all duration-500 relative";
    
    switch (formTheme) {
      case 'modern':
        return cn(
          baseClasses,
          // Добавляем декоративные элементы
          "before:absolute before:inset-0 before:pointer-events-none",
          "after:absolute after:inset-0 after:pointer-events-none"
        );
      case 'classic':
        return cn(
          baseClasses,
          "before:absolute before:inset-0 before:pointer-events-none"
        );
      case 'gradient':
        return cn(
          baseClasses,
          "before:absolute before:inset-0 before:pointer-events-none",
          "after:absolute after:inset-0 after:pointer-events-none"
        );
      default:
        return cn(
          baseClasses,
          "before:absolute before:inset-0 before:pointer-events-none"
        );
    }
  };
  
  // Определяем классы контейнера на основе макета
  const getLayoutClasses = () => {
    const baseClasses = "mx-auto px-4 py-12 relative z-10";
    
    switch (layout) {
      case 'two-column':
        return cn(baseClasses, "max-w-5xl");
      case 'compact':
        return cn(baseClasses, "max-w-lg");
      default:
        return cn(baseClasses, "max-w-3xl");
    }
  };
  
  return (
    <div 
      className={cn(getThemeClasses(), className)}
      data-form-theme={formTheme}
      data-form-layout={layout}
    >
      {/* Плавающие частицы для дополнительного визуального эффекта */}
      <FloatingParticles 
        count={15} 
        color={themeSettings?.primaryColor ? `${themeSettings.primaryColor}20` : 'rgba(99, 102, 241, 0.1)'} 
      />
      
      <div className={getLayoutClasses()}>
        {children}
      </div>
    </div>
  );
} 