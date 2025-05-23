import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { SupabaseSessionProvider } from "@/components/admin/SupabaseSessionProvider"
import { AuthProvider } from "@/components/admin/AuthProvider"

const geist = Geist({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Admin login page",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={geist.className}>
      <SupabaseSessionProvider>
        <AuthProvider>
          <div className="flex min-h-screen w-full items-center justify-center bg-background">
            {children}
          </div>
        </AuthProvider>
      </SupabaseSessionProvider>
    </div>
  )
} 