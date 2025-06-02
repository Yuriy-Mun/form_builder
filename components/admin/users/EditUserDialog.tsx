'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateUser, type User, type UpdateUserData } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useApi'
import { useToast } from '@/hooks/use-toast'

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onSuccess: () => void
}

export function EditUserDialog({ open, onOpenChange, user, onSuccess }: EditUserDialogProps) {
  const { updateUser, loading } = useUpdateUser()
  const { data: rolesData } = useRoles()
  const roles = rolesData?.roles || []
  const { toast } = useToast()
  const [formData, setFormData] = useState<UpdateUserData>({
    email: '',
    role_id: '',
    user_metadata: {}
  })

  // Заполняем форму данными пользователя при открытии
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        role_id: user.roles.id,
        user_metadata: user.user_metadata || {}
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.role_id) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, заполните все обязательные поля',
        variant: 'destructive',
      })
      return
    }

    try {
      await updateUser(user.id, formData)
      toast({
        title: 'Успех',
        description: 'Пользователь успешно обновлен',
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось обновить пользователя',
        variant: 'destructive',
      })
    }
  }

  const handleInputChange = (field: keyof UpdateUserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMetadataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      user_metadata: {
        ...prev.user_metadata,
        [field]: value
      }
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактировать пользователя</DialogTitle>
          <DialogDescription>
            Измените данные пользователя. Изменения будут применены немедленно.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Роль *</Label>
            <Select
              value={formData.role_id}
              onValueChange={(value) => handleInputChange('role_id', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role: any) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Полное имя</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.user_metadata?.full_name || ''}
              onChange={(e) => handleMetadataChange('full_name', e.target.value)}
              placeholder="Иван Иванов"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.user_metadata?.phone || ''}
              onChange={(e) => handleMetadataChange('phone', e.target.value)}
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 