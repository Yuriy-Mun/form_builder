import type { Metadata } from "next"
import { SidebarInset } from "@/components/ui/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { AppSidebar } from "@/components/app-sidebar"
import { AuthProvider } from "@/components/admin/AuthProvider"
import { SupabaseSessionProvider } from "@/components/admin/SupabaseSessionProvider"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard for the application",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SupabaseSessionProvider>
      <AuthProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 50)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />

          <SidebarInset>
            <SiteHeader />

            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 px-4 md:px-6 lg:px-8">
                  {children}
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthProvider>
    </SupabaseSessionProvider>
  )
} 