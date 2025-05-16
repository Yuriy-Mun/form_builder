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
import { getSupabaseClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

interface ModernFormRendererProps {
  form: any;
  fields: FormField[];
}

export function ModernFormRenderer({ form, fields }: ModernFormRendererProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [activeField, setActiveField] = useState<string | null>(null);
  
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
      initialVisibility[field.id] = !field.conditional_logic || !field.conditional_logic.dependsOn;
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
        if (field.conditional_logic && field.conditional_logic.dependsOn) {
          const { dependsOn, condition, value } = field.conditional_logic;
          const parentValue = values[dependsOn];
          
          // Skip if parent field has no value
          if (parentValue === undefined) return;
          
          let isVisible = false;
          
          switch (condition) {
            case 'equals':
              isVisible = parentValue === value;
              break;
            case 'not_equals':
              isVisible = parentValue !== value;
              break;
            case 'contains':
              isVisible = Array.isArray(parentValue) 
                ? parentValue.includes(value) 
                : String(parentValue).includes(value);
              break;
            case 'not_contains':
              isVisible = Array.isArray(parentValue) 
                ? !parentValue.includes(value) 
                : !String(parentValue).includes(value);
              break;
            case 'greater_than':
              isVisible = Number(parentValue) > Number(value);
              break;
            case 'less_than':
              isVisible = Number(parentValue) < Number(value);
              break;
            case 'is_empty':
              isVisible = !parentValue || 
                (Array.isArray(parentValue) && parentValue.length === 0) || 
                parentValue === '';
              break;
            case 'is_not_empty':
              isVisible = parentValue && 
                !(Array.isArray(parentValue) && parentValue.length === 0) && 
                parentValue !== '';
              break;
            case 'is_checked':
              isVisible = Boolean(parentValue) === true;
              break;
            case 'is_not_checked':
              isVisible = Boolean(parentValue) === false;
              break;
            default:
              isVisible = true;
              break;
          }
          
          newVisibility[field.id] = isVisible;
        }
      });
      
      setVisibleFields(newVisibility);
    });
    
    return () => subscription.unsubscribe();
  }, [fields, form$, visibleFields]);
  
  // Set up redirection after successful submission
  useEffect(() => {
    if (redirectTimer !== null) {
      if (redirectCountdown > 0) {
        const timer = setTimeout(() => {
          setRedirectCountdown(redirectCountdown - 1);
        }, 1000);
        
        return () => clearTimeout(timer);
      } else {
        // Time's up, redirect
        if (form.success_redirect) {
          router.push(form.success_redirect);
        }
      }
    }
    
    return () => {};
  }, [redirectTimer, redirectCountdown, form.success_redirect, router]);
  
  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      
      // Prepare submission data
      const submissionData = {
        form_id: form.id,
        metadata: {
          submission_time: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_address: 'client-side'
        }
      };
      
      // Submit to form_responses table
      const supabase = getSupabaseClient();
      const { data: responseData, error } = await supabase
        .from('form_responses')
        .insert([submissionData])
        .select('id')
        .single();
      
      if (error) throw error;
      
      const responseId = responseData.id;
      
      // Store individual field values in form_response_values for analytics
      if (responseId) {
        const valueEntries = fields.map(field => {
          const fieldValue = values[field.id];
          let value = null;
          let numericValue = null;
          let booleanValue = null;
          
          // Determine the appropriate column based on field type
          if (['checkbox', 'select', 'radio'].includes(field.type) && Array.isArray(fieldValue)) {
            // For multi-select fields, store as string
            value = JSON.stringify(fieldValue);
          } else if (field.type === 'number') {
            numericValue = Number(fieldValue) || null;
            value = fieldValue?.toString();
          } else if (['switch', 'toggle'].includes(field.type)) {
            booleanValue = !!fieldValue;
            value = booleanValue ? 'true' : 'false';
          } else {
            // Default to storing as text
            value = fieldValue?.toString() || null;
          }
          
          return {
            response_id: responseId,
            field_id: field.id,
            value,
            numeric_value: numericValue,
            boolean_value: booleanValue
          };
        });
        
        // Only include fields that have values
        const validValues = valueEntries.filter(entry => 
          entry.value !== null || 
          entry.numeric_value !== null || 
          entry.boolean_value !== null
        );
        
        if (validValues.length > 0) {
          const { error: valuesError } = await supabase
            .from('form_response_values')
            .insert(validValues);
          
          if (valuesError) {
            console.error('Error storing field values:', valuesError);
            // Continue even if field values fail, as the main response is already saved
          }
        }
      }
      
      // Handle success
      setSubmitted(true);
      
      // Display success toast
      toast.success('Form submitted successfully', {
        description: 'Thank you for your submission!'
      });
      
      // Set up redirect timer if needed
      if (form.success_redirect) {
        setRedirectTimer(Date.now());
      }
      
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Display error toast
      toast.error('Error submitting form', {
        description: error.message || 'Please try again later'
      });
      
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderFormField = (field: FormField) => {
    // Skip hidden fields
    if (!visibleFields[field.id]) return null;
    
    const error = form$.formState.errors[field.id]?.message;
    const isRequired = field.required;
    
    // Animation variants for fields
    const fieldVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
          type: "spring", 
          stiffness: 300, 
          damping: 24 
        }
      },
      exit: { 
        opacity: 0, 
        y: -10, 
        transition: { 
          duration: 0.2 
        } 
      }
    };
    
    return (
      <AnimatePresence mode="wait" key={field.id}>
        <motion.div
          key={field.id}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "space-y-2 group",
            activeField === field.id && "relative z-10"
          )}
          onClick={() => setActiveField(field.id)}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Label 
                htmlFor={field.id} 
                className={cn(
                  "text-sm font-medium transition-colors group-hover:text-primary",
                  activeField === field.id && "text-primary"
                )}
              >
                {field.label}
                {isRequired && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              
              {field.help_text && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">{field.help_text}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          
          <div className="relative">
            {/* Form field elements based on type */}
            {field.type === 'text' && (
              <Input
                id={field.id}
                placeholder={field.placeholder || ''}
                className={cn(
                  "w-full transition-shadow focus-within:shadow-sm",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
                aria-invalid={!!error}
                {...form$.register(field.id)}
              />
            )}
            
            {field.type === 'textarea' && (
              <Textarea
                id={field.id}
                placeholder={field.placeholder || ''}
                className={cn(
                  "min-h-[120px] resize-y transition-shadow focus-within:shadow-sm",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
                aria-invalid={!!error}
                {...form$.register(field.id)}
              />
            )}
            
            {field.type === 'email' && (
              <Input
                id={field.id}
                type="email"
                placeholder={field.placeholder || 'example@domain.com'}
                className={cn(
                  "w-full transition-shadow focus-within:shadow-sm",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
                aria-invalid={!!error}
                {...form$.register(field.id)}
              />
            )}
            
            {field.type === 'number' && (
              <Input
                id={field.id}
                type="number"
                placeholder={field.placeholder || '0'}
                className={cn(
                  "w-full transition-shadow focus-within:shadow-sm",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
                aria-invalid={!!error}
                {...form$.register(field.id, { valueAsNumber: true })}
              />
            )}
            
            {field.type === 'select' && field.options && (
              <Select
                onValueChange={(value) => form$.setValue(field.id, value)}
                defaultValue={form$.getValues(field.id) || ''}
              >
                <SelectTrigger 
                  className={cn(
                    error && "border-destructive focus-visible:ring-destructive"
                  )}
                >
                  <SelectValue placeholder={field.placeholder || 'Select an option'} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {field.type === 'radio' && field.options && (
              <RadioGroup
                onValueChange={(value) => form$.setValue(field.id, value)}
                defaultValue={form$.getValues(field.id) || ''}
                className="space-y-2 pt-1"
              >
                {field.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                    <Label htmlFor={`${field.id}-${option.value}`} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            
            {field.type === 'checkbox' && field.options && (
              <div className="space-y-2 pt-1">
                {field.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`${field.id}-${option.value}`}
                      onCheckedChange={(checked) => {
                        const currentValues = form$.getValues(field.id) || [];
                        const newValues = checked
                          ? [...currentValues, option.value]
                          : currentValues.filter((v: string) => v !== option.value);
                        form$.setValue(field.id, newValues);
                      }}
                      defaultChecked={(form$.getValues(field.id) || []).includes(option.value)}
                    />
                    <Label htmlFor={`${field.id}-${option.value}`} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            
            {(field.type === 'switch' || field.type === 'toggle') && (
              <div className="flex items-center space-x-2 pt-1">
                <Switch
                  id={field.id}
                  onCheckedChange={(checked) => form$.setValue(field.id, checked)}
                  defaultChecked={!!form$.getValues(field.id)}
                />
                <Label htmlFor={field.id} className="cursor-pointer text-sm text-muted-foreground">
                  {field.help_text || `Toggle ${field.label}`}
                </Label>
              </div>
            )}
          </div>
          
          {/* Display form error */}
          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-destructive mt-1"
            >
              {error as string}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };
  
  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 400, damping: 10 }}
        >
          <Card className="border bg-card shadow-sm overflow-hidden">
            <CardContent className="pt-10 pb-10 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6"
              >
                <CheckCircle2 size={32} className="text-primary" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-foreground mb-3">
                {form.success_message_title || 'Thank you!'}
              </h2>
              
              <p className="text-muted-foreground max-w-md mb-6">
                {form.success_message || 'Your form has been submitted successfully.'}
              </p>
              
              {form.success_redirect && (
                <div className="text-sm text-muted-foreground">
                  <p>
                    {redirectCountdown > 0 
                      ? `Redirecting in ${redirectCountdown} seconds...` 
                      : 'Redirecting...'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <Card className="border bg-card shadow-sm overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
          </div>
          
          <CardHeader className="pb-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {form.title || 'Form'}
              </h2>
              {form.description && (
                <p className="text-muted-foreground text-sm mt-1">
                  {form.description}
                </p>
              )}
            </motion.div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={form$.handleSubmit(onSubmit)} className="space-y-6">
              {fields.map((field, index) => (
                <motion.div 
                  key={field.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 + (index * 0.05), duration: 0.4 }}
                >
                  {renderFormField(field)}
                  {index < fields.length - 1 && visibleFields[field.id] && visibleFields[fields[index + 1]?.id] && (
                    <Separator className="my-6" />
                  )}
                </motion.div>
              ))}
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + (fields.length * 0.05), duration: 0.4 }}
              >
                <Button 
                  type="submit" 
                  className="w-full group relative overflow-hidden"
                  disabled={submitting}
                  size="lg"
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>{form.submit_text || 'Submit'}</span>
                        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary group-hover:from-primary group-hover:to-primary/90 transition-colors duration-300"></span>
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 