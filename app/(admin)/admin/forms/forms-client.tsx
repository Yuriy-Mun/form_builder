'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImportWordDialog } from '@/components/form-builder/import-word-dialog';
import { FormField } from '@/components/form-builder/form-field-editor';
import { createBrowserClient } from '@supabase/ssr';
import { useQuery } from '@tanstack/react-query';
import {
  Edit,
  MessageSquare,
  ExternalLink,
  BarChart3,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  FileText,
  Search,
  Loader2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from 'next/link';

interface Form {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  created_at: string;
  created_by?: string; // This maps to auth.users(id), updated from user_id
}

export default function FormsClient() {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // Initialize Supabase client component-side
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch forms using React Query
  const { data: forms = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    }
  });

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
      // Refresh the forms list before navigating
      await refetch();
      router.push(`/admin/forms/edit/${newForm.id}`);
    } catch (error) {
      console.error('Client-side error creating form:', error);
      // Display a generic error message or use a toast notification system
      alert('An error occurred. Please check console for details.');
    }
  };

  // Filter forms based on search term
  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsImportDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-md border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Import from Word</span>
            </button>
            <button
              onClick={handleCreateNewForm}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create Form</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ImportWordDialog 
        open={isImportDialogOpen} 
        onClose={() => setIsImportDialogOpen(false)} 
        onImportSuccess={handleImportSuccess} 
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Loading forms...</span>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mt-8">
          <p>Error loading forms: {error?.message || 'An unknown error occurred'}</p>
        </div>
      ) : filteredForms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {filteredForms.map((form) => (
            <div 
              key={form.id} 
              className="group bg-white text-gray-800 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex-1 space-y-3">
                  
                  <div className="flex items-center text-xs text-gray-500 gap-3">
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      <span>{new Date(form.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className={`flex items-center ${form.active ? 'text-emerald-600' : 'text-red-500'}`}>
                      {form.active ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                      {form.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-balance line-clamp-2">{form.title}</h2>
                  
                  {form.description && (
                    <p className="text-gray-500 text-sm line-clamp-2">{form.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-gray-100">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link 
                          href={`/admin/forms/edit/${form.id}`}
                          className="flex justify-center p-2 rounded hover:bg-gray-100 transition-colors"
                        >
                          <Edit className="h-4 w-4 text-gray-700" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Edit form</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link 
                          href={`/admin/forms/${form.id}/responses`}
                          className="flex justify-center p-2 rounded hover:bg-gray-100 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4 text-gray-700" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>View responses</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link 
                          href={`/admin/dashboards/${form.id}`}
                          className="flex justify-center p-2 rounded hover:bg-gray-100 transition-colors"
                        >
                          <BarChart3 className="h-4 w-4 text-gray-700" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>View dashboard</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link 
                          href={`/forms/${form.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex justify-center p-2 rounded hover:bg-gray-100 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 text-blue-600" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Open public link</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 mt-8 bg-white rounded-xl border border-gray-200 shadow-sm">
          {searchTerm ? (
            <>
              <Search className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No forms match your search</h3>
              <p className="text-gray-500 text-center">Try different keywords or clear your search</p>
              <button 
                onClick={() => setSearchTerm('')} 
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No forms created yet</h3>
              <p className="text-gray-500 text-center">Create your first form to get started</p>
              <button 
                onClick={handleCreateNewForm} 
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Form
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
} 