'use client'

import { useState, useEffect } from 'react'
import { Shield, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type User } from '@/hooks/useUsers'
import { useToast } from '@/hooks/use-toast'

interface UserPermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

export function UserPermissionsDialog({ open, onOpenChange, user }: UserPermissionsDialogProps) {
  const { toast } = useToast()
  const [permissions, setPermissions] = useState<any[]>([])

  // Получаем разрешения пользователя из его роли
  useEffect(() => {
    if (user?.roles?.roles_permissions) {
      const userPermissions = user.roles.roles_permissions.map(rp => rp.permissions)
      setPermissions(userPermissions)
    }
  }, [user])

  const getPermissionsByCategory = () => {
    const categories: { [key: string]: any[] } = {}
    
    permissions.forEach(permission => {
      const category = permission.slug.split('.')[0] || 'general'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(permission)
    })
    
    return categories
  }

  const getCategoryName = (category: string) => {
    const categoryNames: { [key: string]: string } = {
      forms: 'Формы',
      users: 'Пользователи',
      roles: 'Роли',
      permissions: 'Разрешения',
      dashboards: 'Дашборды',
      general: 'Общие'
    }
    return categoryNames[category] || category
  }

  const categorizedPermissions = getPermissionsByCategory()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Разрешения пользователя
          </DialogTitle>
          <DialogDescription>
            Просмотр разрешений пользователя {user.email} через роль "{user.roles.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Информация о пользователе */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Информация о пользователе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Роль:</span>
                <Badge variant="outline">{user.roles.name}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Статус роли:</span>
                <Badge variant={user.roles.active ? "default" : "secondary"}>
                  {user.roles.active ? "Активна" : "Неактивна"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Разрешения по категориям */}
          {Object.keys(categorizedPermissions).length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Разрешения ({permissions.length})</h3>
              {Object.entries(categorizedPermissions).map(([category, categoryPermissions]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{getCategoryName(category)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {categoryPermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                        >
                          <div>
                            <div className="font-medium text-sm">{permission.name}</div>
                            <div className="text-xs text-muted-foreground">{permission.slug}</div>
                          </div>
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <X className="h-8 w-8 mx-auto mb-2" />
                  <p>У пользователя нет разрешений</p>
                  <p className="text-sm">Разрешения назначаются через роли</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Примечание */}
          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
            <strong>Примечание:</strong> Разрешения назначаются пользователям через роли. 
            Для изменения разрешений пользователя измените его роль или настройте разрешения роли.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 