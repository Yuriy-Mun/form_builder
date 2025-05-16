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
import { Badge } from "@/components/ui/badge"
import type { Role } from "@/lib/types"

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const supabase = getSupabaseClient()
  
  useEffect(() => {
    fetchRoles()
  }, [])
  
  const fetchRoles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name')
      
      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error('Ошибка при получении ролей:', error)
      toast.error('Не удалось загрузить роли')
    } finally {
      setLoading(false)
    }
  }
  
  const handleEdit = (id: string) => {
    router.push(`/admin/roles/edit/${id}`)
  }
  
  const handleDelete = (id: string) => {
    setDeleteId(id)
    setDeleteDialogOpen(true)
  }
  
  const confirmDelete = async () => {
    if (!deleteId) return
    
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', deleteId)
      
      if (error) throw error
      
      toast.success('Роль успешно удалена')
      fetchRoles()
    } catch (error: any) {
      console.error('Ошибка при удалении роли:', error)
      toast.error(error.message || 'Не удалось удалить роль')
    } finally {
      setDeleteId(null)
      setDeleteDialogOpen(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Роли</h1>
          <p className="text-muted-foreground mt-2">
            Управление ролями пользователей и их разрешениями
          </p>
        </div>
        <Button 
          className="flex items-center gap-1" 
          onClick={() => router.push('/admin/roles/add')}
        >
          <Plus className="h-4 w-4" /> Добавить роль
        </Button>
      </div>
      <div className="border-t"></div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Код</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead>Дата обновления</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Загрузка ролей...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Роли не найдены. Добавьте первую роль.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-1 py-0.5 rounded text-sm">
                      {role.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    {role.active ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                        Активна
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200">
                        Неактивна
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(role.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(role.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(role.id)}
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
              Это действие нельзя будет отменить. Удаление роли может повлиять на работу системы, 
              если она используется пользователями или другими частями приложения.
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
  )
} 