'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImportWordDialog } from '@/components/form-builder/import-word-dialog';
import { FormField } from '@/components/form-builder/form-field-editor';
import { createBrowserClient } from '@supabase/ssr';

interface Form {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  created_at: string;
  created_by?: string; // This maps to auth.users(id), updated from user_id
}

interface FormsClientProps {
  forms: Form[];
}

export default function FormsClient({ forms }: FormsClientProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const router = useRouter();

  // Initialize Supabase client component-side
  // Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are in your .env.local
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleImportSuccess = (fields: FormField[]) => {
    // Store fields in sessionStorage to avoid URL length limitations
    sessionStorage.setItem('importedFields', JSON.stringify(fields));
    // router.push('/admin/forms/import-word');
  };

  const handleCreateNewForm = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error fetching user:', userError);
        // Handle error (e.g., show a notification to the user)
        alert('Error fetching user data. Please try again.');
        return;
      }

      if (!user) {
        console.error('User not authenticated');
        // Handle case where user is not authenticated (e.g., redirect to login)
        alert('You must be logged in to create a form.');
        router.push('/admin/login'); // Or your login page
        return;
      }

      // Using 'created_by' instead of 'user_id' to match the database schema
      const { data: newForm, error: insertError } = await supabase
        .from('forms')
        .insert({
          title: 'Untitled',
          created_by: user.id, // Associate form with the current user using the correct column name
          description: null,
          active: true,
          // The other fields (created_at, updated_at) have database defaults
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating form with Supabase:', insertError);
        // Handle Supabase-specific errors
        alert(`Failed to create form: ${insertError.message}`);
        throw new Error(insertError.message);
      }

      if (!newForm) {
        console.error('No data returned after insert');
        alert('Failed to create form. Please try again.');
        throw new Error('Failed to create form, no data returned from Supabase.');
      }

      console.log('Form created successfully:', newForm);
      router.push(`/admin/forms/edit/${newForm.id}`);
    } catch (error) {
      console.error('Client-side error creating form:', error);
      // Display a generic error message or use a toast notification system
      alert('An error occurred. Please check console for details.');
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Forms Management</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsImportDialogOpen(true)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Import from Word
          </button>
          <button
            onClick={handleCreateNewForm}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Create New Form
          </button>
        </div>
      </div>

      <ImportWordDialog 
        open={isImportDialogOpen} 
        onClose={() => setIsImportDialogOpen(false)} 
        onImportSuccess={handleImportSuccess} 
      />

      {forms && forms.length > 0 ? (
        <div className="grid gap-6">
          {forms.map((form) => (
            <div key={form.id} className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{form.title}</h2>
                  <p className="text-muted-foreground mt-1">{form.description}</p>
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
                    <span>Created: {new Date(form.created_at).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span className={form.active ? 'text-green-500' : 'text-red-500'}>
                      {form.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`/admin/forms/edit/${form.id}`}
                    className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                  >
                    Edit
                  </a>
                  <a 
                    href={`/admin/forms/${form.id}/responses`}
                    className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                  >
                    Responses
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted rounded-lg">
          <h3 className="text-lg font-medium">No forms created yet</h3>
          <p className="text-muted-foreground mt-1">Create your first form to get started</p>
        </div>
      )}
    </div>
  );
} 