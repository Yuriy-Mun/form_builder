import { createBrowserClient } from '@supabase/ssr'

// Синглтон для Supabase клиента, чтобы избежать создания нескольких экземпляров
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Получает или создает клиент Supabase
 */
export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;
  
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  return supabaseClient;
};

/**
 * Проверяет, авторизован ли пользователь
 */
export const isUserAuthenticated = async () => {
  const supabase = getSupabaseClient();
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return !error && !!user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Получает данные текущего пользователя
 */
export const getCurrentUser = async () => {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return user;
}; 