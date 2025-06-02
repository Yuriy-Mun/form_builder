# Исправление дублирования запросов

## Проблема

В приложении наблюдалось дублирование API запросов, что приводило к:
- Избыточной нагрузке на сервер
- Замедлению работы приложения
- Неэффективному использованию ресурсов

## Причины дублирования

1. **React.StrictMode в development** - Next.js 15 по умолчанию включает StrictMode, который вызывает двойное выполнение эффектов
2. **Неправильная структура зависимостей в useCallback**
3. **Отсутствие защиты от множественных одновременных запросов**
4. **Дублирование логики загрузки в разных компонентах**

## Решения

### 1. Отключение React.StrictMode в development

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    dynamicIO: true,
  },
  // Отключаем React.StrictMode в development для избежания дублирования запросов
  reactStrictMode: false,
};
```

### 2. Улучшенные хуки API с защитой от дублирования

```typescript
// hooks/useApi.ts
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: { debounceMs?: number; cacheKey?: string } = {}
) {
  // Защита от дублирования через:
  // - Проверку смонтированности компонента
  // - Дебаунсинг запросов
  // - Глобальный кеш запросов
  // - Уникальные идентификаторы вызовов
}
```

### 3. Глобальный кеш запросов

```typescript
// Предотвращает дублирование одинаковых запросов
const requestCache = new Map<string, Promise<any>>()

// Автоматическая очистка кеша через 5 секунд
setTimeout(() => {
  requestCache.delete(cacheKey)
}, 5000)
```

### 4. Защита в Zustand хранилищах

```typescript
// lib/store/form-meta-store.ts
fetchForm: async (formId: string) => {
  const { isLoading, lastFetchedFormId } = get();
  
  // Предотвращаем дублирование запросов
  if (isLoading || lastFetchedFormId === formId) {
    return;
  }
  
  set({ loading: true, error: null, isLoading: true });
  // ... остальная логика
}
```

### 5. Автоматическая очистка кеша при мутациях

```typescript
export function useCreateForm() {
  return useMutation(async (params: any) => {
    const result = await apiClient.forms.create(params)
    clearCache('forms-list') // Очищаем связанный кеш
    return result
  })
}
```

## Мониторинг

### Dev Toolbar

В development режиме доступен Dev Toolbar с информацией о:
- Количестве закешированных запросов
- Возможности ручной очистки кеша
- Статистике использования кеша

### Использование

1. Откройте приложение в development режиме
2. В правом нижнем углу появится кнопка "Dev Tools"
3. Нажмите на неё для просмотра статистики кеша
4. Используйте кнопку очистки для сброса кеша при необходимости

## Результаты

После применения исправлений:
- ✅ Устранено дублирование запросов
- ✅ Улучшена производительность приложения
- ✅ Снижена нагрузка на сервер
- ✅ Добавлен мониторинг кеша запросов

## Рекомендации

1. **Всегда используйте cacheKey** для часто повторяющихся запросов
2. **Очищайте кеш** после мутаций, которые могут изменить данные
3. **Мониторьте размер кеша** в development режиме
4. **Тестируйте** приложение без дублирования запросов

## Файлы, которые были изменены

- `next.config.ts` - отключение React.StrictMode
- `hooks/useApi.ts` - улучшенные хуки с защитой от дублирования
- `lib/store/form-meta-store.ts` - защита в хранилище форм
- `lib/store/form-fields-store.ts` - защита в хранилище полей
- `components/stagewise-toolbar.tsx` - dev toolbar для мониторинга
- `lib/cache.ts` - исправление колонки order_index → position 