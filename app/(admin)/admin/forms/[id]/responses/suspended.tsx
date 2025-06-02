import { getCachedForm } from "@/lib/cache";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import ResponsesClient from "./responses-client";
import { notFound } from "next/navigation";

export default async function FormResponsesComponent({ 
    params 
  }: { 
    params: Promise<{ id: string }> 
  }) {
    
    try {
      const user = await getAuthenticatedUser();
      const { id } = await params;
  
      // Use our cached form function
      const form = await getCachedForm(id, user.id);
  
      return <ResponsesClient formId={id} form={form} />;
    } catch (error) {
      console.error('Error fetching form:', error);
      return notFound();
    }
  }