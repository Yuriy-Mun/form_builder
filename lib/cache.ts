import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

// Cache tags for different data types
export const CACHE_TAGS = {
  FORMS: 'forms',
  FORM: 'form',
  PUBLIC_FORM: 'public-form',
  ROLES: 'roles',
  ROLE: 'role',
  PERMISSIONS: 'permissions',
  PERMISSION: 'permission',
  DASHBOARDS: 'dashboards',
  DASHBOARD: 'dashboard',
  FORM_FIELDS: 'form-fields',
  FORM_RESPONSES: 'form-responses',
  ROLE_PERMISSIONS: 'role-permissions',
} as const

// Cache durations in seconds
export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const

// Generic cached function wrapper
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyParts: string[],
  options: {
    tags: string[]
    revalidate?: number
  }
) {
  return unstable_cache(
    fn,
    keyParts,
    {
      tags: options.tags,
      revalidate: options.revalidate || CACHE_DURATIONS.MEDIUM,
    }
  )
}

// Create Supabase client with service key for cached functions
// This bypasses RLS and should only be used for read operations with proper filtering
function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for cached functions')
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Cached Supabase query functions
export const getCachedForms = createCachedFunction(
  async (userId: string) => {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },
  ['forms'],
  {
    tags: [CACHE_TAGS.FORMS],
    revalidate: CACHE_DURATIONS.MEDIUM,
  }
)

export const getCachedForm = createCachedFunction(
  async (formId: string, userId: string) => {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .eq('created_by', userId)
      .single()
    
    if (error) throw error
    return data
  },
  ['form'],
  {
    tags: [CACHE_TAGS.FORM, CACHE_TAGS.FORMS],
    revalidate: CACHE_DURATIONS.MEDIUM,
  }
)

export const getCachedFormFields = createCachedFunction(
  async (formId: string, userId: string) => {
    const supabase = createServiceClient()
    // First verify form ownership
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', formId)
      .eq('created_by', userId)
      .single()
    
    if (formError) throw formError
    
    // Then get fields
    const { data, error } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', formId)
      .order('position', { ascending: true })
    
    if (error) throw error
    return data
  },
  ['form-fields'],
  {
    tags: [CACHE_TAGS.FORM_FIELDS, CACHE_TAGS.FORM],
    revalidate: CACHE_DURATIONS.MEDIUM,
  }
)

export const getCachedFormResponses = createCachedFunction(
  async (formId: string, userId: string) => {
    const supabase = createServiceClient()
    
    // First verify form ownership
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', formId)
      .eq('created_by', userId)
      .single()
    
    if (formError) throw formError
    
    // Then get responses
    const { data, error } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },
  ['form-responses'],
  {
    tags: [CACHE_TAGS.FORM_RESPONSES, CACHE_TAGS.FORM],
    revalidate: CACHE_DURATIONS.SHORT, // Responses change frequently
  }
)

export const getCachedRoles = createCachedFunction(
  async () => {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  },
  ['roles'],
  {
    tags: [CACHE_TAGS.ROLES],
    revalidate: CACHE_DURATIONS.LONG,
  }
)

export const getCachedRole = createCachedFunction(
  async (roleId: string) => {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single()
    
    if (error) throw error
    return data
  },
  ['role'],
  {
    tags: [CACHE_TAGS.ROLE, CACHE_TAGS.ROLES],
    revalidate: CACHE_DURATIONS.LONG,
  }
)

export const getCachedRolePermissions = createCachedFunction(
  async (roleId: string) => {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        *,
        permissions (*)
      `)
      .eq('role_id', roleId)
    
    if (error) throw error
    return data
  },
  ['role-permissions'],
  {
    tags: [CACHE_TAGS.ROLE_PERMISSIONS, CACHE_TAGS.ROLE],
    revalidate: CACHE_DURATIONS.LONG,
  }
)

export const getCachedPermissions = createCachedFunction(
  async () => {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data
  },
  ['permissions'],
  {
    tags: [CACHE_TAGS.PERMISSIONS],
    revalidate: CACHE_DURATIONS.VERY_LONG, // Permissions rarely change
  }
)

export const getCachedPermission = createCachedFunction(
  async (permissionId: string) => {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('id', permissionId)
      .single()
    
    if (error) throw error
    return data
  },
  ['permission'],
  {
    tags: [CACHE_TAGS.PERMISSION, CACHE_TAGS.PERMISSIONS],
    revalidate: CACHE_DURATIONS.VERY_LONG,
  }
)

export const getCachedDashboards = createCachedFunction(
  async (userId: string) => {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },
  ['dashboards'],
  {
    tags: [CACHE_TAGS.DASHBOARDS],
    revalidate: CACHE_DURATIONS.MEDIUM,
  }
)

export const getCachedDashboard = createCachedFunction(
  async (dashboardId: string, userId: string) => {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .eq('id', dashboardId)
      .eq('created_by', userId)
      .single()
    
    if (error) throw error
    return data
  },
  ['dashboard'],
  {
    tags: [CACHE_TAGS.DASHBOARD, CACHE_TAGS.DASHBOARDS],
    revalidate: CACHE_DURATIONS.MEDIUM,
  }
)

// Public form access (no authentication required)
export const getCachedPublicForm = createCachedFunction(
  async (formId: string) => {
    // Use anonymous client for public access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get form data
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .eq('active', true)
      .single()

    if (formError) throw formError

    // Get form fields
    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', formId)
      .eq('active', true)
      .order('position', { ascending: true })

    if (fieldsError) throw fieldsError

    return { form, fields: fields || [] }
  },
  ['public-form'],
  {
    tags: [CACHE_TAGS.PUBLIC_FORM],
    revalidate: CACHE_DURATIONS.MEDIUM,
  }
)

// Note: Manual cache revalidation should be done server-side only
// Use revalidateTag directly in server actions or API routes instead

// Example of server-side revalidation:
// import { revalidateTag } from 'next/cache'
// revalidateTag(CACHE_TAGS.FORMS) 