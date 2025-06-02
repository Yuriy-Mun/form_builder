import { notFound } from 'next/navigation';
import DashboardClient from './dashboard-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


export default async function DashboardPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Pass the ID to the client component
  const { id } = await params;
  if (!id) {
    return notFound();
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient dashboardId={id} />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-[300px] w-full" />
        ))}
      </div>
    </div>
  );
} 