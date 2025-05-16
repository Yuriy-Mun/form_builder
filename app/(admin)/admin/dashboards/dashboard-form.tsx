'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';

interface Form {
  id: string;
  title: string;
}

interface DashboardData {
  id?: string;
  name: string;
  description: string | null;
  form_id: string | null;
}

const dashboardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable(),
  form_id: z.string().min(1, 'Form is required'),
});

export default function DashboardForm({ 
  dashboard
}: { 
  dashboard?: DashboardData;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const formIdParam = searchParams.get('form_id');
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Fetch forms data
  const { data: forms = [], isLoading: isFormsLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('id, title')
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data as Form[];
    }
  });
  
  const form = useForm<z.infer<typeof dashboardSchema>>({
    resolver: zodResolver(dashboardSchema),
    defaultValues: {
      name: dashboard?.name || '',
      description: dashboard?.description || '',
      form_id: dashboard?.form_id || formIdParam || '',
    },
  });
  
  async function onSubmit(data: z.infer<typeof dashboardSchema>) {
    setIsSubmitting(true);
    
    try {
      if (dashboard?.id) {
        // Update existing dashboard
        const { error } = await supabase
          .from('dashboards')
          .update({
            name: data.name,
            description: data.description,
            form_id: data.form_id,
          })
          .eq('id', dashboard.id);
          
        if (error) throw error;
        
        toast.success('Dashboard updated');
        router.push(`/admin/dashboards/${dashboard.id}`);
      } else {
        // Create new dashboard
        const { data: newDashboard, error } = await supabase
          .from('dashboards')
          .insert({
            name: data.name,
            description: data.description,
            form_id: data.form_id,
          })
          .select()
          .single();
          
        if (error) throw error;
        
        toast.success('Dashboard created');
        router.push(`/admin/dashboards/${newDashboard.id}`);
      }
    } catch (error) {
      console.error('Error saving dashboard:', error);
      toast.error('Failed to save dashboard');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Monthly sales" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for your dashboard
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Dashboard for tracking monthly sales data from form submissions" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Optional description to explain the purpose of this dashboard
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="form_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Form</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isFormsLoading}
                  {...field}
                >
                  <option value="" disabled>Select a form</option>
                  {forms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.title}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormDescription>
                Select the form to visualize data from
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting || isFormsLoading}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {dashboard?.id ? 'Update Dashboard' : 'Create Dashboard'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/admin/dashboards')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
} 