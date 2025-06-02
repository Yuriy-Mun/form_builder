// API client for making requests to our Next.js API routes
class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL || ''
      : ''
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth methods
  auth = {
    getUser: () => this.request<{ user: any }>('/auth/user'),
    signIn: (email: string, password: string) =>
      this.request<{ user: any; session: any }>('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    signUp: (email: string, password: string, options?: any) =>
      this.request<{ user: any; session: any }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, options }),
      }),
    signOut: () =>
      this.request<{ message: string }>('/auth/signout', {
        method: 'POST',
      }),
  }

  // Forms methods
  forms = {
    list: () => this.request<{ forms: any[] }>('/forms'),
    get: (id: string) => this.request<{ form: any }>(`/forms/${id}`),
    getPublic: (id: string) => this.request<{ form: any; fields: any[] }>(`/forms/${id}/public`),
    create: (data: any) =>
      this.request<{ form: any }>('/forms', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<{ form: any }>(`/forms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ message: string }>(`/forms/${id}`, {
        method: 'DELETE',
      }),
  }

  // Form fields methods
  fields = {
    list: (formId: string) =>
      this.request<{ fields: any[] }>(`/forms/${formId}/fields`),
    create: (formId: string, data: any) =>
      this.request<{ field: any }>(`/forms/${formId}/fields`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    bulkUpdate: (formId: string, fields: any[]) =>
      this.request<{ fields: any[] }>(`/forms/${formId}/fields`, {
        method: 'PUT',
        body: JSON.stringify({ fields }),
      }),
    update: (formId: string, fieldId: string, data: any) =>
      this.request<{ field: any }>(`/forms/${formId}/fields/${fieldId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (formId: string, fieldId: string) =>
      this.request<{ message: string }>(`/forms/${formId}/fields/${fieldId}`, {
        method: 'DELETE',
      }),
  }

  // Form responses methods
  responses = {
    list: (formId: string) =>
      this.request<{ responses: any[] }>(`/forms/${formId}/responses`),
    submit: (formId: string, responseData: any) =>
      this.request<{ response: any }>(`/forms/${formId}/responses`, {
        method: 'POST',
        body: JSON.stringify({ response_data: responseData }),
      }),
  }

  // Roles methods
  roles = {
    list: () => this.request<{ roles: any[] }>('/roles'),
    get: (id: string) => this.request<{ role: any }>(`/roles/${id}`),
    create: (data: any) =>
      this.request<{ role: any }>('/roles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<{ role: any }>(`/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ message: string }>(`/roles/${id}`, {
        method: 'DELETE',
      }),
    // Role-permission relationships
    getPermissions: (roleId: string) =>
      this.request<{ permissions: any[] }>(`/roles/${roleId}/permissions`),
    addPermissions: (roleId: string, permissionIds: string[]) =>
      this.request<{ role_permissions: any[] }>(`/roles/${roleId}/permissions`, {
        method: 'POST',
        body: JSON.stringify({ permission_ids: permissionIds }),
      }),
    removePermissions: (roleId: string, permissionIds: string[]) =>
      this.request<{ message: string }>(`/roles/${roleId}/permissions`, {
        method: 'DELETE',
        body: JSON.stringify({ permission_ids: permissionIds }),
      }),
  }

  // Permissions methods
  permissions = {
    list: () => this.request<{ permissions: any[] }>('/permissions'),
    get: (id: string) => this.request<{ permission: any }>(`/permissions/${id}`),
    create: (data: any) =>
      this.request<{ permission: any }>('/permissions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<{ permission: any }>(`/permissions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ message: string }>(`/permissions/${id}`, {
        method: 'DELETE',
      }),
  }

  // Users methods
  users = {
    list: () => this.request<{ users: any[] }>('/users'),
    get: (id: string) => this.request<{ user: any }>(`/users/${id}`),
    create: (data: any) =>
      this.request<{ user: any }>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<{ user: any }>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ message: string }>(`/users/${id}`, {
        method: 'DELETE',
      }),
  }

  // Dashboards methods
  dashboards = {
    list: () => this.request<{ dashboards: any[] }>('/dashboards'),
    get: (id: string) => this.request<{ dashboard: any }>(`/dashboards/${id}`),
    create: (data: any) =>
      this.request<{ dashboard: any }>('/dashboards', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<{ dashboard: any }>(`/dashboards/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ message: string }>(`/dashboards/${id}`, {
        method: 'DELETE',
      }),
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient 