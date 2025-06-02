"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  IconBell, 
  IconX, 
  IconAlertTriangle, 
  IconInfoCircle, 
  IconCircleCheck,
  IconClock
} from "@tabler/icons-react"

interface Notification {
  id: string
  type: "info" | "warning" | "success" | "error"
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionText?: string
  actionHref?: string
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "info",
    title: "Новая версия системы",
    message: "Доступна новая версия с улучшенным интерфейсом и новыми функциями.",
    timestamp: "2 часа назад",
    isRead: false,
    actionText: "Подробнее",
    actionHref: "#"
  },
  {
    id: "2", 
    type: "warning",
    title: "Требуется обновление настроек",
    message: "Рекомендуется обновить настройки безопасности для лучшей защиты.",
    timestamp: "1 день назад",
    isRead: false,
    actionText: "Настроить",
    actionHref: "/admin/settings"
  },
  {
    id: "3",
    type: "success",
    title: "Резервное копирование завершено",
    message: "Автоматическое резервное копирование данных выполнено успешно.",
    timestamp: "2 дня назад",
    isRead: true
  }
]

export function AdminNotifications() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [isExpanded, setIsExpanded] = useState(false)

  const unreadCount = notifications.filter(n => !n.isRead).length
  const displayNotifications = isExpanded ? notifications : notifications.slice(0, 3)

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "info":
        return <IconInfoCircle className="h-4 w-4 text-blue-600" />
      case "warning":
        return <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
      case "success":
        return <IconCircleCheck className="h-4 w-4 text-green-600" />
      case "error":
        return <IconAlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <IconBell className="h-4 w-4" />
    }
  }

  const getBadgeVariant = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
      case "error":
        return "destructive"
      case "success":
        return "default"
      default:
        return "secondary"
    }
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconBell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Уведомления</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {notifications.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Свернуть" : "Показать все"}
            </Button>
          )}
        </div>
        <CardDescription>
          Важные обновления и уведомления системы
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border transition-colors ${
              notification.isRead 
                ? "bg-muted/30 border-muted" 
                : "bg-background border-border shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {getIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-sm font-medium ${
                      notification.isRead ? "text-muted-foreground" : ""
                    }`}>
                      {notification.title}
                    </h4>
                    <Badge variant={getBadgeVariant(notification.type)} className="text-xs">
                      {notification.type}
                    </Badge>
                  </div>
                  <p className={`text-xs ${
                    notification.isRead ? "text-muted-foreground" : "text-foreground"
                  }`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <IconClock className="h-3 w-3" />
                      {notification.timestamp}
                    </span>
                    <div className="flex items-center gap-2">
                      {notification.actionText && notification.actionHref && (
                        <Button asChild variant="ghost" size="sm" className="text-xs h-6">
                          <a href={notification.actionHref}>
                            {notification.actionText}
                          </a>
                        </Button>
                      )}
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Прочитано
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                onClick={() => dismissNotification(notification.id)}
              >
                <IconX className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {unreadCount > 0 && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setNotifications(prev => 
                prev.map(n => ({ ...n, isRead: true }))
              )}
            >
              Отметить все как прочитанные
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 