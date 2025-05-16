import { createClient } from '@supabase/supabase-js';
import PublicFormPageClient from './page.client';

// Серверный компонент для извлечения данных
export default async function PublicFormPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  
  try {
    const {id} = await params;
    // Создаем новый клиент Supabase на стороне сервера
    // Для серверных компонентов в Next.js 15 мы можем использовать простого клиента без cookies
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Запрашиваем данные формы
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single();

    if (formError) {
      throw new Error(formError.message);
    }

    // Проверка авторизации будет выполняться на стороне клиента, 
    // так как нам нужен доступ к сессии пользователя

    // Запрашиваем поля формы
    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', id)
      .eq('active', true)
      .order('position', { ascending: true });

    if (fieldsError) {
      throw new Error(fieldsError.message);
    }

    // Передаем данные клиентскому компоненту
    return (
      <PublicFormPageClient 
        initialFormData={{ form, fields: fields || [] }} 
        initialError={null}
      />
    );
  } catch (error: any) {
    console.error('Error loading form:', error);
    return (
      <PublicFormPageClient 
        initialFormData={null} 
        initialError={error.message || 'Не удалось загрузить форму'}
      />
    );
  }
} 