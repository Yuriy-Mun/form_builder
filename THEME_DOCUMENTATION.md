# Документация по темам форм

## Обзор

Система тем форм позволяет настраивать внешний вид публичных форм в соответствии с брендом. Поддерживаются различные цветовые схемы, стили и макеты.

## Компоненты

### 1. `useFormTheme` Hook

Хук для применения настроек темы к форме.

```typescript
import { useFormTheme } from '@/hooks/use-form-theme';

const { primaryColor, formTheme, layout } = useFormTheme({ 
  themeSettings: {
    primaryColor: '#4f46e5',
    formTheme: 'modern',
    layout: 'default'
  }
});
```

### 2. `ThemedFormWrapper` Component

Компонент-обертка для применения темы к форме.

```typescript
import { ThemedFormWrapper } from '@/components/form-builder/themed-form-wrapper';

<ThemedFormWrapper themeSettings={themeSettings}>
  {/* Содержимое формы */}
</ThemedFormWrapper>
```

### 3. `ThemedFormRenderer` Component

Основной компонент для рендеринга формы с поддержкой темы.

```typescript
import { ThemedFormRenderer } from '@/components/form-builder/themed-form-renderer';

<ThemedFormRenderer form={form} fields={fields} />
```

### 4. `ThemePreview` Component

Компонент предварительного просмотра темы.

```typescript
import { ThemePreview } from '@/components/form-builder/theme-preview';

<ThemePreview themeSettings={themeSettings} />
```

## Настройки темы

### Цветовая палитра

Поддерживаемые цвета:
- **Indigo** (#4f46e5) - Профессиональный и надежный
- **Blue** (#0ea5e9) - Спокойный и надежный  
- **Emerald** (#10b981) - Свежий и позитивный
- **Amber** (#f59e0b) - Теплый и энергичный
- **Rose** (#ef4444) - Смелый и привлекающий внимание
- **Purple** (#8b5cf6) - Креативный и современный
- **Teal** (#14b8a6) - Сбалансированный и изысканный
- **Orange** (#f97316) - Яркий и дружелюбный

### Стили форм

#### Default
- Чистый и минималистичный дизайн
- Стандартные скругленные углы
- Базовые тени

#### Modern
- Современный дизайн с большими скруглениями
- Градиентные фоны
- Расширенные тени и эффекты
- Анимации при наведении

#### Classic
- Традиционный стиль форм
- Прямые углы
- Минимальные тени
- Консервативный подход

#### Gradient
- Красочные градиентные акценты
- Динамические фоны
- Плавные переходы цветов

### Макеты

#### Default (Single Column)
- Поля расположены вертикально
- Максимальная ширина: 2xl (672px)
- Стандартные отступы

#### Two Column
- Поля в две колонки на больших экранах
- Максимальная ширина: 4xl (896px)
- Адаптивный дизайн

#### Compact
- Минимальные отступы
- Максимальная ширина: md (448px)
- Компактное расположение элементов

## CSS переменные

Система использует CSS переменные для динамического применения цветов:

```css
:root {
  --form-primary-color: var(--color-indigo-500);
  --form-primary-color-hover: var(--color-indigo-600);
  --form-primary-color-light: var(--color-indigo-50);
  --form-primary-color-dark: var(--color-indigo-900);
}
```

## Структура базы данных

Настройки темы хранятся в поле `theme_settings` таблицы `forms`:

```sql
ALTER TABLE forms ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{
  "primaryColor": "#4f46e5", 
  "formTheme": "default", 
  "layout": "default"
}';
```

## Использование в проекте

### 1. Настройка темы в админке

```typescript
// В компоненте редактирования формы
import { ThemeTab } from '@/components/form-builder/theme-tab';

<ThemeTab />
```

### 2. Применение темы на публичной странице

```typescript
// В публичной странице формы
import { ThemedFormRenderer } from '@/components/form-builder/themed-form-renderer';

export default function PublicFormPage({ form, fields }) {
  return <ThemedFormRenderer form={form} fields={fields} />;
}
```

### 3. Предварительный просмотр

```typescript
// В настройках темы
import { ThemePreview } from '@/components/form-builder/theme-preview';

<ThemePreview themeSettings={currentSettings} />
```

## Технические детали

### Tailwind CSS v4

Проект использует Tailwind CSS v4 с новым синтаксисом `@theme`:

```css
@theme {
  --color-primary: var(--form-primary-color);
}
```

### React 19 и Next.js 15

- Использование новых хуков React 19
- Server Components для оптимизации производительности
- Современные паттерны Next.js 15

### Анимации

Используется Framer Motion для плавных анимаций:
- Появление полей формы
- Переходы между состояниями
- Анимация успешной отправки

## Расширение функциональности

### Добавление нового цвета

1. Добавьте цвет в `colorPalettes` в `theme-tab.tsx`
2. Обновите `colorMappings` в `use-form-theme.ts`
3. Добавьте соответствующие CSS переменные

### Добавление нового стиля

1. Добавьте стиль в `formThemes` в `theme-tab.tsx`
2. Обновите функции `getFieldClasses`, `getButtonClasses`, `getCardClasses`
3. Добавьте CSS стили в `globals.css`

### Добавление нового макета

1. Добавьте макет в `layoutOptions` в `theme-tab.tsx`
2. Обновите логику в `ThemedFormWrapper`
3. Добавьте соответствующие CSS классы

## Производительность

- CSS переменные применяются динамически без перезагрузки страницы
- Компоненты оптимизированы для минимального количества ре-рендеров
- Использование `useCallback` и `useMemo` для оптимизации

## Совместимость

- Поддержка всех современных браузеров
- Адаптивный дизайн для мобильных устройств
- Поддержка темной темы (при необходимости)

## Отладка

Для отладки тем используйте:

```javascript
// Проверка применения CSS переменных
console.log(getComputedStyle(document.documentElement).getPropertyValue('--form-primary-color'));

// Проверка атрибутов темы
console.log(document.documentElement.getAttribute('data-form-theme'));
``` 