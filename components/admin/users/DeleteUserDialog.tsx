'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useDeleteUser, type User } from '@/hooks/useUsers'
import { useToast } from '@/hooks/use-toast'

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onSuccess?: () => void
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: DeleteUserDialogProps) {
  const { deleteUser, loading } = useDeleteUser()
  const { toast } = useToast()
  const [confirmText, setConfirmText] = useState('')

  const handleDelete = async () => {
    try {
      await deleteUser(user.id)
      toast({
        title: 'Пользователь удален',
        description: `Пользователь ${user.email} был успешно удален из системы.`,
      })
      onOpenChange(false)
      onSuccess?.()
      setConfirmText('')
    } catch (error) {
      toast({
        title: 'Ошибка удаления',
        description: error instanceof Error ? error.message : 'Не удалось удалить пользователя',
        variant: 'destructive',
      })
    }
  }

  const isConfirmValid = confirmText === user.email

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Удаление пользователя
          </DialogTitle>
          <DialogDescription>
            Это действие нельзя отменить. Пользователь будет полностью удален из системы.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Внимание!</strong> Удаление пользователя приведет к:
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                <li>Полному удалению учетной записи</li>
                <li>Потере всех данных пользователя</li>
                <li>Невозможности восстановления</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm font-medium">Email пользователя:</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              {user.user_metadata?.full_name && (
                <>
                  <div className="text-sm font-medium mt-2">Полное имя:</div>
                  <div className="text-sm text-muted-foreground">{user.user_metadata.full_name}</div>
                </>
              )}
              <div className="text-sm font-medium mt-2">Роль:</div>
              <div className="text-sm text-muted-foreground">{user.roles.name}</div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-email" className="text-sm font-medium">
              Для подтверждения введите email пользователя:
            </label>
            <input
              id="confirm-email"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={user.email}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setConfirmText('')
            }}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || !isConfirmValid}
          >
            {loading ? 'Удаление...' : 'Удалить пользователя'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 