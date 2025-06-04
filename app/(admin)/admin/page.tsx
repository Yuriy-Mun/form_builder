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
  IconSparkles,
  IconForms,
  IconUsers,
  IconChartBar,
  IconSettings,
  IconPlayerPlay,
  IconStar
} from "@tabler/icons-react"
import Link from "next/link"




// Hero секция с объяснением платформы
function WelcomeHero() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8 mb-8">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <IconRocket className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Добро пожаловать в FormBuilder</h1>
            <p className="text-lg text-muted-foreground">Мощная платформа для создания форм и сбора данных</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Что это за платформа?</h3>
            <p className="text-muted-foreground mb-4">
              FormBuilder позволяет создавать интерактивные формы, управлять пользователями 
              и анализировать собранные данные через удобные дашборды.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Начните прямо сейчас</h3>
            <p className="text-muted-foreground mb-4">
              Следуйте простым шагам ниже, чтобы настроить систему и создать первую форму 
              за несколько минут.
            </p>
          </div>
        </div>

        <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
          <Link href="/admin/forms/add" className="flex items-center gap-2">
            <IconPlayerPlay className="h-4 w-4" />
            Создать первую форму
          </Link>
        </Button>
      </div>
      
      {/* Декоративные элементы */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
    </div>
  )
}

// Компонент быстрых действий
function QuickStartActions() {
  const actions = [
    {
      icon: IconForms,
      title: "Создать форму",
      description: "Создайте новую форму для сбора данных",
      href: "/admin/forms/add",
      color: "bg-blue-500/10 text-blue-600 border-blue-200"
    },
    {
      icon: IconUsers,
      title: "Управление пользователями",
      description: "Добавьте пользователей и настройте роли",
      href: "/admin/users",
      color: "bg-green-500/10 text-green-600 border-green-200"
    },
    {
      icon: IconChartBar,
      title: "Создать дашборд",
      description: "Визуализируйте данные из форм",
      href: "/admin/dashboards/add",
      color: "bg-purple-500/10 text-purple-600 border-purple-200"
    },
    {
      icon: IconSettings,
      title: "Настройки системы",
      description: "Настройте права доступа и роли",
      href: "/admin/roles",
      color: "bg-orange-500/10 text-orange-600 border-orange-200"
    }
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {actions.map((action, index) => (
        <Card key={index} className="group hover:shadow-md transition-all duration-200 hover:-translate-y-1">
          <CardContent className="p-6">
            <Link href={action.href} className="block">
              <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                <action.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Пошаговое руководство
function StepByStepGuide() {
  const steps = [
    { 
      number: 1,
      title: "Создайте первую форму", 
      description: "Начните с создания простой формы для сбора данных",
      href: "/admin/forms/add",
      estimated: "5 мин"
    },
    { 
      number: 2,
      title: "Настройте пользователей", 
      description: "Добавьте пользователей и настройте их роли",
      href: "/admin/users",
      estimated: "10 мин"
    },
    { 
      number: 3,
      title: "Создайте дашборд", 
      description: "Визуализируйте собранные данные",
      href: "/admin/dashboards/add",
      estimated: "15 мин"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconStar className="h-5 w-5 text-primary" />
          <CardTitle>Пошаговое руководство</CardTitle>
        </div>
        <CardDescription>
          Следуйте этим шагам, чтобы быстро освоить платформу
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {step.number}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                <span className="text-xs text-primary">Примерное время: {step.estimated}</span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={step.href}>
                  Начать
                  <IconArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Полезные ресурсы
function HelpfulResources() {
  const resources = [
    {
      icon: IconBook,
      title: "Документация",
      description: "Подробное руководство по всем функциям",
      href: "#"
    },
    {
      icon: IconSparkles,
      title: "Примеры форм",
      description: "Готовые шаблоны для быстрого старта",
      href: "#"
    },
    {
      icon: IconRocket,
      title: "Видео-туры",
      description: "Смотрите как работать с платформой",
      href: "#"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconBook className="h-5 w-5 text-primary" />
          <CardTitle>Полезные ресурсы</CardTitle>
        </div>
        <CardDescription>Материалы для изучения платформы</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {resources.map((resource, index) => (
          <Button key={index} variant="ghost" className="w-full justify-start h-auto p-3" asChild>
            <Link href={resource.href}>
              <div className="flex items-center gap-3">
                <resource.icon className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{resource.title}</div>
                  <div className="text-xs text-muted-foreground">{resource.description}</div>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  return (
    <div className="space-y-8">
      {/* Hero секция с объяснением платформы */}
      <WelcomeHero />

      {/* Быстрые действия */}
      <QuickStartActions />

      {/* Основной контент */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Левая колонка - Пошаговое руководство */}
        <div className="lg:col-span-2">
          <StepByStepGuide />
        </div>

        {/* Правая колонка - Статистика и ресурсы */}
        <div className="space-y-6">
          {/* Быстрая статистика */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Статистика</CardTitle>
              <CardDescription>Текущее состояние системы</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Всего форм</span>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Пользователи</span>
                <Badge variant="secondary">48</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ответы</span>
                <Badge variant="secondary">324</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Дашборды</span>
                <Badge variant="secondary">5</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Полезные ресурсы */}
          <HelpfulResources />

          {/* Статус системы */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Система работает стабильно</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Последняя проверка: только что
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 