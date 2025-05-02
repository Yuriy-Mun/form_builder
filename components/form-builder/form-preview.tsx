import React, { useState, useEffect } from 'react';
import { FormField } from './form-field-editor';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormPreviewProps {
  formName: string;
  formDescription?: string;
  fields: FormField[];
  onClose: () => void;
}

export function FormPreview({ formName, formDescription, fields, onClose }: FormPreviewProps) {
  // State to track field values for conditional logic
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  
  // Инициализация полей со значениями по умолчанию при первой загрузке
  useEffect(() => {
    // Инициализируем значения по умолчанию для селекторов и других полей
    const initialValues: Record<string, any> = {};
    
    fields.forEach(field => {
      // Для всех полей изначально устанавливаем пустое значение
      if (field.type === 'select' || field.type === 'radio') {
        initialValues[field.id] = '';
      } else if (field.type === 'checkbox') {
        initialValues[field.id] = [];
      } else {
        // Для text, textarea, date и других типов
        initialValues[field.id] = '';
      }
    });
    
    setFieldValues(initialValues);
  }, [fields]);

  // Helper function to check if a field should be displayed based on conditional logic
  const shouldShowField = (field: FormField): boolean => {
    if (!field.conditional_logic || !field.conditional_logic.dependsOn) {
      return true; // No conditional logic, always show
    }

    const { dependsOn, condition = 'equals', value } = field.conditional_logic;
    
    // If dependsOn is set to "none", always show the field
    if (dependsOn === "none") {
      return true;
    }
    
    const dependentValue = fieldValues[dependsOn];
    
    // Для отладки
    console.log(`Checking field "${field.label}" with condition:`, {
      dependsOn,
      dependOnField: fields.find(f => f.id === dependsOn)?.label,
      condition,
      expectedValue: value,
      actualValue: dependentValue
    });

    // Если родительское поле не имеет значения или значение пустое, скрываем зависимое поле
    if (dependentValue === undefined || dependentValue === '') {
      return false;
    }

    // Строгое сравнение значений для корректной работы условной логики
    let result = false;
    switch (condition) {
      case 'equals':
        result = String(dependentValue).toLowerCase() === String(value).toLowerCase();
        break;
      case 'not_equals':
        result = String(dependentValue).toLowerCase() !== String(value).toLowerCase();
        break;
      case 'contains':
        result = typeof dependentValue === 'string' && dependentValue.toLowerCase().includes((value || '').toLowerCase());
        break;
      case 'not_contains':
        result = typeof dependentValue === 'string' && !dependentValue.toLowerCase().includes((value || '').toLowerCase());
        break;
      default:
        console.warn(`Unknown condition type: ${condition}, defaulting to false`);
        result = false;
    }
    
    console.log(`Field "${field.label}" display result:`, result);
    return result;
  };

  // Update field values for conditional logic
  const handleFieldChange = (fieldId: string, value: any) => {
    console.log(`Field ${fieldId} changed to: ${value}`);
    
    // Обновляем значение текущего поля
    setFieldValues(prev => {
      const newValues = {
        ...prev,
        [fieldId]: value
      };
      
      // Когда значение поля меняется, нужно очистить значения всех зависимых полей
      fields.forEach(field => {
        // Находим поля, которые зависят от текущего
        if (field.conditional_logic && field.conditional_logic.dependsOn === fieldId) {
          const condition = field.conditional_logic.condition || 'equals';
          const conditionValue = field.conditional_logic.value || '';
          
          let shouldShow = false;
          switch (condition) {
            case 'equals':
              shouldShow = String(value).toLowerCase() === String(conditionValue).toLowerCase();
              break;
            case 'not_equals':
              shouldShow = String(value).toLowerCase() !== String(conditionValue).toLowerCase();
              break;
            case 'contains':
              shouldShow = typeof value === 'string' && value.toLowerCase().includes(conditionValue.toLowerCase());
              break;
            case 'not_contains':
              shouldShow = typeof value === 'string' && !value.toLowerCase().includes(conditionValue.toLowerCase());
              break;
            default:
              console.warn(`Unknown condition type: ${condition}, defaulting to false`);
              shouldShow = false;
          }
          
          console.log(`Field "${field.label}" should show with value "${value}": ${shouldShow}`);
          
          // Если условие не выполняется, очищаем значение
          if (!shouldShow) {
            // Очищаем значение зависимого поля
            newValues[field.id] = field.type === 'checkbox' ? [] : '';
            
            // Также нужно очистить поля, которые зависят от этого поля (каскадная зависимость)
            fields.forEach(subField => {
              if (subField.conditional_logic && subField.conditional_logic.dependsOn === field.id) {
                newValues[subField.id] = subField.type === 'checkbox' ? [] : '';
              }
            });
          }
        }
      });
      
      return newValues;
    });
  };
  
  // Инициализируем форму - для отладки выводим значения в консоль
  useEffect(() => {
    console.log('Current field values:', fieldValues);
  }, [fieldValues]);
  
  // Сортируем поля, чтобы сначала были поля без зависимостей
  const orderedFields = [...fields].sort((a, b) => {
    const aHasCondition = a.conditional_logic && a.conditional_logic.dependsOn;
    const bHasCondition = b.conditional_logic && b.conditional_logic.dependsOn;
    
    if (aHasCondition && !bHasCondition) return 1;
    if (!aHasCondition && bHasCondition) return -1;
    return 0;
  });

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{formName}</CardTitle>
          {formDescription && <p className="text-gray-500 mt-2">{formDescription}</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No fields have been added to this form yet.
            </div>
          ) : (
            orderedFields.map((field) => {
              // Check if field should be displayed based on conditional logic
              if (!shouldShowField(field)) {
                return null;
              }

              return (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <Label className="text-base font-medium" htmlFor={field.id}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                  </div>
                  
                  {field.type === 'text' && (
                    <Input
                      id={field.id}
                      placeholder={field.placeholder}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      value={fieldValues[field.id] || ''}
                    />
                  )}
                  
                  {field.type === 'textarea' && (
                    <Textarea
                      id={field.id}
                      placeholder={field.placeholder}
                      className="min-h-[100px]"
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      value={fieldValues[field.id] || ''}
                    />
                  )}
                  
                  {field.type === 'select' && (
                    <Select 
                      onValueChange={(value) => handleFieldChange(field.id, value)}
                      value={fieldValues[field.id] || ''}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || "Select an option"} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option, index) => (
                          <SelectItem key={index} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {field.type === 'radio' && (
                    <div className="space-y-2">
                      {field.options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div 
                            className="h-4 w-4 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer"
                            onClick={() => handleFieldChange(field.id, option)}
                          >
                            {fieldValues[field.id] === option && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <Label 
                            className="cursor-pointer"
                            onClick={() => handleFieldChange(field.id, option)}
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {field.type === 'checkbox' && (
                    <div className="space-y-2">
                      {field.options?.map((option, index) => {
                        const isChecked = Array.isArray(fieldValues[field.id]) 
                          ? fieldValues[field.id]?.includes(option) 
                          : false;
                        
                        return (
                          <div key={index} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`${field.id}-${index}`} 
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const currentValues = Array.isArray(fieldValues[field.id]) 
                                  ? [...fieldValues[field.id]] 
                                  : [];
                                
                                if (checked) {
                                  handleFieldChange(field.id, [...currentValues, option]);
                                } else {
                                  handleFieldChange(field.id, currentValues.filter(v => v !== option));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`${field.id}-${index}`}
                              className="cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {field.type === 'date' && (
                    <Input
                      id={field.id}
                      type="date"
                      placeholder={field.placeholder}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      value={fieldValues[field.id] || ''}
                    />
                  )}
                </div>
              );
            })
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t p-4">
          <Button onClick={onClose}>
            Close Preview
          </Button>
        </CardFooter>
        
        {/* Отладочная информация - в продакшене нужно убрать */}
        <div className="mt-4 p-4 border-t text-xs">
          <details>
            <summary className="cursor-pointer font-bold mb-2">Debug Info</summary>
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-52">
              {JSON.stringify({ fieldValues }, null, 2)}
            </pre>
            
            <h4 className="font-bold mt-3 mb-1">Conditional Fields:</h4>
            <ul className="ml-2 space-y-1">
              {fields.filter(f => f.conditional_logic && f.conditional_logic.dependsOn).map(field => (
                <li key={field.id} className="border-l-2 pl-2">
                  <div><strong>{field.label}</strong> показывается, если:</div>
                  <div className="ml-2">
                    <span>Поле <strong>{fields.find(f => f.id === field.conditional_logic?.dependsOn)?.label || 'Unknown'}</strong></span>
                    <span> {field.conditional_logic?.condition === 'equals' ? 'равно' : 
                           field.conditional_logic?.condition === 'not_equals' ? 'не равно' :
                           field.conditional_logic?.condition === 'contains' ? 'содержит' : 'не содержит'} </span>
                    <span><strong>"{field.conditional_logic?.value}"</strong></span>
                    <div className="text-gray-500">
                      Текущее значение: <strong>{JSON.stringify(fieldValues[field.conditional_logic?.dependsOn || ''])}</strong>
                      <span className="ml-2">
                        Результат: <span className={shouldShowField(field) ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                          {shouldShowField(field) ? "ПОКАЗАНО" : "СКРЫТО"}
                        </span>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            <h4 className="font-bold mt-3 mb-1">Все поля:</h4>
            <ul className="ml-2 space-y-1">
              {fields.map(field => (
                <li key={field.id} className="border-l-2 pl-2">
                  <div>
                    <strong>{field.label}</strong> (ID: {field.id})
                    <span className="text-sm text-gray-500 ml-2">(тип: {field.type})</span>
                  </div>
                  {field.options && (
                    <div className="ml-2 text-gray-600">
                      Опции: {field.options.join(', ')}
                    </div>
                  )}
                  {field.conditional_logic && field.conditional_logic.dependsOn && (
                    <div className="ml-2 text-gray-600 italic">
                      Зависит от: {fields.find(f => f.id === field.conditional_logic?.dependsOn)?.label} 
                      ({field.conditional_logic.condition} "{field.conditional_logic.value}")
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </Card>
    </div>
  );
} 