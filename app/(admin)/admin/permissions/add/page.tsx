'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import type { PermissionFormData } from '@/lib/types'
import { SetPageTitle } from '@/lib/page-context'

export default function AddPermissionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PermissionFormData>({
    name: '',
    slug: '',
  })

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      setFormData({ ...formData, name: value, slug })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  // Add new permission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.slug) {
      toast.error('Название и slug обязательны')
      return
    }
    
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('permissions')
        .insert([
          { name: formData.name, slug: formData.slug }
        ])
      
      if (error) throw error
      
      toast.success('Разрешение успешно добавлено')
      router.push('/admin/permissions')
      router.refresh()
    } catch (error: any) {
      console.error('Ошибка при добавлении разрешения:', error)
      toast.error(error.message || 'Не удалось добавить разрешение')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <SetPageTitle title="Add Permission" description="Add a new permission to the system" />
    <div className="container py-6 max-w-4xl">
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название разрешения</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="например: Управление пользователями"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="например: manage-users"
                  value={formData.slug}
                  onChange={handleChange}
                  disabled={loading}
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
                disabled={loading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить разрешение'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  )
} 