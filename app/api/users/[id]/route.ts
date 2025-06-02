import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Проверяем аутентификацию
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params

    // Получаем пользователя с его ролью и разрешениями
    const { data: userRecord, error } = await supabase
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
          active,
          roles_permissions (
            permissions (
              id,
              name,
              slug
            )
          )
        )
      `)
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('Error fetching user:', error)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    // Получаем дополнительную информацию через Admin API
    let enrichedUser = { ...userRecord }
    
    try {
      const serviceSupabase = createServiceClient()
      const { data: authUser, error: authUserError } = await serviceSupabase.auth.admin.getUserById(userId)
      
      if (authUserError) {
        console.error('Error fetching auth user:', authUserError)
      } else {
        enrichedUser = {
          ...userRecord,
          last_sign_in_at: authUser.user?.last_sign_in_at || null,
          email_confirmed_at: authUser.user?.email_confirmed_at || null,
          user_metadata: authUser.user?.user_metadata || null,
          banned_until: (authUser.user as any)?.banned_until || null
        } as any
      }
    } catch (error) {
      console.error('Error processing auth user:', error)
    }

    return NextResponse.json({ user: enrichedUser })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Проверяем аутентификацию
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params
    const body = await request.json()
    const { email, role_id, user_metadata, banned_until } = body

    // Обновляем пользователя в таблице users
    if (email || role_id) {
      const updates: any = {}
      if (email) updates.email = email
      if (role_id) updates.role_id = role_id

      const { error: userError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (userError) {
        console.error('Error updating user:', userError)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
      }
    }

    // Обновляем пользователя в auth.users через Admin API
    const authUpdates: any = {}
    if (email) authUpdates.email = email
    if (user_metadata) authUpdates.user_metadata = user_metadata
    if (banned_until !== undefined) authUpdates.ban_duration = banned_until

    if (Object.keys(authUpdates).length > 0) {
      const serviceSupabase = createServiceClient()
      const { error: authUpdateError } = await serviceSupabase.auth.admin.updateUserById(
        userId,
        authUpdates
      )

      if (authUpdateError) {
        console.error('Error updating auth user:', authUpdateError)
        return NextResponse.json({ error: 'Failed to update user authentication data' }, { status: 500 })
      }
    }

    // Получаем обновленного пользователя
    const { data: updatedUser, error: fetchError } = await supabase
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
      `)
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated user:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch updated user' }, { status: 500 })
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Проверяем аутентификацию
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params

    // Проверяем, что пользователь существует
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('Error checking user:', checkError)
      return NextResponse.json({ error: 'Failed to check user' }, { status: 500 })
    }

    // Удаляем пользователя из таблицы users (каскадное удаление)
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteUserError) {
      console.error('Error deleting user record:', deleteUserError)
      return NextResponse.json({ error: 'Failed to delete user record' }, { status: 500 })
    }

    // Удаляем пользователя из auth.users через Admin API
    const serviceSupabase = createServiceClient()
    const { error: deleteAuthError } = await serviceSupabase.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      // Не возвращаем ошибку, так как запись в users уже удалена
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 