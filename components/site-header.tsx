"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePage, PageTitle } from "@/lib/page-context";

export function SiteHeader() {
  const { rightSideComponents } = usePage();
  
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6 lg:px-8">
      <div className="flex flex-1 items-center gap-2 px-3">
        <SidebarTrigger className="-ms-4" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <PageTitle />
      </div>
      <div className="flex gap-3 ml-auto">
        {rightSideComponents.length > 0 && rightSideComponents}
      </div>
    </header>
  );
} 