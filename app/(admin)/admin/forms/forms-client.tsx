'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImportWordDialog } from '@/components/form-builder/import-word-dialog';
import { FormField } from '@/components/form-builder/form-field-editor';
import { createBrowserClient } from '@supabase/ssr';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  Loader2,
  Share2,
  Copy,
  Mail,
  MessageCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
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
  const [openSharePopover, setOpenSharePopover] = useState<string | null>(null);
  const [openShareDrawer, setOpenShareDrawer] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
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

  // Определение мобильного устройства
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

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

  const handleCopyLink = async (formId: string) => {
    const publicUrl = `${window.location.origin}/forms/${formId}`;
    
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Ссылка скопирована в буфер обмена!', {
        description: 'Теперь вы можете поделиться этой формой'
      });
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = publicUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        toast.success('Ссылка скопирована в буфер обмена!', {
          description: 'Теперь вы можете поделиться этой формой'
        });
      } catch (fallbackErr) {
        toast.error('Не удалось скопировать ссылку', {
          description: 'Попробуйте скопировать ссылку вручную'
        });
      }
    }
  };

  const handleOpenPublicLink = (formId: string) => {
    const publicUrl = `${window.location.origin}/forms/${formId}`;
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareViaEmail = (formId: string, formTitle: string) => {
    const publicUrl = `${window.location.origin}/forms/${formId}`;
    const subject = encodeURIComponent(`Заполните форму: ${formTitle}`);
    const body = encodeURIComponent(`Пожалуйста, заполните эту форму: ${publicUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  const handleShareViaTelegram = (formId: string, formTitle: string) => {
    const publicUrl = `${window.location.origin}/forms/${formId}`;
    const text = encodeURIComponent(`Заполните форму "${formTitle}": ${publicUrl}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${text}`, '_blank');
  };

  const handleShareViaWhatsApp = (formId: string, formTitle: string) => {
    const publicUrl = `${window.location.origin}/forms/${formId}`;
    const text = encodeURIComponent(`Заполните форму "${formTitle}": ${publicUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Filter forms based on search term
  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Компонент содержимого для поделиться
  const ShareContent = ({ form, onClose }: { form: Form; onClose: () => void }) => (
    <div className="relative">
      {/* Декоративный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative p-6">
        {/* Заголовок */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-3 shadow-lg">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Поделиться формой</h3>
          <p className="text-sm text-gray-500 truncate max-w-64">"{form.title}"</p>
        </div>
        
        {/* Сетка действий */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Копировать ссылку */}
          <button
            onClick={() => {
              handleCopyLink(form.id);
              onClose();
            }}
            className="group relative p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 hover:bg-white hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Copy className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Копировать</div>
                <div className="text-xs text-gray-500">Ссылку</div>
              </div>
            </div>
          </button>
          
          {/* Открыть форму */}
          <button
            onClick={() => {
              handleOpenPublicLink(form.id);
              onClose();
            }}
            className="group relative p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 hover:bg-white hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ExternalLink className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Открыть</div>
                <div className="text-xs text-gray-500">Форму</div>
              </div>
            </div>
          </button>
          
          {/* Email */}
          <button
            onClick={() => {
              handleShareViaEmail(form.id, form.title);
              onClose();
            }}
            className="group relative p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 hover:bg-white hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Email</div>
                <div className="text-xs text-gray-500">Почта</div>
              </div>
            </div>
          </button>
          
          {/* Telegram */}
          <button
            onClick={() => {
              handleShareViaTelegram(form.id, form.title);
              onClose();
            }}
            className="group relative p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 hover:bg-white hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Telegram</div>
                <div className="text-xs text-gray-500">Мессенджер</div>
              </div>
            </div>
          </button>
        </div>
        
        {/* WhatsApp - отдельно, на всю ширину */}
        <button
          onClick={() => {
            handleShareViaWhatsApp(form.id, form.title);
            onClose();
          }}
          className="group w-full p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div className="text-white">
              <div className="text-sm font-semibold">Поделиться в WhatsApp</div>
              <div className="text-xs opacity-90">Быстрая отправка</div>
            </div>
          </div>
        </button>
        
        {/* Декоративные элементы */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
        <div className="absolute top-8 right-8 w-1 h-1 bg-purple-400 rounded-full opacity-40"></div>
        <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-50"></div>
      </div>
    </div>
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
                        {isMobile ? (
                          <Drawer 
                            open={openShareDrawer === form.id} 
                            onOpenChange={(open) => setOpenShareDrawer(open ? form.id : null)}
                          >
                            <DrawerTrigger asChild>
                              <button className={`
                                relative flex justify-center p-3 rounded-2xl transition-all duration-300 transform hover:scale-110 group overflow-hidden
                                ${openShareDrawer === form.id 
                                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-blue-500/30' 
                                  : 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:shadow-lg hover:shadow-blue-400/25'
                                }
                              `}>
                                {/* Декоративные элементы */}
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute top-1 right-1 w-1 h-1 bg-white/60 rounded-full"></div>
                                <div className="absolute bottom-1 left-1 w-0.5 h-0.5 bg-white/40 rounded-full"></div>
                                
                                <Share2 className="h-4 w-4 text-white relative z-10 group-hover:rotate-12 transition-transform" />
                              </button>
                            </DrawerTrigger>
                            <DrawerContent className="bg-gradient-to-br from-slate-50 to-blue-50">
                              <DrawerHeader className="text-center pb-2">
                                <DrawerTitle className="sr-only">Поделиться формой</DrawerTitle>
                                <DrawerDescription className="sr-only">Выберите способ поделиться формой</DrawerDescription>
                              </DrawerHeader>
                              <ShareContent form={form} onClose={() => setOpenShareDrawer(null)} />
                            </DrawerContent>
                          </Drawer>
                        ) : (
                          <Popover 
                            open={openSharePopover === form.id} 
                            onOpenChange={(open) => setOpenSharePopover(open ? form.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <button className={`
                                relative flex justify-center p-3 rounded-2xl transition-all duration-300 transform hover:scale-110 group overflow-hidden
                                ${openSharePopover === form.id 
                                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-blue-500/30' 
                                  : 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:shadow-lg hover:shadow-blue-400/25'
                                }
                              `}>
                                {/* Декоративные элементы */}
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute top-1 right-1 w-1 h-1 bg-white/60 rounded-full"></div>
                                <div className="absolute bottom-1 left-1 w-0.5 h-0.5 bg-white/40 rounded-full"></div>
                                
                                <Share2 className="h-4 w-4 text-white relative z-10 group-hover:rotate-12 transition-transform" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 border-0 shadow-2xl bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl overflow-hidden">
                              <ShareContent form={form} onClose={() => setOpenSharePopover(null)} />
                            </PopoverContent>
                          </Popover>
                        )}
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Поделиться</p>
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