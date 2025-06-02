import { toast as sonnerToast } from 'sonner'

interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const toast = ({ title, description, variant = 'default', duration }: ToastProps) => {
    const message = title || description || ''
    const fullMessage = title && description ? `${title}: ${description}` : message

    if (variant === 'destructive') {
      sonnerToast.error(fullMessage, { duration })
    } else {
      sonnerToast.success(fullMessage, { duration })
    }
  }

  return { toast }
} 