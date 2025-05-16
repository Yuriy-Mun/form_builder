"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';

interface FormFieldOption {
  label: string;
  value: string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: FormFieldOption[];
  validation_rules?: any;
  conditional_logic?: any;
}

interface FormValues {
  [key: string]: any;
}

interface PublicFormRendererProps {
  form: any;
  fields: FormField[];
}

export function PublicFormRenderer({ form, fields }: PublicFormRendererProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  
  // Создаем начальные значения для формы
  const getDefaultValues = useCallback(() => {
    const values: FormValues = {};
    
    fields.forEach(field => {
      if (field.type === 'checkbox') {
        values[field.id] = [];
      } else if (['switch', 'toggle'].includes(field.type)) {
        values[field.id] = false;
      } else {
        values[field.id] = '';
      }
    });
    
    return values;
  }, [fields]);
  
  // Создаем пользовательскую функцию валидации
  const validateField = (field: FormField, value: any) => {
    // Пропускаем валидацию для скрытых полей
    if (!visibleFields[field.id]) return true;
    
    // Проверяем обязательные поля
    if (field.required) {
      if (value === undefined || value === '') return `Поле "${field.label}" обязательно`;
      if (Array.isArray(value) && value.length === 0) return `Выберите хотя бы один вариант в поле "${field.label}"`;
    } else if (value === '' || value === undefined) {
      return true; // Пустое необязательное поле всегда валидно
    }
    
    // Проверяем специфичные правила валидации
    if (field.validation_rules) {
      const rules = field.validation_rules;
      
      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return 'Неверный формат email';
        }
      }
      
      if (['text', 'textarea'].includes(field.type)) {
        if (rules.min && value.length < rules.min) {
          return `Минимальная длина - ${rules.min} символов`;
        }
        if (rules.max && value.length > rules.max) {
          return `Максимальная длина - ${rules.max} символов`;
        }
      }
      
      if (field.type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return 'Введите число';
        }
        if (rules.min !== undefined && numValue < rules.min) {
          return `Значение должно быть не менее ${rules.min}`;
        }
        if (rules.max !== undefined && numValue > rules.max) {
          return `Значение должно быть не более ${rules.max}`;
        }
        if (rules.integer && !Number.isInteger(numValue)) {
          return 'Введите целое число';
        }
      }
      
      if (rules.pattern && value) {
        try {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            return 'Неверный формат';
          }
        } catch (error) {
          console.error('Неверное регулярное выражение:', rules.pattern);
        }
      }
    }
    
    return true;
  };
  
  // Создаем форму
  const form$ = useForm<FormValues>({
    defaultValues: getDefaultValues(),
    mode: 'onBlur'
  });
  
  // Предотвращаем переключение между контролируемым и неконтролируемым вводом
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (...event: any[]) => void) => {
    const value = e.target.value;
    // Если значение undefined, передаем пустую строку
    onChange(value ?? '');
  };
  
  // Регистрируем все поля с валидацией
  useEffect(() => {
    // Сначала отменяем регистрацию всех полей для избежания утечек памяти
    const fieldsToUnregister = Object.keys(form$.getValues());
    fieldsToUnregister.forEach(fieldName => {
      try {
        form$.unregister(fieldName);
      } catch (e) {
        // Игнорируем ошибки при отмене регистрации
      }
    });
    
    // Затем регистрируем поля заново с актуальной валидацией
    const initialValues = getDefaultValues();
    fields.forEach(field => {
      form$.register(field.id, {
        value: initialValues[field.id], // Устанавливаем начальное значение явно
        validate: (value) => validateField(field, value)
      });
    });
    
    // Устанавливаем начальную видимость полей
    const initialVisibility: Record<string, boolean> = {};
    fields.forEach(field => {
      initialVisibility[field.id] = !field.conditional_logic || !field.conditional_logic.dependsOn;
    });
    setVisibleFields(initialVisibility);
    
    // Очищаем форму при размонтировании
    return () => {
      fieldsToUnregister.forEach(fieldName => {
        try {
          form$.unregister(fieldName);
        } catch (e) {
          // Игнорируем ошибки при отмене регистрации
        }
      });
    };
  }, [fields]); // Убираем зависимость от form$.register
  
  // Обновление видимости полей при изменении значений
  useEffect(() => {
    const subscription = form$.watch((values) => {
      const newVisibility = { ...visibleFields };
      
      // Проверяем каждое условное поле
      fields.forEach(field => {
        if (field.conditional_logic && field.conditional_logic.dependsOn) {
          const { dependsOn, condition, value } = field.conditional_logic;
          const parentValue = values[dependsOn];
          
          // Пропускаем, если родительское поле не имеет значения
          if (parentValue === undefined) return;
          
          let isVisible = false;
          
          switch (condition) {
            case 'equals':
              isVisible = String(parentValue).toLowerCase() === String(value).toLowerCase();
              break;
            case 'not_equals':
              isVisible = String(parentValue).toLowerCase() !== String(value).toLowerCase();
              break;
            case 'contains':
              isVisible = Array.isArray(parentValue) 
                ? parentValue.includes(value)
                : String(parentValue).toLowerCase().includes(String(value).toLowerCase());
              break;
            case 'not_contains':
              isVisible = Array.isArray(parentValue)
                ? !parentValue.includes(value)
                : !String(parentValue).toLowerCase().includes(String(value).toLowerCase());
              break;
            default:
              isVisible = false;
          }
          
          newVisibility[field.id] = isVisible;
        }
      });
      
      // Проверяем, изменилась ли видимость полей
      let hasChanges = false;
      for (const fieldId in newVisibility) {
        if (newVisibility[fieldId] !== visibleFields[fieldId]) {
          hasChanges = true;
          break;
        }
      }
      
      // Обновляем состояние только если есть изменения
      if (hasChanges) {
        setVisibleFields(newVisibility);
        
        // Если поле стало невидимым, очищаем ошибки валидации для него
        Object.keys(newVisibility).forEach(fieldId => {
          if (!newVisibility[fieldId]) {
            form$.clearErrors(fieldId);
          }
        });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [fields]);
  
  // Обработка отправки формы
  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    
    try {
      // Удаляем значения скрытых полей перед отправкой
      const sanitizedValues = { ...values };
      Object.keys(visibleFields).forEach(fieldId => {
        if (!visibleFields[fieldId]) {
          delete sanitizedValues[fieldId];
        }
      });
      
      const supabase = getSupabaseClient();
      
      // Получаем пользователя, если авторизован
      const { data: { user } } = await supabase.auth.getUser();
      
      // Подготовка данных для отправки
      const submissionData = {
        form_id: form.id,
        user_id: user?.id || null,
        data: sanitizedValues,
        metadata: {
          browser: navigator.userAgent,
          submitted_at: new Date().toISOString(),
        }
      };
      
      // Отправляем ответ
      const { error } = await supabase
        .from('form_responses')
        .insert(submissionData);
      
      if (error) throw new Error(error.message);
      
      toast.success('Форма успешно отправлена');
      setSubmitted(true);
      
      // Если настроен редирект после отправки
      if (form.redirect_url) {
        // Запускаем обратный отсчет перед редиректом
        setRedirectCountdown(3);
        const timer = window.setInterval(() => {
          setRedirectCountdown(prevCount => {
            // Когда отсчет доходит до нуля, выполняем редирект
            if (prevCount <= 1) {
              clearInterval(timer);
              window.location.href = form.redirect_url;
              return 0;
            }
            return prevCount - 1;
          });
        }, 1000);
        
        setRedirectTimer(timer as unknown as number);
      }
    } catch (error: any) {
      console.error('Ошибка при отправке формы:', error);
      toast.error(error.message || 'Не удалось отправить форму');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Очистка таймера редиректа при размонтировании компонента
  useEffect(() => {
    return () => {
      if (redirectTimer !== null) {
        clearInterval(redirectTimer);
      }
    };
  }, [redirectTimer]);
  
  // Формируем компоненты полей
  const renderFormField = (field: FormField) => {
    // Скрываем поле если оно не видимо
    if (!visibleFields[field.id]) {
      return null;
    }
    
    switch (field.type) {
      case 'text':
        return (
          <FormField
            key={field.id}
            control={form$.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={field.placeholder}
                    value={formField.value || ''} 
                    onChange={(e) => handleInputChange(e, formField.onChange)}
                    onBlur={formField.onBlur}
                    name={formField.name}
                    ref={formField.ref}
                  />
                </FormControl>
                {field.help_text && <FormDescription>{field.help_text}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'textarea':
        return (
          <FormField
            key={field.id}
            control={form$.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={field.placeholder}
                    value={formField.value || ''} 
                    onChange={formField.onChange}
                    onBlur={formField.onBlur}
                    name={formField.name}
                    ref={formField.ref}
                  />
                </FormControl>
                {field.help_text && <FormDescription>{field.help_text}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'number':
        return (
          <FormField
            key={field.id}
            control={form$.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder={field.placeholder}
                    value={formField.value ?? ''}
                    onChange={(e) => handleInputChange(e, formField.onChange)}
                    onBlur={formField.onBlur}
                    name={formField.name}
                    ref={formField.ref}
                  />
                </FormControl>
                {field.help_text && <FormDescription>{field.help_text}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'email':
        return (
          <FormField
            key={field.id}
            control={form$.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder={field.placeholder}
                    value={formField.value || ''}
                    onChange={(e) => handleInputChange(e, formField.onChange)}
                    onBlur={formField.onBlur}
                    name={formField.name}
                    ref={formField.ref}
                  />
                </FormControl>
                {field.help_text && <FormDescription>{field.help_text}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'select':
        return (
          <FormField
            key={field.id}
            control={form$.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <Select 
                  onValueChange={formField.onChange}
                  value={formField.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || 'Выберите...'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.help_text && <FormDescription>{field.help_text}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'radio':
        return (
          <FormField
            key={field.id}
            control={form$.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem className="space-y-3">
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={formField.onChange}
                    value={formField.value || ''}
                    className="flex flex-col space-y-1"
                  >
                    {field.options?.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                        <Label 
                          htmlFor={`${field.id}-${option.value}`}
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                {field.help_text && <FormDescription>{field.help_text}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'checkbox':
        return (
          <FormField
            key={field.id}
            control={form$.control}
            name={field.id}
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>{field.label}</FormLabel>
                </div>
                {field.options?.map(option => (
                  <FormField
                    key={option.value}
                    control={form$.control}
                    name={field.id}
                    render={({ field: formField }) => {
                      return (
                        <FormItem
                          key={option.value}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              id={`${field.id}-${option.value}`}
                              checked={
                                Array.isArray(formField.value) &&
                                formField.value.includes(option.value)
                              }
                              onCheckedChange={(checked) => {
                                const currentValues = Array.isArray(formField.value) 
                                  ? [...formField.value] 
                                  : [];
                                if (checked) {
                                  formField.onChange([...currentValues, option.value]);
                                } else {
                                  formField.onChange(
                                    currentValues.filter(
                                      (value) => value !== option.value
                                    )
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor={`${field.id}-${option.value}`}
                            className="font-normal"
                          >
                            {option.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                {field.help_text && <FormDescription>{field.help_text}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'switch':
      case 'toggle':
        return (
          <FormField
            key={field.id}
            control={form$.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {field.label}
                  </FormLabel>
                  {field.help_text && <FormDescription>{field.help_text}</FormDescription>}
                </div>
                <FormControl>
                  <Switch
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        );
      
      case 'date':
        return (
          <FormField
            key={field.id}
            control={form$.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={formField.value || ''}
                    onChange={(e) => handleInputChange(e, formField.onChange)}
                    onBlur={formField.onBlur}
                    name={formField.name}
                    ref={formField.ref}
                  />
                </FormControl>
                {field.help_text && <FormDescription>{field.help_text}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'range':
        return (
          <FormField
            key={field.id}
            control={form$.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Slider
                      min={field.validation_rules?.min || 0}
                      max={field.validation_rules?.max || 100}
                      step={field.validation_rules?.step || 1}
                      value={[parseFloat(formField.value) || 0]}
                      onValueChange={(values) => formField.onChange(values[0])}
                      className="py-4"
                    />
                    <div className="text-center font-medium">
                      {formField.value || 0}
                    </div>
                  </div>
                </FormControl>
                {field.help_text && <FormDescription>{field.help_text}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      default:
        return null;
    }
  };
  
  if (submitted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          <CardDescription>{form.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Успешно!</AlertTitle>
            <AlertDescription className="text-green-700">
              {form.confirmation_message || 'Спасибо! Ваш ответ был отправлен.'}
            </AlertDescription>
          </Alert>
          
          {form.redirect_url && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Перенаправление через {redirectCountdown} сек...</p>
              <Button 
                variant="outline" 
                className="mt-2" 
                onClick={() => window.location.href = form.redirect_url}
                size="sm"
              >
                Перейти сейчас
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              if (redirectTimer !== null) {
                clearInterval(redirectTimer);
                setRedirectTimer(null);
              }
              setSubmitted(false);
              form$.reset();
            }}
          >
            Отправить еще один ответ
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        {form.description && (
          <CardDescription>{form.description}</CardDescription>
        )}
      </CardHeader>
      <Form {...form$}>
        <form onSubmit={form$.handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-6">
            {fields.map(field => {
              return !visibleFields[field.id] ? null : (
                <div key={field.id}>
                  {renderFormField(field)}
                </div>
              );
            })}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Отправить'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 