'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { BarChart, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function FormDashboards({ formId }: { formId: string }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Fetch dashboards for this form
  const { data: dashboards = [], isLoading } = useQuery({
    queryKey: ['form-dashboards', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('form_id', formId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Dashboard[];
    },
    enabled: !!formId
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Dashboards</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboards</h2>
        <Button asChild size="sm">
          <Link href={`/admin/dashboards/add?form_id=${formId}`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Dashboard
          </Link>
        </Button>
      </div>
      
      {dashboards.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BarChart className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No dashboards yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a dashboard to visualize the data from this form
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href={`/admin/dashboards/add?form_id=${formId}`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Dashboard
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboards.map(dashboard => (
            <Link 
              key={dashboard.id} 
              href={`/admin/dashboards/${dashboard.id}`}
              className="block"
            >
              <Card className="transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                  {dashboard.description && (
                    <CardDescription className="line-clamp-2">
                      {dashboard.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {new Date(dashboard.updated_at).toLocaleDateString()}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 