import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getCachedForm } from '@/lib/cache';
import { notFound } from 'next/navigation';
import ResponsesClient from './responses-client';
import { Suspense } from 'react';
import { ResponsiveFormResponsesSkeleton } from '@/components/ui/form-responses-skeleton';
import SuspendedFormResponsesComponent from './suspended';
import { unstable_noStore as noStore } from 'next/cache';

export default async function FormResponsesPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Opt out of static rendering to ensure cookies are available
  noStore();
  return (
    <Suspense fallback={<ResponsiveFormResponsesSkeleton />}>
      <SuspendedFormResponsesComponent params={params} />
    </Suspense>
  );
}