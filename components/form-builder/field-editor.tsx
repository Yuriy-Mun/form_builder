import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPlus, IconX } from '@tabler/icons-react';

// Define the form field types
type FieldType = 'text' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'date';

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[]; // For radio, checkbox, select
  placeholder?: string;
  conditional_logic?: {
    dependsOn?: string; // ID of the field this field depends on
    condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains'; // Type of condition
    value?: string; // Value to compare against
  };
}

interface FieldEditorProps {
  field: FormField | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: FormField) => void;
  allFields?: FormField[]; // Added to access all fields for conditional logic
}

// Create dynamic form schema based on field type
const createFieldSchema = (type?: FieldType) => {
  const baseSchema = {
    id: z.string(),
    type: z.string() as z.ZodType<FieldType>,
    label: z.string().min(1, "Label is required"),
    required: z.boolean().default(false),
    placeholder: z.string().optional(),
    conditional_logic: z.object({
      dependsOn: z.string().optional(),
      condition: z.enum(['equals', 'not_equals', 'contains', 'not_contains']).optional(),
      value: z.string().optional(),
    }).optional(),
  };

  // Add options for field types that need them
  if (type === 'radio' || type === 'checkbox' || type === 'select') {
    return z.object({
      ...baseSchema,
      options: z.array(z.string()).min(1, "At least one option is required"),
    });
  }

  return z.object(baseSchema);
};

export function FieldEditor({ field, isOpen, onClose, onSave, allFields = [] }: FieldEditorProps) {
  const [optionInput, setOptionInput] = useState('');
  
  // Create form with dynamic schema based on field type
  const form = useForm<FormField>({
    resolver: zodResolver(createFieldSchema(field?.type)),
    defaultValues: field || {
      id: '',
      type: 'text',
      label: '',
      required: false,
      placeholder: '',
      options: [],
    },
  });

  // Reset form when field changes
  useEffect(() => {
    if (field) {
      form.reset(field);
    }
  }, [field, form]);

  // Handle form submission
  const onSubmit = (values: FormField) => {
    onSave(values);
    onClose();
  };

  // Handle adding and removing options
  const addOption = () => {
    if (!optionInput.trim()) return;
    
    const currentOptions = form.getValues('options') || [];
    form.setValue('options', [...currentOptions, optionInput.trim()]);
    setOptionInput('');
  };

  const removeOption = (index: number) => {
    const currentOptions = form.getValues('options') || [];
    form.setValue('options', currentOptions.filter((_, i) => i !== index));
  };

  // Get only fields that come before this field for dependency selection
  // to avoid circular dependencies
  const availableFields = field 
    ? allFields.filter(f => f.id !== field.id) 
    : [];

  const needsOptions = field?.type === 'radio' || field?.type === 'checkbox' || field?.type === 'select';
  const options = form.watch('options') || [];
  const dependentFieldId = form.watch('conditional_logic.dependsOn');
  const dependentField = dependentFieldId ? allFields.find(f => f.id === dependentFieldId) : undefined;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{field ? 'Edit Field' : 'Add New Field'}</SheetTitle>
          <SheetDescription>
            Configure the properties of your form field.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Label</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter field label" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be displayed to users when filling out the form.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="placeholder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placeholder Text</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter placeholder text" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional text shown when no value is entered.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Required Field</FormLabel>
                      <FormDescription>
                        Users must provide a value for this field
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {needsOptions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Field Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="Add an option" 
                        value={optionInput}
                        onChange={(e) => setOptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addOption();
                          }
                        }}
                      />
                      <Button type="button" onClick={addOption}>
                        <IconPlus size={16} />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {options.map((option, index) => (
                        <div key={index} className="flex items-center justify-between rounded border p-2">
                          <span>{option}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeOption(index)}
                          >
                            <IconX size={16} />
                          </Button>
                        </div>
                      ))}
                      
                      {options.length === 0 && (
                        <div className="text-center p-4 text-gray-500">
                          Add at least one option
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conditional Logic Section */}
              {availableFields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Conditional Logic</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="conditional_logic.dependsOn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Show this field only if</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a field" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No dependency (always show)</SelectItem>
                              {availableFields.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose a field that will control when this field is shown
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    {dependentFieldId && (
                      <>
                        <FormField
                          control={form.control}
                          name="conditional_logic.condition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Condition</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                defaultValue="equals"
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select condition" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="not_equals">Does not equal</SelectItem>
                                  <SelectItem value="contains">Contains</SelectItem>
                                  <SelectItem value="not_contains">Does not contain</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="conditional_logic.value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Value</FormLabel>
                              {dependentField?.type === 'radio' || dependentField?.type === 'select' ? (
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a value" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {dependentField.options?.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <FormControl>
                                  <Input placeholder="Enter value" {...field} />
                                </FormControl>
                              )}
                              <FormDescription>
                                The value to compare with the selected field
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Field
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
} 