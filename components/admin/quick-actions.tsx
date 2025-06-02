import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  IconPlus, 
  IconClipboardList, 
  IconUsers, 
  IconChartBar, 
  IconUserShield,
  IconArrowRight,
  IconSparkles,
  IconFileImport,
  IconSettings,
  IconDownload
} from "@tabler/icons-react"
import Link from "next/link"

interface QuickActionProps {
  title: string
  description: string
  icon: any
  href: string
  badge?: string
  variant?: "default" | "featured"
}

function QuickActionCard({ title, description, icon: Icon, href, badge, variant = "default" }: QuickActionProps) {
  const cardClasses = variant === "featured" 
    ? "hover:shadow-lg transition-all duration-200 cursor-pointer group border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
    : "hover:shadow-md transition-shadow cursor-pointer group"

  return (
    <Card className={cardClasses}>
      <Link href={href}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Icon className={`h-8 w-8 ${variant === "featured" ? "text-primary" : "text-primary"}`} />
            {badge && (
              <Badge variant={variant === "featured" ? "default" : "secondary"}>
                {badge}
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="ghost" 
            className={`w-full justify-between ${
              variant === "featured" 
                ? "group-hover:bg-primary/10 text-primary" 
                : "group-hover:bg-primary/5"
            }`}
          >
            Начать
            <IconArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Link>
    </Card>
  )
}

export function QuickActions() {
  const primaryActions = [
    {
      title: "Создать форму",
      description: "Создайте новую форму для сбора данных",
      icon: IconClipboardList,
      href: "/admin/forms/add",
      badge: "Популярное",
      variant: "featured" as const
    },
    {
      title: "Добавить пользователя",
      description: "Пригласите нового пользователя в систему",
      icon: IconUsers,
      href: "/admin/users",
      variant: "default" as const
    }
  ]

  const secondaryActions = [
    {
      title: "Настроить роли",
      description: "Управляйте правами доступа пользователей",
      icon: IconUserShield,
      href: "/admin/roles/add",
      variant: "default" as const
    },
    {
      title: "Создать дашборд",
      description: "Визуализируйте данные в дашборде",
      icon: IconChartBar,
      href: "/admin/dashboards/add",
      variant: "default" as const
    }
  ]

  const additionalActions = [
    {
      title: "Импорт из Word",
      description: "Импортируйте форму из документа Word",
      icon: IconFileImport,
      href: "/admin/forms/import-word",
      badge: "Новое",
      variant: "default" as const
    },
    {
      title: "Настройки системы",
      description: "Конфигурация и настройки приложения",
      icon: IconSettings,
      href: "/admin/settings",
      variant: "default" as const
    },
    {
      title: "Экспорт данных",
      description: "Экспортируйте данные форм и отчеты",
      icon: IconDownload,
      href: "/admin/export",
      variant: "default" as const
    }
  ]

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-2">
        <IconSparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Быстрые действия</h2>
      </div>

      {/* Основные действия */}
      <div className="grid gap-4 md:grid-cols-2">
        {primaryActions.map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
      </div>

      {/* Дополнительные действия */}
      <div className="grid gap-4 md:grid-cols-2">
        {secondaryActions.map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
      </div>

      {/* Расширенные действия */}
      <div>
        <h3 className="text-lg font-medium mb-3 text-muted-foreground">Дополнительные инструменты</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {additionalActions.map((action, index) => (
            <Card key={index} className="hover:shadow-sm transition-shadow cursor-pointer group">
              <Link href={action.href}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <action.icon className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{action.title}</h4>
                        {action.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <IconArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 