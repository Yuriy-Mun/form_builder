import { NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    const supabase = await createClient()

    // Получаем недавно созданные формы
    const { data: recentForms } = await supabase
      .from('forms')
      .select('id, title, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Получаем недавние ответы на формы
    const { data: recentResponses } = await supabase
      .from('form_responses')
      .select(`
        id,
        completed_at,
        forms!inner(id, title, created_by)
      `)
      .eq('forms.created_by', user.id)
      .order('completed_at', { ascending: false })
      .limit(5)

    // Получаем недавно добавленных пользователей
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    // Получаем недавно созданные дашборды
    const { data: recentDashboards } = await supabase
      .from('dashboards')
      .select('id, title, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    // Объединяем все активности и сортируем по времени
    const activities: Array<{
      type: string
      action: string
      item: string
      time: string
      href: string
    }> = []

    // Добавляем формы
    recentForms?.forEach(form => {
      activities.push({
        type: 'form_created',
        action: 'Создана форма',
        item: form.title,
        time: form.created_at,
        href: `/admin/forms/${form.id}`
      })
    })

    // Добавляем ответы
    recentResponses?.forEach((response: any) => {
      const form = response.forms
      if (form) {
        activities.push({
          type: 'response_created',
          action: 'Новый ответ',
          item: form.title,
          time: response.completed_at,
          href: `/admin/forms/${form.id}/responses`
        })
      }
    })

    // Добавляем пользователей
    recentUsers?.forEach(user => {
      activities.push({
        type: 'user_created',
        action: 'Добавлен пользователь',
        item: user.email,
        time: user.created_at,
        href: '/admin/users'
      })
    })

    // Добавляем дашборды
    recentDashboards?.forEach(dashboard => {
      activities.push({
        type: 'dashboard_created',
        action: 'Создан дашборд',
        item: dashboard.title,
        time: dashboard.created_at,
        href: `/admin/dashboards/${dashboard.id}`
      })
    })

    // Сортируем по времени (новые сначала) и берем первые 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10)
      .map(activity => ({
        ...activity,
        timeAgo: getTimeAgo(activity.time)
      }))

    return NextResponse.json({
      activities: sortedActivities
    })
  } catch (error) {
    console.error('Error fetching admin activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Функция для форматирования времени "назад"
function getTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'только что'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${getMinutesWord(minutes)} назад`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${getHoursWord(hours)} назад`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ${getDaysWord(days)} назад`
  } else {
    return date.toLocaleDateString('ru-RU')
  }
}

function getMinutesWord(count: number): string {
  if (count === 1) return 'минуту'
  if (count >= 2 && count <= 4) return 'минуты'
  return 'минут'
}

function getHoursWord(count: number): string {
  if (count === 1) return 'час'
  if (count >= 2 && count <= 4) return 'часа'
  return 'часов'
}

function getDaysWord(count: number): string {
  if (count === 1) return 'день'
  if (count >= 2 && count <= 4) return 'дня'
  return 'дней'
} 