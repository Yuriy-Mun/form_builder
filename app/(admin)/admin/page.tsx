import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  IconCircleCheck,
  IconClock,
  IconArrowRight,
  IconBook,
  IconRocket,
  IconSparkles
} from "@tabler/icons-react"
import Link from "next/link"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { OnboardingTooltip } from "@/components/admin/onboarding-tooltip"
import { AdminNotifications } from "@/components/admin/admin-notifications"
import { QuickActions } from "@/components/admin/quick-actions"




// Компонент онбординга
function OnboardingCard() {
  const steps = [
    { title: "Создайте первую форму", completed: false, href: "/admin/forms/add" },
    { title: "Настройте роли пользователей", completed: false, href: "/admin/roles/add" },
    { title: "Добавьте пользователей", completed: false, href: "/admin/users" },
    { title: "Создайте дашборд", completed: false, href: "/admin/dashboards/add" },
  ]

  const completedSteps = steps.filter(step => step.completed).length
  const progress = (completedSteps / steps.length) * 100

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconRocket className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Добро пожаловать в админ-панель!</CardTitle>
        </div>
        <CardDescription>
          Выполните эти шаги для настройки системы
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Прогресс настройки</span>
            <span>{completedSteps}/{steps.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-3">
                                 {step.completed ? (
                   <IconCircleCheck className="h-4 w-4 text-green-600" />
                 ) : (
                   <IconClock className="h-4 w-4 text-muted-foreground" />
                 )}
                <span className={step.completed ? "line-through text-muted-foreground" : ""}>
                  {step.title}
                </span>
              </div>
              {!step.completed && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={step.href}>
                    <IconArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Компонент последних активностей
function RecentActivityCard() {
  const activities = [
    { action: "Создана новая форма", item: "Анкета сотрудника", time: "2 часа назад", type: "form" },
    { action: "Добавлен пользователь", item: "john.doe@company.com", time: "5 часов назад", type: "user" },
    { action: "Обновлены права доступа", item: "Роль Модератор", time: "1 день назад", type: "permission" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Последняя активность</CardTitle>
        <CardDescription>Недавние изменения в системе</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.action}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.item}</p>
              </div>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-3" size="sm">
          Показать все
          <IconArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Панель управления</h1>
          <p className="text-muted-foreground">
            Управляйте формами, пользователями и настройками системы
          </p>
        </div>
        <div className="flex items-center gap-2">
                     <Badge variant="outline" className="text-green-600 border-green-200">
             <IconCircleCheck className="h-3 w-3 mr-1" />
             Система активна
           </Badge>
        </div>
      </div>

      {/* Статистика */}
      <DashboardStats />

      {/* Основной контент */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Левая колонка - Онбординг и быстрые действия */}
        <div className="lg:col-span-2 space-y-6">
          {/* Подсказки онбординга */}
          <OnboardingTooltip
            title="Начните с создания первой формы"
            description="Формы - это основа системы. Создайте свою первую форму для сбора данных от пользователей."
            actionText="Создать форму"
            actionHref="/admin/forms/add"
            variant="info"
          />
          
          {/* Онбординг */}
          <OnboardingCard />

          {/* Быстрые действия */}
          <QuickActions />
        </div>

        {/* Правая колонка - Активность и ресурсы */}
        <div className="space-y-6">
          {/* Уведомления */}
          <AdminNotifications />
          
          {/* Последняя активность */}
          <RecentActivityCard />

          {/* Полезные ресурсы */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconBook className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Полезные ресурсы</CardTitle>
              </div>
              <CardDescription>Документация и руководства</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="#">
                  <IconBook className="h-4 w-4 mr-2" />
                  Руководство пользователя
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="#">
                  <IconSparkles className="h-4 w-4 mr-2" />
                  Лучшие практики
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="#">
                  <IconRocket className="h-4 w-4 mr-2" />
                  Что нового
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 