'use client';

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function AdminLogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      toast.success("Logged out successfully")
      router.push('/admin/login')
    } catch (error: any) {
      console.error("Error logging out:", error.message)
      toast.error("Failed to log out")
    }
  }

  return (
    <Button 
      variant="ghost" 
      className="w-full flex items-center justify-start gap-2 px-3"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" />
      <span>Logout</span>
    </Button>
  )
} 