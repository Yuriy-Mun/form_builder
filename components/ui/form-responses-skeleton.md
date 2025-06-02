# Form Responses Skeleton Components

Коллекция красивых skeleton компонентов для страницы ответов формы с анимациями и адаптивным дизайном.

## Компоненты

### `FormResponsesSkeleton`
Основной skeleton компонент для десктопной версии страницы ответов формы.

**Особенности:**
- Полная структура страницы (заголовок, фильтры, таблица, пагинация, статистика)
- Shimmer анимации для основных элементов
- Staggered анимации появления
- Hover эффекты на строках таблицы

**Использование:**
```tsx
import { FormResponsesSkeleton } from '@/components/ui/form-responses-skeleton';

<Suspense fallback={<FormResponsesSkeleton />}>
  <ResponsesComponent />
</Suspense>
```

### `MobileFormResponsesSkeleton`
Skeleton компонент, оптимизированный для мобильных устройств.

**Особенности:**
- Карточный layout вместо таблицы
- Компактный заголовок
- Мобильная пагинация
- Оптимизированные размеры для touch интерфейса

**Использование:**
```tsx
import { MobileFormResponsesSkeleton } from '@/components/ui/form-responses-skeleton';

<Suspense fallback={<MobileFormResponsesSkeleton />}>
  <ResponsesComponent />
</Suspense>
```

### `CompactFormResponsesSkeleton`
Компактная версия skeleton для ограниченного пространства.

**Особенности:**
- Минимальный заголовок
- Упрощенная таблица
- Быстрые анимации
- Меньше элементов

**Использование:**
```tsx
import { CompactFormResponsesSkeleton } from '@/components/ui/form-responses-skeleton';

<Suspense fallback={<CompactFormResponsesSkeleton />}>
  <ResponsesComponent />
</Suspense>
```

### `ResponsiveFormResponsesSkeleton` (Рекомендуется)
Адаптивный skeleton, который автоматически выбирает подходящий вариант.

**Особенности:**
- Автоматическое переключение между desktop и mobile версиями
- Реагирует на изменение размера окна
- Breakpoint: 768px

**Использование:**
```tsx
import { ResponsiveFormResponsesSkeleton } from '@/components/ui/form-responses-skeleton';

<Suspense fallback={<ResponsiveFormResponsesSkeleton />}>
  <ResponsesComponent />
</Suspense>
```

### `EmptyFormResponsesSkeleton`
Skeleton для состояния "нет данных".

**Особенности:**
- Центрированная иллюстрация с анимацией
- Плавающие декоративные элементы
- Placeholder для действий
- Статистические карточки с пунктирными границами

**Использование:**
```tsx
import { EmptyFormResponsesSkeleton } from '@/components/ui/form-responses-skeleton';

{responses.length === 0 ? (
  <EmptyFormResponsesSkeleton />
) : (
  <ResponsesTable responses={responses} />
)}
```

## Анимации

### Shimmer Effect
Используется для имитации загрузки контента:
```tsx
const shimmerVariants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: "linear"
    }
  }
};
```

### Staggered Animations
Элементы появляются последовательно:
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};
```

### Pulse Animation
Для привлечения внимания к важным элементам:
```tsx
const pulseVariants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: "reverse",
      duration: 1.5,
      ease: "easeInOut"
    }
  }
};
```

## Кастомизация

### Цвета
Skeleton компоненты используют CSS переменные темы:
- `bg-muted` - основной цвет skeleton
- `bg-primary/20` - акцентный цвет для анимаций
- `bg-secondary/20` - вторичный цвет

### Размеры
Все размеры настраиваются через Tailwind классы:
```tsx
<Skeleton className="h-8 w-64" /> // Заголовок
<Skeleton className="h-4 w-48" /> // Подзаголовок
<Skeleton className="h-3 w-full" /> // Строка таблицы
```

### Анимации
Скорость и тип анимаций можно настроить:
```tsx
transition: {
  duration: 0.5,        // Скорость
  ease: "easeOut",      // Тип easing
  delay: 0.1            // Задержка
}
```

## Зависимости

- `framer-motion` - для анимаций
- `@/components/ui/skeleton` - базовый skeleton компонент
- `@/components/ui/card` - карточки
- `@/components/ui/button` - кнопки
- `lucide-react` - иконки

## Производительность

- Все анимации оптимизированы для 60fps
- Используется `transform` вместо изменения layout свойств
- Анимации автоматически останавливаются при unmount компонента
- Responsive skeleton использует `useEffect` с cleanup для event listeners

## Accessibility

- Skeleton элементы имеют правильную семантику
- Анимации учитывают `prefers-reduced-motion`
- Keyboard navigation сохраняется через disabled кнопки
- Screen readers корректно интерпретируют loading состояние 