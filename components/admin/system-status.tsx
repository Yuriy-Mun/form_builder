import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  IconCircleCheck, 
  IconAlertTriangle, 
  IconServer, 
  IconDatabase,
  IconShield,
  IconClock,
  IconRefresh,
  IconExternalLink
} from "@tabler/icons-react"

interface SystemMetric {
  name: string
  status: "healthy" | "warning" | "error"
  value: string
  description: string
  lastUpdated: string
}

const systemMetrics: SystemMetric[] = [
  {
    name: "База данных",
    status: "healthy",
    value: "Активна",
    description: "Все соединения работают нормально",
    lastUpdated: "1 мин назад"
  },
  {
    name: "API сервер",
    status: "healthy", 
    value: "Онлайн",
    description: "Время отклика: 45ms",
    lastUpdated: "30 сек назад"
  },
  {
    name: "Резервное копирование",
    status: "warning",
    value: "Запланировано",
    description: "Следующее копирование через 2 часа",
    lastUpdated: "5 мин назад"
  },
  {
    name: "Безопасность",
    status: "healthy",
    value: "Защищено",
    description: "SSL сертификат действителен",
    lastUpdated: "1 час назад"
  }
]

function getStatusIcon(status: SystemMetric["status"]) {
  switch (status) {
    case "healthy":
      return <IconCircleCheck className="h-4 w-4 text-green-600" />
    case "warning":
      return <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
    case "error":
      return <IconAlertTriangle className="h-4 w-4 text-red-600" />
  }
}

function getStatusBadge(status: SystemMetric["status"]) {
  switch (status) {
    case "healthy":
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Норма</Badge>
    case "warning":
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">Внимание</Badge>
    case "error":
      return <Badge variant="destructive">Ошибка</Badge>
  }
}

function getMetricIcon(name: string) {
  switch (name) {
    case "База данных":
      return <IconDatabase className="h-5 w-5 text-blue-600" />
    case "API сервер":
      return <IconServer className="h-5 w-5 text-green-600" />
    case "Резервное копирование":
      return <IconRefresh className="h-5 w-5 text-orange-600" />
    case "Безопасность":
      return <IconShield className="h-5 w-5 text-purple-600" />
    default:
      return <IconCircleCheck className="h-5 w-5" />
  }
}

export function SystemStatus() {
  const healthyCount = systemMetrics.filter(m => m.status === "healthy").length
  const warningCount = systemMetrics.filter(m => m.status === "warning").length
  const errorCount = systemMetrics.filter(m => m.status === "error").length

  const overallStatus = errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "healthy"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            <CardTitle className="text-lg">Статус системы</CardTitle>
            {getStatusBadge(overallStatus)}
          </div>
          <Button variant="ghost" size="sm">
            <IconRefresh className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Мониторинг состояния основных компонентов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Общая статистика */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{healthyCount}</div>
            <div className="text-xs text-muted-foreground">Норма</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">{warningCount}</div>
            <div className="text-xs text-muted-foreground">Внимание</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{errorCount}</div>
            <div className="text-xs text-muted-foreground">Ошибки</div>
          </div>
        </div>

        {/* Детальная информация */}
        <div className="space-y-3">
          {systemMetrics.map((metric, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              {getMetricIcon(metric.name)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium">{metric.name}</h4>
                  {getStatusIcon(metric.status)}
                </div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
                <div className="flex items-center gap-1 mt-1">
                  <IconClock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{metric.lastUpdated}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{metric.value}</div>
                {getStatusBadge(metric.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Действия */}
        <div className="pt-3 border-t space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <IconExternalLink className="h-4 w-4 mr-2" />
            Подробный мониторинг
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <IconRefresh className="h-4 w-4 mr-2" />
            Обновить статус
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 