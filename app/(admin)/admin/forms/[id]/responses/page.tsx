import { createServerComponentClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ResponsesClient from './responses-client';

export const dynamic = 'force-dynamic';

export default async function FormResponsesPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const supabase = await createServerComponentClient();
  const { id } = await params;

  // Fetch only the form to check if it exists and get basic details
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (formError || !form) {
    console.error('Error fetching form:', formError);
    return notFound();
  }

  return <ResponsesClient formId={id} form={form} />;
} 