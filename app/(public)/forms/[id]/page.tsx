import { Suspense } from 'react';
import PublicFormPageClient from './page.client';
import { getCachedPublicForm } from '@/lib/cache'
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';

// Серверный компонент для извлечения данных
export default async function PublicFormPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  return <Suspense fallback={<FormPageSkeleton />}><SuspendedFormPage params={params} /></Suspense>
}

async function SuspendedFormPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Используем нашу централизованную кэшированную функцию
    const { form, fields } = await getCachedPublicForm(id);

    // Передаем данные клиентскому компоненту
    return (
      <PublicFormPageClient 
        initialFormData={{ form, fields }} 
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