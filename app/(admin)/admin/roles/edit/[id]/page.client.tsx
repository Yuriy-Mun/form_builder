'use client'

import React, { useState, useEffect } from 'react'
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

// Клиентский компонент для редактирования ролей
export default function EditRoleClient({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    code: '',
    active: true,
  })

  const supabase = getSupabaseClient()

  // Fetch role data and permissions
  useEffect(() => {
    const fetchRoleAndPermissions = async () => {
      try {
        // Fetch role
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('*')
          .eq('id', id)
          .single()
        
        if (roleError) throw roleError
        
        if (roleData) {
          setFormData({
            name: roleData.name,
            code: roleData.code,
            active: roleData.active
          })
          
          // Fetch all permissions
          const { data: permissionsData, error: permissionsError } = await supabase
            .from('permissions')
            .select('*')
            .order('name')
          
          if (permissionsError) throw permissionsError
          setPermissions(permissionsData || [])
          
          // Fetch role permissions
          const { data: rolePermissions, error: rpError } = await supabase
            .from('roles_permissions')
            .select('permission_id')
            .eq('role_id', id)
          
          if (rpError) throw rpError
          
          // Set selected permissions
          if (rolePermissions) {
            const permissionIds = rolePermissions.map((rp: any) => rp.permission_id)
            setSelectedPermissions(permissionIds)
          }
        } else {
          toast.error('Роль не найдена')
          router.push('/admin/roles')
        }
      } catch (error: any) {
        console.error('Ошибка при получении данных:', error)
        toast.error('Не удалось загрузить данные роли')
        router.push('/admin/roles')
      } finally {
        setLoading(false)
      }
    }
    
    fetchRoleAndPermissions()
  }, [id, router])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
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
        return prevSelected.filter(pId => pId !== permissionId)
      }
    })
  }

  // Update role and permissions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code) {
      toast.error('Название и код обязательны')
      return
    }
    
    setSaving(true)
    
    try {
      // 1. Update the role
      const { error: roleError } = await supabase
        .from('roles')
        .update({
          name: formData.name,
          code: formData.code,
          active: formData.active
        })
        .eq('id', id)
      
      if (roleError) throw roleError
      
      // 2. Delete existing role-permission associations
      const { error: deleteError } = await supabase
        .from('roles_permissions')
        .delete()
        .eq('role_id', id)
      
      if (deleteError) throw deleteError
      
      // 3. Add new role-permission associations
      if (selectedPermissions.length > 0) {
        const rolePermissions = selectedPermissions.map(permissionId => ({
          role_id: id,
          permission_id: permissionId
        }))
        
        const { error: permError } = await supabase
          .from('roles_permissions')
          .insert(rolePermissions)
        
        if (permError) throw permError
      }
      
      toast.success('Роль успешно обновлена')
      router.push('/admin/roles')
      router.refresh()
    } catch (error: any) {
      console.error('Ошибка при обновлении роли:', error)
      toast.error(error.message || 'Не удалось обновить роль')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <SetPageTitle title="Edit Role" description="Edit a role and its permissions" />
    <div className="container py-6 max-w-4xl">
      
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p>Загрузка данных...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название роли</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code">Код роли</Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    disabled={saving}
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
                    disabled={saving}
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
                          disabled={saving}
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
                  disabled={saving}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  )
} 