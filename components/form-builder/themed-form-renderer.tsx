"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ThemedFormWrapper } from './themed-form-wrapper';
import { apiClient } from '@/lib/api/client';

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

interface ThemeSettings {
  primaryColor: string;
  formTheme: string;
  layout: string;
}

interface ThemedFormRendererProps {
  form: any;
  fields: FormField[];
}

export function ThemedFormRenderer({ form, fields }: ThemedFormRendererProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [activeField, setActiveField] = useState<string | null>(null);
  
  // Получаем настройки темы из формы
  const themeSettings: ThemeSettings = form.theme_settings || {
    primaryColor: '#4f46e5',
    formTheme: 'default',
    layout: 'default',
  };
  
  // Create default values for the form
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
  
  // Create validation function
  const validateField = (field: FormField, value: any) => {
    // Skip validation for hidden fields
    if (!visibleFields[field.id]) return true;
    
    // Check required fields
    if (field.required) {
      if (value === undefined || value === '') return `Field "${field.label}" is required`;
      if (Array.isArray(value) && value.length === 0) return `Please select at least one option in "${field.label}"`;
    } else if (value === '' || value === undefined) {
      return true; // Empty optional field is always valid
    }
    
    // Check specific validation rules
    if (field.validation_rules) {
      const rules = field.validation_rules;
      
      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return 'Invalid email format';
        }
      }
      
      if (['text', 'textarea'].includes(field.type)) {
        if (rules.min && value.length < rules.min) {
          return `Minimum length is ${rules.min} characters`;
        }
        if (rules.max && value.length > rules.max) {
          return `Maximum length is ${rules.max} characters`;
        }
      }
      
      if (field.type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return 'Please enter a number';
        }
        if (rules.min !== undefined && numValue < rules.min) {
          return `Value must be at least ${rules.min}`;
        }
        if (rules.max !== undefined && numValue > rules.max) {
          return `Value must be at most ${rules.max}`;
        }
        if (rules.integer && !Number.isInteger(numValue)) {
          return 'Please enter a whole number';
        }
      }
      
      if (rules.pattern && value) {
        try {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            return 'Invalid format';
          }
        } catch (error) {
          console.error('Invalid regex pattern:', rules.pattern);
        }
      }
    }
    
    return true;
  };
  
  // Create the form
  const form$ = useForm<FormValues>({
    defaultValues: getDefaultValues(),
    mode: 'onBlur'
  });
  
  // Register all fields with validation
  useEffect(() => {
    // First unregister all fields to avoid memory leaks
    const fieldsToUnregister = Object.keys(form$.getValues());
    fieldsToUnregister.forEach(fieldName => {
      try {
        form$.unregister(fieldName);
      } catch (e) {
        // Ignore errors when unregistering
      }
    });
    
    // Then register fields with current validation
    const initialValues = getDefaultValues();
    fields.forEach(field => {
      form$.register(field.id, {
        value: initialValues[field.id], 
        validate: (value) => validateField(field, value)
      });
    });
    
    // Set initial field visibility
    const initialVisibility: Record<string, boolean> = {};
    fields.forEach(field => {
      // Field is visible by default unless it has conditional logic that should hide it initially
      if (field.conditional_logic && field.conditional_logic.enabled && field.conditional_logic.depends_on) {
        // For conditional fields, start with hidden state and let the watch effect handle visibility
        initialVisibility[field.id] = false;
      } else {
        // Non-conditional fields are always visible
        initialVisibility[field.id] = true;
      }
    });
    setVisibleFields(initialVisibility);
    
    // Clean up form on unmount
    return () => {
      fieldsToUnregister.forEach(fieldName => {
        try {
          form$.unregister(fieldName);
        } catch (e) {
          // Ignore errors when unregistering
        }
      });
    };
  }, [fields, getDefaultValues, form$]); 
  
  // Update field visibility when values change
  useEffect(() => {
    const subscription = form$.watch((values) => {
      const newVisibility = { ...visibleFields };
      
      // Check each conditional field
      fields.forEach(field => {
        if (field.conditional_logic && field.conditional_logic.enabled && field.conditional_logic.depends_on) {
          const { depends_on, condition, value, action } = field.conditional_logic;
          const parentValue = values[depends_on];
          
          let conditionMet = false;
          
          switch (condition) {
            case 'equals':
              conditionMet = parentValue === value;
              break;
            case 'not_equals':
              conditionMet = parentValue !== value;
              break;
            case 'contains':
              conditionMet = Array.isArray(parentValue) 
                ? parentValue.includes(value)
                : String(parentValue || '').includes(value || '');
              break;
            case 'not_contains':
              conditionMet = Array.isArray(parentValue) 
                ? !parentValue.includes(value)
                : !String(parentValue || '').includes(value || '');
              break;
            case 'greater_than':
              conditionMet = Number(parentValue) > Number(value);
              break;
            case 'less_than':
              conditionMet = Number(parentValue) < Number(value);
              break;
            case 'is_empty':
              conditionMet = parentValue === '' || parentValue === null || parentValue === undefined || 
                           (Array.isArray(parentValue) && parentValue.length === 0);
              break;
            case 'is_not_empty':
              conditionMet = parentValue !== '' && parentValue !== null && parentValue !== undefined && 
                           (!Array.isArray(parentValue) || parentValue.length > 0);
              break;
            default:
              conditionMet = false;
          }
          
          // Apply action based on condition result
          if (action === 'show') {
            newVisibility[field.id] = conditionMet;
          } else if (action === 'hide') {
            newVisibility[field.id] = !conditionMet;
          }
        } else {
          // Field without conditional logic is always visible
          newVisibility[field.id] = true;
        }
      });
      
      setVisibleFields(newVisibility);
    });
    
    return () => subscription.unsubscribe();
  }, [fields, form$, visibleFields]);
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      
      // Filter out values for hidden fields
      const filteredValues = Object.keys(values).reduce((acc, key) => {
        if (visibleFields[key]) {
          acc[key] = values[key];
        }
        return acc;
      }, {} as FormValues);
      
      // Submit form response using API route
      await apiClient.responses.submit(form.id, filteredValues);
      
      setSubmitted(true);
      toast.success('Form submitted successfully!');
      
      // Handle redirect if configured
      if (form.redirect_url) {
        setRedirectTimer(3);
        const timer = setInterval(() => {
          setRedirectCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              window.location.href = form.redirect_url;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Get theme-specific classes for form elements
  const getFieldClasses = (field: FormField) => {
    const baseClasses = "transition-all duration-200 border-0 bg-white/50 backdrop-blur-sm";
    
    switch (themeSettings.formTheme) {
      case 'modern':
        return cn(
          baseClasses,
          "rounded-xl border-2 border-slate-200/50 focus-within:border-[var(--form-primary-color)] focus-within:ring-4 focus-within:ring-[var(--form-primary-color)]/10 focus-within:bg-white shadow-sm hover:shadow-md"
        );
      case 'classic':
        return cn(
          baseClasses,
          "rounded-sm border border-slate-300 focus-within:border-[var(--form-primary-color)] focus-within:ring-2 focus-within:ring-[var(--form-primary-color)]/20 bg-white"
        );
      case 'gradient':
        return cn(
          baseClasses,
          "rounded-lg border-2 border-slate-200/50 bg-gradient-to-r from-white/80 to-slate-50/80 focus-within:from-[var(--form-primary-color)]/5 focus-within:to-[var(--form-primary-color)]/10 focus-within:border-[var(--form-primary-color)] shadow-sm"
        );
      default:
        return cn(
          baseClasses,
          "rounded-lg border border-slate-200/70 focus-within:border-[var(--form-primary-color)] focus-within:ring-2 focus-within:ring-[var(--form-primary-color)]/20 shadow-sm hover:shadow-md"
        );
    }
  };
  
  const getButtonClasses = () => {
    const baseClasses = "w-full transition-all duration-300 font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]";
    
    switch (themeSettings.formTheme) {
      case 'modern':
        return cn(
          baseClasses,
          "rounded-xl h-11 bg-[var(--form-primary-color)] hover:bg-[var(--form-primary-color-hover)] shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)]"
        );
      case 'classic':
        return cn(
          baseClasses,
          "rounded-sm h-10 bg-[var(--form-primary-color)] hover:bg-[var(--form-primary-color-hover)] shadow-md hover:shadow-lg"
        );
      case 'gradient':
        return cn(
          baseClasses,
          "rounded-lg h-11 bg-gradient-to-r from-[var(--form-primary-color)] to-[var(--form-primary-color-hover)] hover:from-[var(--form-primary-color-hover)] hover:to-[var(--form-primary-color)] shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
        );
      default:
        return cn(
          baseClasses,
          "rounded-lg h-10 bg-[var(--form-primary-color)] hover:bg-[var(--form-primary-color-hover)] shadow-md hover:shadow-lg"
        );
    }
  };
  
  const getCardClasses = () => {
    const baseClasses = "transition-all duration-500 border-0 overflow-hidden";
    
    switch (themeSettings.formTheme) {
      case 'modern':
        return cn(
          baseClasses,
          "rounded-3xl shadow-[0_20px_70px_rgb(0,0,0,0.1)] bg-white/90 backdrop-blur-xl border border-white/20"
        );
      case 'classic':
        return cn(
          baseClasses,
          "rounded-lg shadow-lg bg-white border border-slate-200"
        );
      case 'gradient':
        return cn(
          baseClasses,
          "rounded-2xl shadow-[0_25px_80px_rgb(0,0,0,0.15)] bg-gradient-to-br from-white/95 via-white/90 to-slate-50/90 backdrop-blur-xl"
        );
      default:
        return cn(
          baseClasses,
          "rounded-xl shadow-[0_15px_50px_rgb(0,0,0,0.1)] bg-white/95 backdrop-blur-sm border border-slate-200/50"
        );
    }
  };
  
  // Render form field based on type
  const renderFormField = (field: FormField) => {
    if (!visibleFields[field.id]) return null;
    
    const fieldError = form$.formState.errors[field.id];
    const fieldValue = form$.watch(field.id);
    
    const fieldClasses = getFieldClasses(field);
    
    const renderField = () => {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'url':
        case 'tel':
          return (
            <Input
              {...form$.register(field.id)}
              type={field.type}
              placeholder={field.placeholder}
              className={cn(fieldClasses, "h-10 px-3 text-sm placeholder:text-slate-400")}
              onFocus={() => setActiveField(field.id)}
              onBlur={() => setActiveField(null)}
            />
          );
          
        case 'number':
          return (
            <Input
              {...form$.register(field.id, { valueAsNumber: true })}
              type="number"
              placeholder={field.placeholder}
              className={cn(fieldClasses, "h-10 px-3 text-sm placeholder:text-slate-400")}
              onFocus={() => setActiveField(field.id)}
              onBlur={() => setActiveField(null)}
            />
          );
          
        case 'textarea':
          return (
            <Textarea
              {...form$.register(field.id)}
              placeholder={field.placeholder}
              className={cn(fieldClasses, "min-h-[80px] resize-y px-3 py-2 text-sm placeholder:text-slate-400")}
              onFocus={() => setActiveField(field.id)}
              onBlur={() => setActiveField(null)}
            />
          );
          
        case 'select':
          return (
            <Select
              value={fieldValue || ''}
              onValueChange={(value) => form$.setValue(field.id, value)}
            >
              <SelectTrigger className={cn(fieldClasses, "h-10 px-3 text-sm")}>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
          
        case 'radio':
          return (
            <RadioGroup
              value={fieldValue || ''}
              onValueChange={(value) => form$.setValue(field.id, value)}
              className="space-y-2"
            >
              {field.options?.map((option) => (
                <motion.div 
                  key={option.value} 
                  className="flex items-center space-x-3 p-2 rounded-lg border border-slate-200 hover:border-[var(--form-primary-color)]/50 hover:bg-slate-50/50 transition-all duration-200 cursor-pointer"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={`${field.id}-${option.value}`}
                    className="text-[var(--form-primary-color)] border-2 w-4 h-4"
                  />
                  <Label 
                    htmlFor={`${field.id}-${option.value}`}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {option.label}
                  </Label>
                </motion.div>
              ))}
            </RadioGroup>
          );
          
        case 'checkbox':
          const checkboxValues = fieldValue || [];
          return (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <motion.div 
                  key={option.value} 
                  className="flex items-center space-x-3 p-2 rounded-lg border border-slate-200 hover:border-[var(--form-primary-color)]/50 hover:bg-slate-50/50 transition-all duration-200 cursor-pointer"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Checkbox
                    id={`${field.id}-${option.value}`}
                    checked={checkboxValues.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...checkboxValues, option.value]
                        : checkboxValues.filter((v: string) => v !== option.value);
                      form$.setValue(field.id, newValues);
                    }}
                    className="text-[var(--form-primary-color)] border-2 w-4 h-4"
                  />
                  <Label 
                    htmlFor={`${field.id}-${option.value}`}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {option.label}
                  </Label>
                </motion.div>
              ))}
            </div>
          );
          
        case 'switch':
          return (
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-[var(--form-primary-color)]/50 hover:bg-slate-50/50 transition-all duration-200">
              <Label className="text-sm font-medium flex-1">
                {field.placeholder || 'Enable this option'}
              </Label>
              <Switch
                checked={fieldValue || false}
                onCheckedChange={(checked) => form$.setValue(field.id, checked)}
                className="data-[state=checked]:bg-[var(--form-primary-color)]"
              />
            </div>
          );
          
        case 'date':
          return (
            <Input
              {...form$.register(field.id)}
              type="date"
              className={cn(fieldClasses, "h-10 px-3 text-sm")}
              onFocus={() => setActiveField(field.id)}
              onBlur={() => setActiveField(null)}
            />
          );
          
        case 'time':
          return (
            <Input
              {...form$.register(field.id)}
              type="time"
              className={cn(fieldClasses, "h-10 px-3 text-sm")}
              onFocus={() => setActiveField(field.id)}
              onBlur={() => setActiveField(null)}
            />
          );
          
        case 'file':
          return (
            <div className="relative">
              <Input
                {...form$.register(field.id)}
                type="file"
                className={cn(fieldClasses, "h-10 px-3 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[var(--form-primary-color)] file:text-white hover:file:bg-[var(--form-primary-color-hover)] file:cursor-pointer")}
                onFocus={() => setActiveField(field.id)}
                onBlur={() => setActiveField(null)}
              />
            </div>
          );
          
        default:
          return (
            <Input
              {...form$.register(field.id)}
              type="text"
              placeholder={field.placeholder}
              className={cn(fieldClasses, "h-10 px-3 text-sm")}
              onFocus={() => setActiveField(field.id)}
              onBlur={() => setActiveField(null)}
            />
          );
      }
    };
    
    return (
      <motion.div
        key={field.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "space-y-2 group",
          themeSettings.layout === 'two-column' && "col-span-1"
        )}
      >
        <div className="flex items-center gap-3">
          <Label 
            htmlFor={field.id}
            className={cn(
              "text-sm font-semibold transition-all duration-200 flex items-center gap-2",
              activeField === field.id && "text-[var(--form-primary-color)] scale-105",
              fieldError && "text-red-500",
              "group-hover:text-slate-700"
            )}
          >
            <span>{field.label}</span>
            {field.required && (
              <span className="text-red-500 text-xs">*</span>
            )}
          </Label>
          
          {field.help_text && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Info className="h-3 w-3 text-slate-400 hover:text-[var(--form-primary-color)] cursor-help transition-colors" />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{field.help_text}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div className="relative">
          {renderField()}
          
          {/* Декоративная линия под полем */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[var(--form-primary-color)] to-[var(--form-primary-color-hover)] rounded-full"
            initial={{ width: "0%" }}
            animate={{ 
              width: activeField === field.id ? "100%" : "0%" 
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        
        <AnimatePresence>
          {fieldError && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center gap-2 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-200"
            >
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
              <span>{(fieldError as any)?.message || 'Invalid input'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };
  
  // Success state
  if (submitted) {
    return (
      <ThemedFormWrapper themeSettings={themeSettings}>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.25, 0.25, 0, 1]
          }}
        >
          <Card className={getCardClasses()}>
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  duration: 0.8, 
                  bounce: 0.4,
                  delay: 0.2 
                }}
                className="mb-8"
              >
                <div className="relative inline-block">
                  <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-green-200"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      ease: "easeOut" 
                    }}
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="space-y-6"
              >
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                  Thank You!
                </h2>
                <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
                  {form.success_message || 'Your form has been submitted successfully. We appreciate your response!'}
                </p>
                
                {/* Декоративные элементы */}
                <div className="flex justify-center space-x-2 mt-8">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-green-400 rounded-full"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>
              </motion.div>
              
              {redirectTimer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="mt-8 space-y-4"
                >
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <p className="text-sm text-slate-600 mb-3">
                      Redirecting in {redirectCountdown} seconds...
                    </p>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[var(--form-primary-color)] to-[var(--form-primary-color-hover)] rounded-full"
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 3, ease: "linear" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </ThemedFormWrapper>
    );
  }
  
  return (
    <ThemedFormWrapper themeSettings={themeSettings}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.25, 0.25, 0, 1]
        }}
      >
        <Card className={getCardClasses()}>
          <CardHeader className="pb-6 pt-6 px-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="text-center space-y-3"
            >
              {/* Декоративный элемент */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-1 bg-gradient-to-r from-[var(--form-primary-color)]/30 via-[var(--form-primary-color)] to-[var(--form-primary-color)]/30 rounded-full"></div>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent leading-tight">
                {form.title}
              </h1>
              {form.description && (
                <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  {form.description}
                </p>
              )}
              
              {/* Прогресс бар (если нужен) */}
              <div className="flex justify-center mt-4">
                <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[var(--form-primary-color)] to-[var(--form-primary-color-hover)]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          </CardHeader>
          
          <CardContent className="pb-6 px-6">
            <form onSubmit={form$.handleSubmit(onSubmit)} className="space-y-6">
              <div className={cn(
                "space-y-5",
                themeSettings.layout === 'two-column' && "grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0",
                themeSettings.layout === 'compact' && "space-y-4"
              )}>
                <AnimatePresence>
                  {fields.map(renderFormField)}
                </AnimatePresence>
              </div>
              
              {fields.length > 0 && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-slate-500">Ready to submit</span>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      disabled={submitting}
                      className={cn(getButtonClasses(), "group")}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span>Submitting your response...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Form</span>
                          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </ThemedFormWrapper>
  );
} 