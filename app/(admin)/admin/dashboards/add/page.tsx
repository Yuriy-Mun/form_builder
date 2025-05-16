import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardForm from '../dashboard-form';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default function AddDashboardPage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/dashboards">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Dashboard</h1>
      </div>
      
      <Suspense fallback={<FormSkeleton />}>
        <DashboardForm />
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