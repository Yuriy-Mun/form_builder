'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreVertical, Search, BarChart, Edit, Trash, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  form_id: string | null;
  forms: {
    title: string;
  } | null;
}

export default function DashboardList() {
  const [search, setSearch] = useState('');
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch dashboards with react-query
  const { data: dashboards = [], isLoading, refetch } = useQuery({
    queryKey: ['dashboards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboards')
        .select('*, forms:form_id(title)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Dashboard[];
    }
  });

  const filteredDashboards = dashboards.filter(
    dashboard => dashboard.name.toLowerCase().includes(search.toLowerCase()) || 
                (dashboard.description && dashboard.description.toLowerCase().includes(search.toLowerCase()))
  );

  async function deleteDashboard(id: string) {
    try {
      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Dashboard deleted');
      refetch(); // Refresh the data after deletion
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      toast.error('Failed to delete dashboard');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search dashboards..."
            className="w-full pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <BarChart className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">No dashboards found</h2>
          <p className="mb-8 mt-2 text-center text-sm text-muted-foreground max-w-sm">
            {search ? 'No dashboards match your search. Try different keywords.' : 'Create your first dashboard to visualize form data.'}
          </p>
          {!search && (
            <Link href="/admin/dashboards/add">
              <Button>Create Dashboard</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDashboards.map(dashboard => (
            <Card key={dashboard.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="line-clamp-1">{dashboard.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {dashboard.description || 'No description'}
                  </CardDescription>
                  {dashboard.forms && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Form: {dashboard.forms.title}
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/dashboards/${dashboard.id}`}>
                        <BarChart className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/dashboards/edit/${dashboard.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this dashboard?')) {
                          deleteDashboard(dashboard.id);
                        }
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="pb-3 pt-1">
                <Link href={`/admin/dashboards/${dashboard.id}`} className="block">
                  <div className="h-32 rounded border border-dashed bg-muted flex items-center justify-center">
                    <BarChart className="h-10 w-10 text-muted-foreground" />
                  </div>
                </Link>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(dashboard.updated_at), { addSuffix: true })}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 