'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import type { Permission, RoleFormData } from '@/lib/types'
import { SetPageTitle } from '@/lib/page-context'

export default function AddRolePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    code: '',
    active: true,
  })
  const supabase = getSupabaseClient()

  // Fetch all permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('permissions')
          .select('*')
          .order('name')
        
        if (error) throw error
        setPermissions(data || [])
      } catch (error) {
        console.error('Ошибка при получении разрешений:', error)
        toast.error('Не удалось загрузить список разрешений')
      }
    }
    
    fetchPermissions()
  }, [])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Auto-generate code from name
    if (name === 'name') {
      const code = value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      setFormData({ ...formData, name: value, code })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  // Handle switch toggle
  const handleSwitchChange = (checked: boolean) => {
    setFormData({ ...formData, active: checked })
  }

  // Handle permission checkbox changes
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setSelectedPermissions(prevSelected => {
      if (checked) {
        return [...prevSelected, permissionId]
      } else {
        return prevSelected.filter(id => id !== permissionId)
      }
    })
  }

  // Add new role with permissions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code) {
      toast.error('Название и код обязательны')
      return
    }
    
    setLoading(true)
    
    try {
      // 1. Add the role
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .insert([{
          name: formData.name,
          code: formData.code,
          active: formData.active
        }])
        .select()
      
      if (roleError) throw roleError
      
      // Get the new role ID
      const roleId = roleData[0].id
      
      // 2. Add role-permission associations if any permissions were selected
      if (selectedPermissions.length > 0) {
        const rolePermissions = selectedPermissions.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId
        }))
        
        const { error: permError } = await supabase
          .from('roles_permissions')
          .insert(rolePermissions)
        
        if (permError) throw permError
      }
      
      toast.success('Роль успешно добавлена')
      router.push('/admin/roles')
      router.refresh()
    } catch (error: any) {
      console.error('Ошибка при добавлении роли:', error)
      toast.error(error.message || 'Не удалось добавить роль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <SetPageTitle title="Add Role" description="Add a new role and assign permissions" />
    <div className="container py-6 max-w-4xl">
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название роли</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="например: Администратор"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Код роли</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="например: admin"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Уникальный идентификатор роли (только латинские буквы, цифры и дефисы)
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={handleSwitchChange}
                  disabled={loading}
                />
                <Label htmlFor="active">Активная роль</Label>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Разрешения</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {permissions.map((permission) => (
                    <div className="flex items-center space-x-2" key={permission.id}>
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, checked as boolean)
                        }
                        disabled={loading}
                      />
                      <Label 
                        htmlFor={`permission-${permission.id}`}
                        className="cursor-pointer"
                      >
                        {permission.name}
                        <span className="block text-xs text-muted-foreground">
                          {permission.slug}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
                {permissions.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Нет доступных разрешений. Сначала создайте разрешения.
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить роль'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  )
} 