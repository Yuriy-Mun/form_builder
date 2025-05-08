'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LayoutTemplate, Wand2, Settings2, Code } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Импорт хранилищ и утилит
import { loadFormWithFields, isFormDataLoaded, getFormErrors } from '@/lib/store/form-utils';
import { useFormMetaStore } from '@/lib/store/form-meta-store';
import { useFormFieldsStore } from '@/lib/store/form-fields-store';
import { useFormUIStore } from '@/lib/store/form-ui-store';

// Component imports
import { FormHeader } from '@/components/form-builder/form-header';
import { FieldTypeSidebar } from '@/components/form-builder/field-type-sidebar';
import { FormCanvas } from '@/components/form-builder/form-canvas';
import { FormPropertiesPanel } from '@/components/form-builder/form-properties-panel';
import { ThemeTab } from '@/components/form-builder/theme-tab';
import { SettingsTab } from '@/components/form-builder/settings-tab';
import { CodeTab } from '@/components/form-builder/code-tab';
import { DevicePreview } from '@/components/form-builder/device-preview';

export default function EditFormPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;
  
  // Локальное состояние для UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formLoaded, setFormLoaded] = useState(false);
  
  // Загружаем данные формы при монтировании
  useEffect(() => {
    if (formId) {
      const loadData = async () => {
        try {
          await loadFormWithFields(formId);
          setFormLoaded(true);
        } catch (err) {
          console.error('Failed to load form:', err);
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }
  }, [formId]);
  
  // Подписываемся на изменения состояния загрузки и ошибок
  useEffect(() => {
    // Подписываемся на изменения в хранилищах
    const unsubscribeMeta = useFormMetaStore.subscribe(
      (state) => {
        setLoading(state.loading);
        if (state.error) setError(state.error);
      }
    );
    
    const unsubscribeFields = useFormFieldsStore.subscribe(
      (state) => {
        // Обновляем loading, только если он изменился на true
        if (state.loading) setLoading(true);
        if (state.error) setError(state.error);
      }
    );
    
    // Получаем текущее состояние
    const isLoaded = isFormDataLoaded();
    setFormLoaded(isLoaded);
    
    // Проверяем наличие ошибок
    const currentError = getFormErrors();
    if (currentError) setError(currentError);
    
    // Очищаем подписки при размонтировании
    return () => {
      unsubscribeMeta();
      unsubscribeFields();
    };
  }, []);

  // Отображаем состояние загрузки
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading form editor...</div>;
  }

  // Отображаем ошибку, если есть
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  }

  // Проверяем, что форма загружена
  if (!formLoaded) {
    return <div className="flex justify-center items-center h-screen">Form not found.</div>;
  }

  return (
    <div className="flex flex-col h-screen p-4 md:p-6 bg-background">
      {/* Header with form title and status */}
      <FormHeader />

      {/* Main Tabs Interface */}
      <Tabs defaultValue="editor" className="flex-grow flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="editor" className="gap-1.5">
              <LayoutTemplate className="h-4 w-4" />
              <span>Editor</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-1.5">
              <Wand2 className="h-4 w-4" />
              <span>Theme & Style</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings2 className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-1.5">
              <Code className="h-4 w-4" />
              <span>Code</span>
            </TabsTrigger>
          </TabsList>
          
          <DevicePreview />
        </div>

        {/* Form Editor Tab */}
        <TabsContent value="editor" className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* Left Sidebar: Field Types */}
          <FieldTypeSidebar />

          {/* Middle: Form Canvas */}
          <FormCanvas />

          {/* Right Sidebar: Properties Panel */}
          <FormPropertiesPanel />
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="flex-grow">
          <ThemeTab />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-grow">
          <SettingsTab />
        </TabsContent>

        {/* Code Tab */}
        <TabsContent value="code" className="flex-grow">
          <CodeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}