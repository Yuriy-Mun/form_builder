'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImportWordDialog } from '@/components/form-builder/import-word-dialog';
import { FormField } from '@/components/form-builder/form-field-editor';

interface Form {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

interface FormsClientProps {
  forms: Form[];
}

export default function FormsClient({ forms }: FormsClientProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const router = useRouter();

  const handleImportSuccess = (fields: FormField[]) => {
    // Store fields in sessionStorage to avoid URL length limitations
    sessionStorage.setItem('importedFields', JSON.stringify(fields));
    // Navigate to the import page
    router.push('/admin/forms/import-word');
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
          <a 
            href="/admin/forms/add" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Create New Form
          </a>
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