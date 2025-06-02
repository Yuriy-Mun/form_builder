import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  IconClipboardList, 
  IconUsers, 
  IconEye, 
  IconChartBar,
  IconTrendingUp,
  IconTrendingDown
} from "@tabler/icons-react"

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: any
  trend?: { value: number; isPositive: boolean }
  isLoading?: boolean
}

function StatCard({ title, value, description, icon: Icon, trend, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className={`flex items-center text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? (
              <IconTrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <IconTrendingDown className="h-3 w-3 mr-1" />
            )}
            {trend.isPositive ? '+' : ''}{trend.value}% за месяц
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Компонент для загрузки статистики форм
async function FormsStats() {
  // В реальном приложении здесь будет запрос к API
  // const stats = await fetch('/api/stats/forms').then(res => res.json())
  
  return (
    <StatCard
      title="Всего форм"
      value="12"
      description="Активных форм в системе"
      icon={IconClipboardList}
      trend={{ value: 20, isPositive: true }}
    />
  )
}

// Компонент для загрузки статистики пользователей
async function UsersStats() {
  // В реальном приложении здесь будет запрос к API
  // const stats = await fetch('/api/stats/users').then(res => res.json())
  
  return (
    <StatCard
      title="Пользователи"
      value="48"
      description="Зарегистрированных пользователей"
      icon={IconUsers}
      trend={{ value: 12, isPositive: true }}
    />
  )
}

// Компонент для загрузки статистики ответов
async function ResponsesStats() {
  // В реальном приложении здесь будет запрос к API
  // const stats = await fetch('/api/stats/responses').then(res => res.json())
  
  return (
    <StatCard
      title="Ответы"
      value="324"
      description="Заполненных форм"
      icon={IconEye}
      trend={{ value: 8, isPositive: true }}
    />
  )
}

// Компонент для загрузки статистики дашбордов
async function DashboardsStats() {
  // В реальном приложении здесь будет запрос к API
  // const stats = await fetch('/api/stats/dashboards').then(res => res.json())
  
  return (
    <StatCard
      title="Дашборды"
      value="5"
      description="Активных дашбордов"
      icon={IconChartBar}
      trend={{ value: 25, isPositive: true }}
    />
  )
}

// Основной компонент статистики
export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Suspense fallback={<StatCard title="" value="" description="" icon={IconClipboardList} isLoading />}>
        <FormsStats />
      </Suspense>
      <Suspense fallback={<StatCard title="" value="" description="" icon={IconUsers} isLoading />}>
        <UsersStats />
      </Suspense>
      <Suspense fallback={<StatCard title="" value="" description="" icon={IconEye} isLoading />}>
        <ResponsesStats />
      </Suspense>
      <Suspense fallback={<StatCard title="" value="" description="" icon={IconChartBar} isLoading />}>
        <DashboardsStats />
      </Suspense>
    </div>
  )
} 