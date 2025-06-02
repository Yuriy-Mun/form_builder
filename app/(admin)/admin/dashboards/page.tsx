import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import DashboardList from './dashboard-list';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


export default function DashboardsPage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-muted-foreground">
            Create and manage dashboards from your form submissions
          </p>
        </div>
        <Link href="/admin/dashboards/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Dashboard
          </Button>
        </Link>
      </div>
      
      <Suspense fallback={<DashboardsSkeleton />}>
        <DashboardList />
      </Suspense>
    </div>
  );
}

function DashboardsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full" />
        ))}
      </div>
    </div>
  );
} 