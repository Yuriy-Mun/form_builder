import { createServerComponentClient } from '@/lib/supabase/server';
import FormsClient from './forms-client';

export const dynamic = 'force-dynamic';

export default async function FormsPage() {
  const supabase = await createServerComponentClient();
  
  // Fetch forms from the database
  const { data: forms, error } = await supabase
    .from('forms')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching forms:', error);
    return <FormsClient forms={[]} />;
  }

  return <FormsClient forms={forms || []} />;
} 