import DashboardForm from '../dashboard-form';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SetPageTitle } from '@/lib/page-context';

export default function AddDashboardPage() {
  return (
    <>
      <SetPageTitle title="Create Dashboard" description="Create a new dashboard from your form submissions" />
      <div className="container py-6 space-y-6">

        <Suspense fallback={<FormSkeleton />}>
          <DashboardForm />
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