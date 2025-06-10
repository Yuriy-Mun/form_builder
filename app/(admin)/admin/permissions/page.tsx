'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Permission } from "@/lib/types"
import { SetPageTitle, UseHeaderComponent } from "@/lib/page-context"

export default function PermissionsPage() {
  const router = useRouter()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchPermissions()
  }, [])
  
  const fetchPermissions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('name')
      
      if (error) throw error
      setPermissions(data || [])
    } catch (error) {
      console.error('Ошибка при получении разрешений:', error)
      toast.error('Не удалось загрузить разрешения')
    } finally {
      setLoading(false)
    }
  }
  
  const handleEdit = (id: string) => {
    router.push(`/admin/permissions/edit/${id}`)
  }
  
  const handleDelete = (id: string) => {
    setDeleteId(id)
    setDeleteDialogOpen(true)
  }
  
  const confirmDelete = async () => {
    if (!deleteId) return
    
    try {
      const { error } = await supabase
        .from('permissions')
        .delete()
        .eq('id', deleteId)
      
      if (error) throw error
      
      toast.success('Разрешение успешно удалено')
      fetchPermissions()
    } catch (error: any) {
      console.error('Ошибка при удалении разрешения:', error)
      toast.error(error.message || 'Не удалось удалить разрешение')
    } finally {
      setDeleteId(null)
      setDeleteDialogOpen(false)
    }
  }
  
  return (
    <>
    <SetPageTitle title="Permissions" description="Manage system permissions" />
    <UseHeaderComponent id="add-permission-button">
      <Button 
        className="flex items-center gap-1" 
        onClick={() => router.push('/admin/permissions/add')}
      >
        <Plus className="h-4 w-4" /> Добавить разрешение
      </Button>
    </UseHeaderComponent>
    <div className="space-y-6">
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead>Дата обновления</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  Загрузка разрешений...
                </TableCell>
              </TableRow>
            ) : permissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Разрешения не найдены. Добавьте первое разрешение.
                </TableCell>
              </TableRow>
            ) : (
              permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>{permission.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-1 py-0.5 rounded text-sm">
                      {permission.slug}
                    </code>
                  </TableCell>
                  <TableCell>{new Date(permission.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(permission.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(permission.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(permission.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя будет отменить. Удаление разрешения может повлиять на работу системы, 
              если оно используется в ролях или других частях приложения.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  )
} 