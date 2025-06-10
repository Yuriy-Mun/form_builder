import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  IconForms,
  IconUsers,
  IconChartBar,
  IconSettings,
  IconPlus,
  IconEye,
  IconTrendingUp,
  IconActivity
} from "@tabler/icons-react"
import Link from "next/link"
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'

// Типы для данных
interface Stats {
  forms: { total: number; weeklyChange: number }
  users: { total: number; weeklyChange: number }
  responses: { total: number; weeklyChange: number }
  dashboards: { total: number; weeklyChange: number }
}

interface Activity {
  type: string
  action: string
  item: string
  timeAgo: string
  href: string
}

// Функция для получения статистики
async function getStats(): Promise<Stats> {
  try {
    const user = await getAuthenticatedUser()
    const supabase = await createClient()

    // Получаем статистику форм
    const { count: formsCount } = await supabase
      .from('forms')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)

    // Получаем статистику форм за последнюю неделю
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { count: formsWeekCount } = await supabase
      .from('forms')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .gte('created_at', weekAgo.toISOString())

    // Получаем статистику пользователей
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Получаем статистику пользователей за последнюю неделю
    const { count: usersWeekCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    // Получаем статистику ответов на формы
    const { count: responsesCount } = await supabase
      .from('form_responses')
      .select(`
        *,
        forms!inner(created_by)
      `, { count: 'exact', head: true })
      .eq('forms.created_by', user.id)

    // Получаем статистику ответов за последнюю неделю
    const { count: responsesWeekCount } = await supabase
      .from('form_responses')
      .select(`
        *,
        forms!inner(created_by)
      `, { count: 'exact', head: true })
      .eq('forms.created_by', user.id)
      .gte('completed_at', weekAgo.toISOString())

    // Получаем статистику дашбордов
    const { count: dashboardsCount } = await supabase
      .from('dashboards')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)

    // Получаем статистику дашбордов за последнюю неделю
    const { count: dashboardsWeekCount } = await supabase
      .from('dashboards')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .gte('created_at', weekAgo.toISOString())

    return {
      forms: { total: formsCount || 0, weeklyChange: formsWeekCount || 0 },
      users: { total: usersCount || 0, weeklyChange: usersWeekCount || 0 },
      responses: { total: responsesCount || 0, weeklyChange: responsesWeekCount || 0 },
      dashboards: { total: dashboardsCount || 0, weeklyChange: dashboardsWeekCount || 0 }
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      forms: { total: 0, weeklyChange: 0 },
      users: { total: 0, weeklyChange: 0 },
      responses: { total: 0, weeklyChange: 0 },
      dashboards: { total: 0, weeklyChange: 0 }
    }
  }
}

// Функция для получения активности
async function getActivity(): Promise<Activity[]> {
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

    return sortedActivities
  } catch (error) {
    console.error('Error fetching activity:', error)
    return []
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

// Статистические карточки
async function StatsCards() {
  const stats = await getStats()
  
  const statsData = [
    {
      title: "Формы",
      value: stats.forms.total.toString(),
      change: `+${stats.forms.weeklyChange} за неделю`,
      icon: IconForms,
      href: "/admin/forms"
    },
    {
      title: "Пользователи", 
      value: stats.users.total.toString(),
      change: `+${stats.users.weeklyChange} за неделю`,
      icon: IconUsers,
      href: "/admin/users"
    },
    {
      title: "Ответы",
      value: stats.responses.total.toString(),
      change: `+${stats.responses.weeklyChange} за неделю`, 
      icon: IconActivity,
      href: "/admin/forms"
    },
    {
      title: "Дашборды",
      value: stats.dashboards.total.toString(),
      change: `+${stats.dashboards.weeklyChange} за неделю`,
      icon: IconChartBar,
      href: "/admin/dashboards"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href={stat.href}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <IconTrendingUp className="h-3 w-3" />
                    {stat.change}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  )
}

// Быстрые действия
function QuickActions() {
  const actions = [
    {
      title: "Создать форму",
      description: "Новая форма для сбора данных",
      href: "/admin/forms/add",
      icon: IconPlus,
      variant: "default" as const
    },
    {
      title: "Добавить пользователя",
      description: "Пригласить нового пользователя",
      href: "/admin/users",
      icon: IconUsers,
      variant: "outline" as const
    },
    {
      title: "Создать дашборд",
      description: "Визуализация данных",
      href: "/admin/dashboards/add", 
      icon: IconChartBar,
      variant: "outline" as const
    },
    {
      title: "Настройки",
      description: "Управление системой",
      href: "/admin/roles",
      icon: IconSettings,
      variant: "outline" as const
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Быстрые действия</CardTitle>
        <CardDescription>Основные операции системы</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto p-4 justify-start"
              asChild
            >
              <Link href={action.href}>
                <div className="flex items-center gap-3">
                  <action.icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Недавняя активность
async function RecentActivity() {
  const activities = await getActivity()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Недавняя активность</CardTitle>
          <CardDescription>Последние изменения в системе</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.slice(0, 5).map((activity, index) => (
              <Link key={index} href={activity.href}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.item}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Пока нет активности</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AdminPage() {
  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">FormBuilder</h1>
        <p className="text-muted-foreground">
          Платформа для создания форм и управления данными
        </p>
      </div>

      {/* Статистика */}
      <StatsCards />

      {/* Основной контент */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Быстрые действия */}
        <div className="lg:col-span-2">
          <QuickActions />
        </div>

        {/* Недавняя активность */}
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  )
} 