'use client'

import { useState } from 'react'
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
import { useCreateUser, type CreateUserData } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useApi'
import { useToast } from '@/hooks/use-toast'

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const { createUser, loading } = useCreateUser()
  const { data: rolesData } = useRoles()
  const roles = rolesData?.roles || []
  const { toast } = useToast()
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    role_id: '',
    user_metadata: {}
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.role_id) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, заполните все обязательные поля',
        variant: 'destructive',
      })
      return
    }

    try {
      await createUser(formData)
      toast({
        title: 'Успех',
        description: 'Пользователь успешно создан',
      })
      onSuccess()
      onOpenChange(false)
      setFormData({
        email: '',
        password: '',
        role_id: '',
        user_metadata: {}
      })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать пользователя',
        variant: 'destructive',
      })
    }
  }

  const handleInputChange = (field: keyof CreateUserData, value: string) => {
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
          <DialogTitle>Создать пользователя</DialogTitle>
          <DialogDescription>
            Создайте нового пользователя системы. Пользователь получит письмо с подтверждением.
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
            <Label htmlFor="password">Пароль *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Минимум 6 символов"
              minLength={6}
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
                {roles.map((role) => (
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
              {loading ? 'Создание...' : 'Создать пользователя'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 