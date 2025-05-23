# Реализация условной логики в формах

## Выполненные изменения

### 1. Обновление компонента ThemedFormRenderer

**Файл:** `components/form-builder/themed-form-renderer.tsx`

**Изменения:**
- Исправлена логика обработки условной видимости полей
- Добавлена поддержка всех типов условий: equals, not_equals, contains, not_contains, greater_than, less_than, is_empty, is_not_empty
- Исправлена инициализация видимости полей (поля с условной логикой скрыты по умолчанию)
- Добавлена поддержка действий show/hide
- Улучшена обработка различных типов данных (строки, числа, массивы)

**Ключевые функции:**
```typescript
// Инициализация видимости
const initialVisibility: Record<string, boolean> = {};
fields.forEach(field => {
  if (field.conditional_logic && field.conditional_logic.enabled && field.conditional_logic.depends_on) {
    initialVisibility[field.id] = false; // Скрыто по умолчанию
  } else {
    initialVisibility[field.id] = true; // Всегда видимо
  }
});

// Обработка условий
switch (condition) {
  case 'equals':
    conditionMet = parentValue === value;
    break;
  case 'not_equals':
    conditionMet = parentValue !== value;
    break;
  // ... другие условия
}

// Применение действия
if (action === 'show') {
  newVisibility[field.id] = conditionMet;
} else if (action === 'hide') {
  newVisibility[field.id] = !conditionMet;
}
```

### 2. Улучшение панели свойств формы

**Файл:** `components/form-builder/form-properties-panel.tsx`

**Изменения:**
- Добавлена умная логика выбора значений для условий
- Для полей с опциями (select, radio, checkbox) показывается выпадающий список с доступными значениями
- Для числовых полей используется input type="number"
- Улучшен пользовательский интерфейс секции условной логики

**Ключевые функции:**
```typescript
// Умный выбор типа поля для значения
{(() => {
  const parentField = useFormFieldsStore.getState().formFields
    .find(f => f.id === selectedField?.conditional_logic?.depends_on);
  
  if (parentField && ['select', 'radio', 'checkbox', 'multiselect'].includes(parentField.type) && parentField.options) {
    // Показать выпадающий список с опциями
    return <Select>...</Select>;
  }
  
  // Показать обычное поле ввода
  return <Input type={parentField?.type === 'number' ? 'number' : 'text'} />;
})()}
```

### 3. Создание тестовых данных

**База данных:** Добавлена тестовая форма с примерами условной логики

**Структура тестовой формы:**
- Поле выбора роли (Student/Teacher/Administrator)
- Условные поля для каждой роли
- Поле выбора поддержки (Yes/No)
- Условное поле описания поддержки
- Всегда видимое поле имени

**ID тестовой формы:** `bcc019c5-84c4-4160-b40c-789df3afab67`

### 4. Структура данных условной логики

**Формат JSON в базе данных:**
```json
{
  "enabled": true,
  "action": "show",
  "depends_on": "parent-field-uuid",
  "condition": "equals",
  "value": "target-value"
}
```

**Поддерживаемые параметры:**
- `enabled` (boolean) - включена ли условная логика
- `action` (string) - "show" или "hide"
- `depends_on` (string) - UUID родительского поля
- `condition` (string) - тип условия
- `value` (string) - значение для сравнения

## Поддерживаемые условия

1. **equals** - точное совпадение
2. **not_equals** - не равно
3. **contains** - содержит (для текста и массивов)
4. **not_contains** - не содержит
5. **greater_than** - больше (для чисел)
6. **less_than** - меньше (для чисел)
7. **is_empty** - пустое значение
8. **is_not_empty** - не пустое значение

## Поддерживаемые типы полей

Условная логика работает со всеми типами полей:
- Текстовые: text, email, url, tel, textarea
- Числовые: number
- Выбор: select, radio, checkbox
- Переключатели: switch
- Дата/время: date, time
- Файлы: file

## Тестирование

### URL для тестирования:
- **Публичная форма:** http://localhost:3000/forms/bcc019c5-84c4-4160-b40c-789df3afab67
- **Редактор формы:** http://localhost:3000/admin/forms/edit/bcc019c5-84c4-4160-b40c-789df3afab67

### Сценарии тестирования:
1. Выберите "Student" в поле роли → должно появиться поле "Student ID"
2. Выберите "Teacher" в поле роли → должно появиться поле "Department"
3. Выберите "Administrator" в поле роли → должно появиться поле "Years of Experience"
4. Выберите "Yes" в поле поддержки → должно появиться поле описания
5. Выберите "No" в поле поддержки → поле описания должно скрыться

## Файлы документации

1. **CONDITIONAL_LOGIC_GUIDE.md** - подробное руководство пользователя
2. **CONDITIONAL_LOGIC_IMPLEMENTATION.md** - техническая документация изменений

## Следующие шаги

1. Тестирование всех сценариев условной логики
2. Добавление поддержки множественных условий (AND/OR)
3. Реализация условной обязательности полей
4. Добавление предварительного просмотра логики в редакторе
5. Создание визуального конструктора условий 