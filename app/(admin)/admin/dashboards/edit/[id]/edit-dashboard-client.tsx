'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import DashboardForm from '../../dashboard-form';

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  form_id: string;
}

export default function EditDashboardClient({ dashboardId }: { dashboardId: string }) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch dashboard data
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['dashboard', dashboardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('id', dashboardId)
        .single();
      
      if (error) throw error;
      return data as Dashboard;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !dashboard) {
    toast.error('Failed to load dashboard');
    router.push('/admin/dashboards');
    return null;
  }

  return <DashboardForm dashboard={dashboard} />;
} 