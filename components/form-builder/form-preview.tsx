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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Star, StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Add a helper component to display field help text
  const FieldHelpText = ({ field }: { field: FormField }) => {
    if (!field.help_text) return null;
    
    return (
      <div className="text-sm text-gray-500 mt-1">{field.help_text}</div>
    );
  };

  // Helper function to validate field value based on validation rules
  const validateField = (field: FormField, value: any): string | null => {
    if (!field.validation_rules) return null;
    
    const rules = field.validation_rules;
    
    // Handle text, textarea, email, url, password
    if (['text', 'textarea', 'email', 'url', 'password'].includes(field.type)) {
      const strValue = String(value || '');
      
      if (rules.min !== undefined && strValue.length < rules.min) {
        return `Must be at least ${rules.min} characters`;
      }
      
      if (rules.max !== undefined && strValue.length > rules.max) {
        return `Cannot exceed ${rules.max} characters`;
      }
      
      if (rules.pattern && strValue) {
        try {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(strValue)) {
            return 'Invalid format';
          }
        } catch (e) {
          console.error('Invalid regex pattern:', rules.pattern);
        }
      }
      
      if (field.type === 'email' && rules.email && strValue) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(strValue)) {
          return 'Invalid email address';
        }
      }
      
      if (field.type === 'url' && rules.url && strValue) {
        try {
          new URL(strValue);
        } catch (e) {
          return 'Invalid URL';
        }
      }
    }
    
    // Handle number
    if (field.type === 'number') {
      const numValue = Number(value);
      
      if (isNaN(numValue)) {
        return 'Must be a valid number';
      }
      
      if (rules.min !== undefined && numValue < rules.min) {
        return `Must be at least ${rules.min}`;
      }
      
      if (rules.max !== undefined && numValue > rules.max) {
        return `Cannot exceed ${rules.max}`;
      }
      
      if (rules.integer && !Number.isInteger(numValue)) {
        return 'Must be a whole number';
      }
    }
    
    return null;
  };

  // Add new state to track validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Update field values for conditional logic
  const handleFieldChange = (fieldId: string, value: any) => {
    console.log(`Field ${fieldId} changed to: ${value}`);
    
    // Find the field being updated
    const field = fields.find(f => f.id === fieldId);
    
    // Validate field value if it has validation rules
    if (field) {
      const error = validateField(field, value);
      
      // Update validation errors
      setValidationErrors(prev => ({
        ...prev,
        [fieldId]: error || ''
      }));
    }
    
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
                    <>
                      <Input
                        id={field.id}
                        placeholder={field.placeholder}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        value={fieldValues[field.id] || ''}
                        className={validationErrors[field.id] ? "border-red-500" : ""}
                      />
                      <FieldHelpText field={field} />
                      {validationErrors[field.id] && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors[field.id]}</div>
                      )}
                    </>
                  )}
                  
                  {field.type === 'email' && (
                    <>
                      <Input
                        id={field.id}
                        type="email"
                        placeholder={field.placeholder || "email@example.com"}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        value={fieldValues[field.id] || ''}
                        className={validationErrors[field.id] ? "border-red-500" : ""}
                      />
                      <FieldHelpText field={field} />
                      {validationErrors[field.id] && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors[field.id]}</div>
                      )}
                    </>
                  )}

                  {field.type === 'phone' && (
                    <>
                      <Input
                        id={field.id}
                        type="tel"
                        placeholder={field.placeholder || "+1 (555) 000-0000"}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        value={fieldValues[field.id] || ''}
                        className={validationErrors[field.id] ? "border-red-500" : ""}
                      />
                      <FieldHelpText field={field} />
                      {validationErrors[field.id] && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors[field.id]}</div>
                      )}
                    </>
                  )}

                  {field.type === 'url' && (
                    <>
                      <Input
                        id={field.id}
                        type="url"
                        placeholder={field.placeholder || "https://example.com"}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        value={fieldValues[field.id] || ''}
                        className={validationErrors[field.id] ? "border-red-500" : ""}
                      />
                      <FieldHelpText field={field} />
                      {validationErrors[field.id] && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors[field.id]}</div>
                      )}
                    </>
                  )}

                  {field.type === 'password' && (
                    <>
                      <Input
                        id={field.id}
                        type="password"
                        placeholder={field.placeholder || "Enter password"}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        value={fieldValues[field.id] || ''}
                        className={validationErrors[field.id] ? "border-red-500" : ""}
                      />
                      <FieldHelpText field={field} />
                      {validationErrors[field.id] && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors[field.id]}</div>
                      )}
                    </>
                  )}

                  {field.type === 'number' && (
                    <>
                      <Input
                        id={field.id}
                        type="number"
                        placeholder={field.placeholder}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        value={fieldValues[field.id] || ''}
                        className={validationErrors[field.id] ? "border-red-500" : ""}
                      />
                      <FieldHelpText field={field} />
                      {validationErrors[field.id] && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors[field.id]}</div>
                      )}
                    </>
                  )}
                  
                  {field.type === 'textarea' && (
                    <>
                      <Textarea
                        id={field.id}
                        placeholder={field.placeholder}
                        className={cn("min-h-[100px]", validationErrors[field.id] ? "border-red-500" : "")}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        value={fieldValues[field.id] || ''}
                      />
                      <FieldHelpText field={field} />
                      {validationErrors[field.id] && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors[field.id]}</div>
                      )}
                    </>
                  )}

                  {field.type === 'rich-text' && (
                    <div className="border rounded-md p-3">
                      <div className="flex mb-2 gap-2 border-b pb-2">
                        <Button type="button" size="sm" variant="outline">B</Button>
                        <Button type="button" size="sm" variant="outline">I</Button>
                        <Button type="button" size="sm" variant="outline">U</Button>
                      </div>
                      <Textarea
                        id={field.id}
                        placeholder={field.placeholder || "Enter rich text..."}
                        className="min-h-[150px] border-none focus-visible:ring-0 p-0"
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        value={fieldValues[field.id] || ''}
                      />
                    </div>
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

                  {field.type === 'multiselect' && (
                    <div className="border rounded-md p-2">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {Array.isArray(fieldValues[field.id]) && fieldValues[field.id].map((selected: string, idx: number) => (
                          <div key={idx} className="bg-primary/10 text-primary rounded-md px-2 py-1 text-sm flex items-center">
                            {selected}
                            <button 
                              type="button" 
                              className="ml-1 text-primary/70 hover:text-primary"
                              onClick={() => {
                                const newValues = fieldValues[field.id].filter((v: string) => v !== selected);
                                handleFieldChange(field.id, newValues);
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <Select 
                        onValueChange={(value) => {
                          const currentValues = Array.isArray(fieldValues[field.id]) ? fieldValues[field.id] : [];
                          if (!currentValues.includes(value)) {
                            handleFieldChange(field.id, [...currentValues, value]);
                          }
                        }}
                        value=""
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "Select options"} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option, index) => (
                            <SelectItem key={index} value={option} disabled={
                              Array.isArray(fieldValues[field.id]) && fieldValues[field.id].includes(option)
                            }>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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

                  {field.type === 'time' && (
                    <Input
                      id={field.id}
                      type="time"
                      placeholder={field.placeholder}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      value={fieldValues[field.id] || ''}
                    />
                  )}

                  {field.type === 'datetime' && (
                    <Input
                      id={field.id}
                      type="datetime-local"
                      placeholder={field.placeholder}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      value={fieldValues[field.id] || ''}
                    />
                  )}

                  {field.type === 'file' && (
                    <div className="flex flex-col gap-2">
                      <Input
                        id={field.id}
                        type="file"
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                      {fieldValues[field.id] && (
                        <div className="text-sm text-gray-500">
                          Selected file: {fieldValues[field.id].split('\\').pop()}
                        </div>
                      )}
                    </div>
                  )}

                  {field.type === 'range' && (
                    <div className="space-y-2">
                      <Slider
                        id={field.id}
                        defaultValue={[50]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleFieldChange(field.id, value[0])}
                      />
                      <div className="text-center text-sm">
                        Value: {fieldValues[field.id] || 50}
                      </div>
                    </div>
                  )}

                  {field.type === 'color' && (
                    <div className="flex items-center gap-2">
                      <Input
                        id={field.id}
                        type="color"
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        value={fieldValues[field.id] || '#000000'}
                        className="w-12 h-10 p-1"
                      />
                      <span className="text-sm">
                        {fieldValues[field.id] || '#000000'}
                      </span>
                    </div>
                  )}

                  {field.type === 'rating' && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleFieldChange(field.id, star)}
                          className="text-gray-300 hover:text-yellow-400"
                        >
                          <StarIcon 
                            className={cn(
                              "w-6 h-6",
                              Number(fieldValues[field.id]) >= star ? "fill-yellow-400 text-yellow-400" : ""
                            )}
                          />
                        </button>
                      ))}
                      {fieldValues[field.id] && (
                        <span className="ml-2 text-sm">
                          ({fieldValues[field.id]} of 5)
                        </span>
                      )}
                    </div>
                  )}

                  {field.type === 'toggle' && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={field.id}
                        checked={Boolean(fieldValues[field.id])}
                        onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
                      />
                      <Label htmlFor={field.id}>
                        {Boolean(fieldValues[field.id]) ? 'On' : 'Off'}
                      </Label>
                    </div>
                  )}

                  {field.type === 'signature' && (
                    <div className="border rounded-md p-2 min-h-[100px] bg-gray-50 flex flex-col items-center justify-center">
                      {fieldValues[field.id] ? (
                        <div className="w-full">
                          <div className="border-b-2 border-black p-2 text-center italic">
                            {fieldValues[field.id]}
                          </div>
                          <div className="text-center">
                            <button 
                              type="button" 
                              className="text-xs mt-2 text-gray-500 hover:text-gray-700"
                              onClick={() => handleFieldChange(field.id, '')}
                            >
                              Clear signature
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-gray-500 mb-2">Click below to sign</p>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              const name = prompt("Enter your name for signature:");
                              if (name) handleFieldChange(field.id, name);
                            }}
                          >
                            Sign here
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {field.type === 'captcha' && (
                    <div className="border rounded-md p-3">
                      <div className="flex flex-col gap-2">
                        <div className="bg-gray-100 p-3 text-center">
                          <p className="text-gray-800 font-mono text-lg tracking-widest">
                            {fieldValues[field.id]?.code || 'CAPTCHA12'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter the code above"
                            onChange={(e) => {
                              const userInput = e.target.value;
                              const code = fieldValues[field.id]?.code || 'CAPTCHA12';
                              const isValid = userInput === code;
                              
                              handleFieldChange(field.id, {
                                code,
                                input: userInput,
                                isValid
                              });
                            }}
                            value={fieldValues[field.id]?.input || ''}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              // Generate a new random code
                              const newCode = 'CAPTCHA' + Math.floor(Math.random() * 100);
                              handleFieldChange(field.id, { 
                                code: newCode, 
                                input: '',
                                isValid: false
                              });
                            }}
                            className="shrink-0"
                          >
                            Refresh
                          </Button>
                        </div>
                        {fieldValues[field.id]?.input && (
                          <div className={cn(
                            "text-sm",
                            fieldValues[field.id]?.isValid ? "text-green-600" : "text-red-600"
                          )}>
                            {fieldValues[field.id]?.isValid ? 'Verified ✓' : 'Invalid code'}
                          </div>
                        )}
                      </div>
                    </div>
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