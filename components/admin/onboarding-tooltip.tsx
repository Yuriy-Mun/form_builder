"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconX, IconBulb, IconArrowRight } from "@tabler/icons-react"

interface OnboardingTooltipProps {
  title: string
  description: string
  actionText?: string
  actionHref?: string
  onDismiss?: () => void
  variant?: "info" | "success" | "warning"
}

export function OnboardingTooltip({
  title,
  description,
  actionText,
  actionHref,
  onDismiss,
  variant = "info"
}: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  const variantStyles = {
    info: "border-blue-200 bg-blue-50/50",
    success: "border-green-200 bg-green-50/50", 
    warning: "border-yellow-200 bg-yellow-50/50"
  }

  const iconColors = {
    info: "text-blue-600",
    success: "text-green-600",
    warning: "text-yellow-600"
  }

  return (
    <Card className={`${variantStyles[variant]} relative`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <IconBulb className={`h-5 w-5 ${iconColors[variant]}`} />
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Подсказка
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <IconX className="h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      {(actionText && actionHref) && (
        <CardContent className="pt-0">
          <Button asChild size="sm" variant="outline">
            <a href={actionHref}>
              {actionText}
              <IconArrowRight className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </CardContent>
      )}
    </Card>
  )
} 