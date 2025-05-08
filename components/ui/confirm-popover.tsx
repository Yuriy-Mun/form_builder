"use client"

import React from "react"
import { AlertCircle } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ConfirmPopoverProps {
  trigger: React.ReactNode
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
}

export function ConfirmPopover({
  trigger,
  title,
  description,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
}: ConfirmPopoverProps) {
  const [open, setOpen] = React.useState(false)

  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="font-medium">{title}</div>
          </div>
          {description && (
            <div className="mt-2 text-sm text-muted-foreground">
              {description}
            </div>
          )}
        </div>
        <div className="flex items-center border-t p-2 bg-muted/50">
          <button
            className="ml-auto mr-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            {cancelText}
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
} 