import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
  last_sign_in_at?: string | null
  email_confirmed_at?: string | null
  user_metadata?: any
  banned_until?: string | null
  roles: {
    id: string
    name: string
    code: string
    active: boolean
    roles_permissions?: {
      permissions: {
        id: string
        name: string
        slug: string
      }
    }[]
  }
}

export interface CreateUserData {
  email: string
  password: string
  role_id: string
  user_metadata?: any
}

export interface UpdateUserData {
  email?: string
  role_id?: string
  user_metadata?: any
  banned_until?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface UsersResponse {
  users: User[]
  pagination: PaginationInfo
}

export interface UseUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: string
}

// Хук для получения списка пользователей с пагинацией
export function useUsers(params: UseUsersParams = {}) {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Строим URL с параметрами
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.search) searchParams.set('search', params.search)
      if (params.role) searchParams.set('role', params.role)
      
      const url = `/api/users?${searchParams.toString()}`
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch users')
      }
      
      const data: UsersResponse = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [params.page, params.limit, params.search, params.role])

  return {
    users,
    pagination,
    loading,
    error,
    refetch: fetchUsers
  }
}

// Хук для получения конкретного пользователя
export function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/users/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch user')
      }
      
      const data = await response.json()
      setUser(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [id])

  return {
    user,
    loading,
    error,
    refetch: fetchUser
  }
}

// Хук для создания пользователя
export function useCreateUser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createUser = async (userData: CreateUserData): Promise<User | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }
      
      const data = await response.json()
      return data.user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    createUser,
    loading,
    error
  }
}

// Хук для обновления пользователя
export function useUpdateUser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateUser = async (id: string, userData: UpdateUserData): Promise<User | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }
      
      const data = await response.json()
      return data.user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    updateUser,
    loading,
    error
  }
}

// Хук для удаления пользователя
export function useDeleteUser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteUser = async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    deleteUser,
    loading,
    error
  }
} 