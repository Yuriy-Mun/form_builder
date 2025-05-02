'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { FormFieldEditor, FormField } from '@/components/form-builder/form-field-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditFormFieldsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  // Load form data and fields
  useEffect(() => {
    async function loadFormAndFields() {
      setIsLoading(true);
      try {
        // Получить основные данные формы
        const { data: formData, error: formError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single();

        if (formError) {
          throw formError;
        }

        setFormName(formData.title);
        setFormDescription(formData.description || '');

        // Получить поля формы
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('form_fields')
          .select('*')
          .eq('form_id', formId)
          .order('position', { ascending: true });

        if (fieldsError) {
          throw fieldsError;
        }

        // Преобразуем данные полей из базы данных в нужный формат
        const formattedFields = fieldsData.map(field => ({
          id: field.id,
          type: field.type as 'text' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'date',
          label: field.label,
          required: field.required,
          options: field.options ? field.options : undefined,
          placeholder: field.placeholder || '',
          conditional_logic: field.conditional_logic ? field.conditional_logic : undefined
        }));

        setFields(formattedFields);
      } catch (error: any) {
        console.error('Error loading form or fields:', error);
        toast.error(error.message || 'Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    }

    if (formId) {
      loadFormAndFields();
    }
  }, [formId]);

  // Сохранить изменения полей
  const handleSaveFields = async (updatedFields: FormField[]) => {
    try {
      // Удалить все существующие поля и создать новые
      const { error: deleteError } = await supabase
        .from('form_fields')
        .delete()
        .eq('form_id', formId);

      if (deleteError) {
        throw deleteError;
      }

      // Создать новые поля
      if (updatedFields.length > 0) {
        const formattedFields = updatedFields.map((field, index) => ({
          form_id: formId,
          type: field.type,
          label: field.label,
          options: field.options || null,
          required: field.required,
          placeholder: field.placeholder || null,
          conditional_logic: field.conditional_logic || null,
          position: index,
          active: true
        }));

        const { error: insertError } = await supabase
          .from('form_fields')
          .insert(formattedFields);

        if (insertError) {
          throw insertError;
        }
      }

      toast.success('Fields updated successfully');
      router.push(`/admin/forms`);
    } catch (error: any) {
      console.error('Error updating fields:', error);
      toast.error(error.message || 'Failed to update fields');
    }
  };

  // Обновить только одно поле
  const handleUpdateSingleField = async (fieldId: string, updatedData: any) => {
    try {
      const { error } = await supabase
        .from('form_fields')
        .update(updatedData)
        .eq('id', fieldId);

      if (error) {
        throw error;
      }

      toast.success('Field updated successfully');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating field:', error);
      toast.error(error.message || 'Failed to update field');
    }
  };

  // Отдельная функция для быстрого исправления условной логики
  const fixConditionalLogic = async () => {
    try {
      // Находим поле с надписью "Сколько у Вас детей?"
      const childrenField = fields.find(f => f.label.includes("Сколько у Вас детей"));
      if (!childrenField) {
        toast.error('Поле "Сколько у Вас детей?" не найдено');
        return;
      }

      // Находим поле с надписью "Ваш пол"
      const genderField = fields.find(f => f.label.includes("Ваш пол"));
      if (!genderField) {
        toast.error('Поле "Ваш пол" не найдено');
        return;
      }

      // Новые данные с правильной условной логикой
      const updatedData = {
        conditional_logic: {
          dependsOn: genderField.id,
          condition: 'equals',
          value: 'Женский'
        }
      };

      const { error } = await supabase
        .from('form_fields')
        .update(updatedData)
        .eq('id', childrenField.id);

      if (error) {
        throw error;
      }

      toast.success('Условная логика успешно исправлена');

      // Обновляем локальное состояние
      setFields(fields.map(field => 
        field.id === childrenField.id 
        ? { ...field, conditional_logic: updatedData.conditional_logic }
        : field
      ));
    } catch (error: any) {
      console.error('Error fixing conditional logic:', error);
      toast.error(error.message || 'Failed to fix conditional logic');
    }
  };

  const handleCancel = () => {
    router.push(`/admin/forms`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-muted-foreground">Loading form fields...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Form Fields</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            Back to Forms
          </Button>
          <Button onClick={fixConditionalLogic}>
            Fix Conditional Logic
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{formName}</CardTitle>
          {formDescription && <p className="text-muted-foreground">{formDescription}</p>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To change field settings and conditional logic rules, click Edit on individual fields.
          </p>
        </CardContent>
      </Card>

      <FormFieldEditor
        initialFields={fields}
        onSave={handleSaveFields}
        onCancel={handleCancel}
        formName={formName}
        formDescription={formDescription}
      />
    </div>
  );
} 