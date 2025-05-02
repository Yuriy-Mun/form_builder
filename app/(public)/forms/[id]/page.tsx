import { createServerComponentClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Database } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

interface FormsPageProps {
  params: {
    id: string;
  };
}

type FormField = Database['public']['Tables']['form_fields']['Row'];

export default async function PublicFormPage({ params }: FormsPageProps) {
  const { id } = params;
  const supabase = createServerComponentClient();
  
  // Fetch the form and its fields
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single();

  if (formError || !form) {
    notFound();
  }

  const { data: fields, error: fieldsError } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_id', id)
    .eq('active', true)
    .order('position', { ascending: true });

  if (fieldsError) {
    console.error('Error fetching form fields:', fieldsError);
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
        <p className="text-muted-foreground mb-8">{form.description}</p>
        
        {/* Form content placeholder - will be implemented in Phase 3 */}
        <div className="bg-muted p-6 rounded-md text-center">
          <p className="mb-4">This form is available for viewing.</p>
          <p className="text-muted-foreground">The form submission functionality will be implemented in Phase 3.</p>
        </div>
        
        {/* Display basic field information for preview */}
        {fields && fields.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Form Fields Preview</h2>
            <div className="space-y-4">
              {fields.map((field: FormField) => (
                <div key={field.id} className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium">{field.label} {field.required && <span className="text-red-500">*</span>}</h3>
                  <p className="text-sm text-muted-foreground">Type: {field.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 