# SupaNext

Next.js проект с интеграцией Supabase и UI компонентами от Shadcn.

## Начало работы

### Предварительные требования
- [Bun](https://bun.sh/) - пакетный менеджер и среда выполнения
- [Node.js](https://nodejs.org/) (рекомендуется версия 18 или выше)
- Учетная запись [Supabase](https://supabase.com/)

### Установка

1. Клонируйте репозиторий:
```bash
git clone <ссылка-на-репозиторий>
cd supanext
```

2. Установите зависимости:
```bash
bun install
```

3. Создайте файл окружения `.env.local` и добавьте следующие переменные:
```
NEXT_PUBLIC_SUPABASE_URL=ваш-url-supabase-проекта
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-анонимный-ключ-supabase
```

Вы можете получить эти данные из панели управления Supabase.


### Создание структуры базы данных и администратора

Для настройки учетной записи администратора:
```bash
bun run setup-admin
```


### Запуск приложения

Для запуска приложения в режиме разработки:
```bash
bun dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

Следуйте инструкциям в интерактивном режиме.

## Структура проекта

- `/app` - Основные компоненты и страницы приложения
- `/components` - Переиспользуемые UI компоненты
- `/lib` - Утилиты и вспомогательные функции
- `/hooks` - React-хуки
- `/supabase` - Файлы конфигурации Supabase
- `/scripts` - Скрипты для управления БД и настройки окружения

## Использование Supabase в проекте

### В клиентских компонентах:
```typescript
// Клиентский компонент
import { supabase } from '@/lib/supabase';

// Пример запроса
const { data, error } = await supabase
  .from('your_table')
  .select('*');
```

### В серверных компонентах:
```typescript
// Серверный компонент
import { createServerClient } from '@/lib/supabase-server';

export async function YourServerComponent() {
  const supabase = createServerClient();
  const { data } = await supabase.from('your_table').select('*');
  
  return <div>{/* Используйте ваши данные */}</div>
}
```

## Схема базы данных

Проект использует следующие таблицы:

1. **Permissions** - Определяет доступные разрешения
   - `id`: UUID (первичный ключ)
   - `name`: VARCHAR (обязательное)
   - `slug`: VARCHAR (обязательное, уникальное)
   - `created_at`: TIMESTAMP
   - `updated_at`: TIMESTAMP

2. **Roles** - Определяет роли пользователей
   - `id`: UUID (первичный ключ)
   - `name`: VARCHAR (обязательное)
   - `code`: VARCHAR (обязательное, уникальное)
   - `active`: BOOLEAN (по умолчанию true)
   - `created_at`: TIMESTAMP
   - `updated_at`: TIMESTAMP

3. **Roles_Permissions** - Связывает роли с разрешениями (многие-ко-многим)
   - `id`: UUID (первичный ключ)
   - `role_id`: UUID (внешний ключ к roles.id)
   - `permission_id`: UUID (внешний ключ к permissions.id)
   - `created_at`: TIMESTAMP
   - `updated_at`: TIMESTAMP

## UI Компоненты

Проект использует [Shadcn/UI](https://ui.shadcn.com/) для компонентов интерфейса. Эти компоненты построены на основе Radix UI и Tailwind CSS.

Для установки нового компонента используйте:
```bash
bunx shadcn-ui@latest add <имя-компонента>
```

## Сборка для продакшн

Для создания production-сборки:
```bash
bun run build
```

Для запуска production-версии:
```bash
bun run start
```

## Дополнительная информация

- [Документация Next.js](https://nextjs.org/docs)
- [Документация Supabase](https://supabase.com/docs)
- [Документация Shadcn/UI](https://ui.shadcn.com/docs)
