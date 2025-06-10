'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import type { PermissionFormData } from '@/lib/types'
import { SetPageTitle } from '@/lib/page-context'

// Клиентский компонент для редактирования разрешений
export default function EditPermissionClient({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<PermissionFormData>({
    name: '',
    slug: '',
  })

  const supabase = getSupabaseClient()

  // Fetch permission data
  useEffect(() => {
    const fetchPermission = async () => {
      try {
        const { data, error } = await supabase
          .from('permissions')
          .select('*')
          .eq('id', id)
          .single()
        
        if (error) throw error
        
        if (data) {
          setFormData({
            name: data.name,
            slug: data.slug
          })
        } else {
          toast.error('Разрешение не найдено')
          router.push('/admin/permissions')
        }
      } catch (error: any) {
        console.error('Ошибка при получении разрешения:', error)
        toast.error('Не удалось загрузить разрешение')
        router.push('/admin/permissions')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPermission()
  }, [id, router])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // Update permission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.slug) {
      toast.error('Название и slug обязательны')
      return
    }
    
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('permissions')
        .update({ 
          name: formData.name, 
          slug: formData.slug 
        })
        .eq('id', id)
      
      if (error) throw error
      
      toast.success('Разрешение успешно обновлено')
      router.push('/admin/permissions')
      router.refresh()
    } catch (error: any) {
      console.error('Ошибка при обновлении разрешения:', error)
      toast.error(error.message || 'Не удалось обновить разрешение')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <SetPageTitle title="Edit Permission" description="Edit a permission in the system" />
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
                  <Label htmlFor="name">Название разрешения</Label>
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
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">
                    Уникальный идентификатор разрешения (только латинские буквы, цифры и дефисы)
                  </p>
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