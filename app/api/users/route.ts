import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Функция для получения auth данных пользователей с пагинацией
async function getAuthUsers(page: number, limit: number) {
  try {
    // Используем service client для admin операций
    const serviceSupabase = createServiceClient()
    const { data, error } = await serviceSupabase.auth.admin.listUsers({
      page,
      perPage: limit
    })
    
    if (error) {
      console.error('Error fetching auth users:', error)
      return { users: [], nextPage: null, lastPage: 0 }
    }
    
    // Создаем Map для быстрого поиска по ID
    const authUsersMap = new Map()
    data.users.forEach((user: any) => {
      authUsersMap.set(user.id, user)
    })
    
    return {
      authUsersMap,
      nextPage: data.nextPage,
      lastPage: data.lastPage
    }
  } catch (error) {
    console.error('Error in getAuthUsers:', error)
    return { authUsersMap: new Map(), nextPage: null, lastPage: 0 }
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Проверяем аутентификацию
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем параметры пагинации из URL
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || ''

    // Вычисляем offset для пагинации
    const offset = (page - 1) * limit

    // Строим запрос с фильтрами
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        created_at,
        updated_at,
        roles (
          id,
          name,
          code,
          active
        )
      `, { count: 'exact' })

    // Добавляем фильтр по email если есть поиск
    if (search) {
      query = query.ilike('email', `%${search}%`)
    }

    // Добавляем фильтр по роли если выбрана
    if (roleFilter) {
      query = query.eq('role_id', roleFilter)
    }

    // Применяем пагинацию и сортировку
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Получаем auth данные с использованием пагинации
    let authUsersMap = new Map()
    
    try {
      const authResult = await getAuthUsers(page, limit)
      authUsersMap = authResult.authUsersMap || new Map()
    } catch (authUsersError) {
      console.error('Error fetching auth users:', authUsersError)
      // Продолжаем без auth данных вместо возврата ошибки
    }

    // Объединяем данные
    const enrichedUsers = users?.map(user => {
      const authUser = authUsersMap.get(user.id)
      return {
        ...user,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        email_confirmed_at: authUser?.email_confirmed_at || null,
        user_metadata: authUser?.user_metadata || null,
        banned_until: (authUser as any)?.banned_until || null
      }
    }) || []

    // Вычисляем метаданные пагинации
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({ 
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Проверяем аутентификацию
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, password, role_id, user_metadata } = body

    if (!email || !password || !role_id) {
      return NextResponse.json({ 
        error: 'Email, password, and role_id are required' 
      }, { status: 400 })
    }

    // Создаем пользователя через Admin API с service client
    const serviceSupabase = createServiceClient()
    const { data: newUser, error: createError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      user_metadata: user_metadata || {},
      email_confirm: true
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Добавляем пользователя в таблицу users
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert({
        id: newUser.user.id,
        email: newUser.user.email,
        role_id
      })
      .select(`
        id,
        email,
        created_at,
        updated_at,
        roles (
          id,
          name,
          code,
          active
        )
      `)
      .single()

    if (userError) {
      console.error('Error creating user record:', userError)
      // Удаляем пользователя из auth если не удалось создать запись
      await serviceSupabase.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 })
    }

    return NextResponse.json({ user: userRecord }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 