import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api/client'

// Глобальный кеш для предотвращения дублирования запросов
const requestCache = new Map<string, Promise<any>>()

// Экспортируем размер кеша в глобальный объект для мониторинга
if (typeof window !== 'undefined') {
  (window as any).__requestCacheSize = () => requestCache.size
}

// Простая функция дебаунсинга
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Generic hook for API operations
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: { debounceMs?: number; cacheKey?: string } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const lastCallRef = useRef<string>('')
  const { debounceMs = 100, cacheKey } = options

  const execute = useCallback(async () => {
    // Создаем уникальный идентификатор для этого вызова
    const callId = JSON.stringify(dependencies)
    
    // Если это тот же вызов, что и предыдущий, пропускаем
    if (lastCallRef.current === callId) {
      return
    }
    
    lastCallRef.current = callId
    
    try {
      setLoading(true)
      setError(null)
      
      let result: T
      
      // Используем глобальный кеш, если указан ключ
      if (cacheKey) {
        const cachedRequest = requestCache.get(cacheKey)
        if (cachedRequest) {
          result = await cachedRequest
        } else {
          const request = apiCall()
          requestCache.set(cacheKey, request)
          
          // Очищаем кеш через 5 секунд
          setTimeout(() => {
            requestCache.delete(cacheKey)
          }, 5000)
          
          result = await request
        }
      } else {
        result = await apiCall()
      }
      
      // Проверяем, что компонент все еще смонтирован
      if (mountedRef.current) {
        setData(result)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
      
      // Очищаем кеш при ошибке
      if (cacheKey) {
        requestCache.delete(cacheKey)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, dependencies)

  // Дебаунсированная версия execute
  const debouncedExecute = useCallback(
    debounce(execute, debounceMs),
    [execute, debounceMs]
  )

  useEffect(() => {
    mountedRef.current = true
    debouncedExecute()
    
    return () => {
      mountedRef.current = false
    }
  }, [debouncedExecute])

  return { data, loading, error, refetch: execute }
}

// Auth hooks
export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const isCheckingRef = useRef(false)

  const checkAuth = useCallback(async () => {
    // Предотвращаем множественные одновременные вызовы
    if (isCheckingRef.current) {
      return
    }
    
    isCheckingRef.current = true
    
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.auth.getUser()
      
      if (mountedRef.current) {
        setUser(result.user)
      }
    } catch (err) {
      if (mountedRef.current) {
        setUser(null)
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
      isCheckingRef.current = false
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.auth.signIn(email, password)
      
      if (mountedRef.current) {
        setUser(result.user)
      }
      return result
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Sign in failed')
      }
      throw err
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, options?: any) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.auth.signUp(email, password, options)
      
      if (mountedRef.current) {
        setUser(result.user)
      }
      return result
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Sign up failed')
      }
      throw err
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      await apiClient.auth.signOut()
      
      if (mountedRef.current) {
        setUser(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Sign out failed')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    checkAuth()
    
    return () => {
      mountedRef.current = false
    }
  }, [checkAuth])

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refetch: checkAuth,
  }
}

// Forms hooks
export function useForms() {
  return useApi(() => apiClient.forms.list(), [], { cacheKey: 'forms-list' })
}

export function useForm(id: string) {
  return useApi(() => apiClient.forms.get(id), [id], { cacheKey: `form-${id}` })
}

export function useFormFields(formId: string) {
  return useApi(() => apiClient.fields.list(formId), [formId], { cacheKey: `form-fields-${formId}` })
}

export function useFormResponses(formId: string) {
  return useApi(() => apiClient.responses.list(formId), [formId], { cacheKey: `form-responses-${formId}` })
}

// Roles hooks
export function useRoles() {
  return useApi(() => apiClient.roles.list(), [], { cacheKey: 'roles-list' })
}

export function useRole(id: string) {
  return useApi(() => apiClient.roles.get(id), [id], { cacheKey: `role-${id}` })
}

// Permissions hooks
export function usePermissions() {
  return useApi(() => apiClient.permissions.list(), [], { cacheKey: 'permissions-list' })
}

export function usePermission(id: string) {
  return useApi(() => apiClient.permissions.get(id), [id], { cacheKey: `permission-${id}` })
}

// Dashboards hooks
export function useDashboards() {
  return useApi(() => apiClient.dashboards.list(), [], { cacheKey: 'dashboards-list' })
}

export function useDashboard(id: string) {
  return useApi(() => apiClient.dashboards.get(id), [id], { cacheKey: `dashboard-${id}` })
}

// Mutation hooks for create/update/delete operations
export function useMutation<T, P = any>(
  mutationFn: (params: P) => Promise<T>
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (params: P) => {
    try {
      setLoading(true)
      setError(null)
      const result = await mutationFn(params)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Mutation failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [mutationFn])

  return { mutate, loading, error }
}

// Specific mutation hooks
export function useCreateForm() {
  return useMutation(async (params: any) => {
    const result = await apiClient.forms.create(params)
    clearCache('forms-list')
    return result
  })
}

export function useUpdateForm() {
  return useMutation(async ({ id, data }: { id: string; data: any }) => {
    const result = await apiClient.forms.update(id, data)
    clearCache(`form-${id}`)
    clearCache('forms-list')
    return result
  })
}

export function useDeleteForm() {
  return useMutation(async (id: string) => {
    const result = await apiClient.forms.delete(id)
    clearCache(`form-${id}`)
    clearCache('forms-list')
    return result
  })
}

export function useCreateField() {
  return useMutation(async ({ formId, data }: { formId: string; data: any }) => {
    const result = await apiClient.fields.create(formId, data)
    clearCache(`form-fields-${formId}`)
    return result
  })
}

export function useUpdateField() {
  return useMutation(({ formId, fieldId, data }: { formId: string; fieldId: string; data: any }) =>
    apiClient.fields.update(formId, fieldId, data)
  )
}

export function useDeleteField() {
  return useMutation(({ formId, fieldId }: { formId: string; fieldId: string }) =>
    apiClient.fields.delete(formId, fieldId)
  )
}

export function useBulkUpdateFields() {
  return useMutation(({ formId, fields }: { formId: string; fields: any[] }) =>
    apiClient.fields.bulkUpdate(formId, fields)
  )
}

export function useSubmitResponse() {
  return useMutation(({ formId, responseData }: { formId: string; responseData: any }) =>
    apiClient.responses.submit(formId, responseData)
  )
}

// Функция для очистки кеша
export function clearCache(pattern?: string) {
  if (pattern) {
    // Очищаем кеш по паттерну
    for (const key of requestCache.keys()) {
      if (key.includes(pattern)) {
        requestCache.delete(key)
      }
    }
  } else {
    // Очищаем весь кеш
    requestCache.clear()
  }
} 