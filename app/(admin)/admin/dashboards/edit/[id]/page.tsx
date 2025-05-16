import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import EditDashboardClient from './edit-dashboard-client';

export const dynamic = 'force-dynamic';

export default function EditDashboardPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  if (!params.id) {
    return notFound();
  }
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/admin/dashboards/${params.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Dashboard</h1>
      </div>
      
      <Suspense fallback={<FormSkeleton />}>
        <EditDashboardClient dashboardId={params.id} />
      </Suspense>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="max-w-2xl space-y-8">
      <Skeleton className="h-10 w-full mb-2" />
      <Skeleton className="h-32 w-full mb-2" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
} 