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
import { createServerComponentClient } from '@/lib/supabase/server';

export async function YourServerComponent() {
  const supabase = await createServerComponentClient();
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

# Form Builder

## Word Import Feature

The application now includes a feature to import form questions from Word documents. This feature uses Claude 3 Sonnet (latest version) to parse and structure the form questions.

### Features

- Upload Word documents (.doc or .docx) containing form questions
- Real-time status updates during processing with a live progress stream
- Automatic extraction of form fields, including:
  - Field types (text, textarea, radio, checkbox, select, date)
  - Required validation
  - Options for multiple choice questions
  - Conditional logic between questions

### Setup

1. Obtain a Claude API key from Anthropic (https://console.anthropic.com/)
2. Create a `.env.local` file in the project root (or update your existing one) and add:
   ```
   CLAUDE_API_KEY=your_api_key_here
   ```
3. Install the dependencies (if not already done):
   ```
   bun install
   ```

### Usage

1. Navigate to the Forms page in the admin panel
2. Click the "Import from Word" button
3. In the dialog that appears, upload a Word document (.doc or .docx) containing your form questions
4. Watch the real-time processing status as the document is analyzed
5. After processing, you'll be taken to a page to provide form details (title, description, etc.)
6. Review and edit the extracted fields as needed
7. Save the form

### Document Structure Recommendations

For best results, format your Word document with:
- Clear question texts
- One question per paragraph or section
- For multiple choice questions, list options clearly
- For conditional questions, include clear references to the questions they depend on

Example:
```
1. What is your full name?

2. What is your age?

3. What is your preferred contact method?
   - Email
   - Phone
   - Mail

4. If you selected "Email" above, please provide your email address:

5. How would you rate our service on a scale of 1-5?
   1 - Poor
   2 - Below Average
   3 - Average
   4 - Good
   5 - Excellent
```
