import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import EditDashboardClient from './edit-dashboard-client';
import { SetPageTitle } from '@/lib/page-context';


export default async function EditDashboardPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  if (!id) {
    return notFound();
  }
  
  return (
    <>
    <SetPageTitle title="Edit Dashboard" description="Edit a dashboard from your form submissions" />
    <div className="container py-6 space-y-6">
      <Suspense fallback={<FormSkeleton />}>
        <EditDashboardClient dashboardId={id} />
      </Suspense>
    </div>
    </>
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