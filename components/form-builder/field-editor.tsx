import { useState, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { IconPlus } from '@tabler/icons-react';
import { X } from 'lucide-react';

// Define the form field types
type FieldType = 'text' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'date' | 
  'email' | 'phone' | 'url' | 'number' | 'time' | 'datetime' | 
  'file' | 'range' | 'rating' | 'toggle' | 'multiselect';

// Field-specific settings interfaces
interface NumberSettings {
  prefix?: string;
  suffix?: string;
  decimal_places?: '0' | '1' | '2' | '3' | '4';
  step?: number;
  currency?: string;
  format?: 'standard' | 'currency' | 'percentage';
}

interface DateSettings {
  format?: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'DD-MM-YYYY';
  enable_time?: boolean;
  time_format?: '12h' | '24h';
  show_calendar?: boolean;
  first_day_of_week?: 0 | 1; // 0 = Sunday, 1 = Monday
}

interface FileSettings {
  multiple?: boolean;
  storage_location?: string;
  max_file_size?: string;
  allowed_extensions?: string;
}

interface RatingSettings {
  max_rating?: 5 | 10;
  icon_type?: 'star' | 'heart' | 'thumbs' | 'number';
  allow_half_ratings?: boolean;
  display_values?: boolean;
}

interface ToggleSettings {
  on_text?: string;
  off_text?: string;
  color_on?: string;
  color_off?: string;
}

// Removed RichTextSettings interface - no longer needed

// Removed CaptchaSettings interface - no longer needed

interface AppearanceSettings {
  label_position?: 'top' | 'left' | 'right' | 'hidden';
  input_size?: 'small' | 'medium' | 'large';
  theme?: 'default' | 'outlined' | 'filled';
}

interface ValidationRules {
  min?: string;
  max?: string;
  pattern?: string;
  email?: boolean;
  url?: boolean;
  date?: boolean;
  min_date?: string;
  max_date?: string;
  integer?: boolean;
  allowed_extensions?: string;
  max_file_size?: string;
}

interface ConditionalLogic {
  dependsOn?: string;
  condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value?: string;
  action?: 'show' | 'hide' | 'enable' | 'disable';
}

// Update the FormField interface to have options as an array of objects with label and value
interface FormFieldOption {
  label: string;
  value: string;
}

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  default_value?: string;
  width?: 'full' | 'half' | 'third';
  hidden?: boolean;
  read_only?: boolean;
  css_class?: string;
  options?: FormFieldOption[]; // Changed from string[] to FormFieldOption[]
  
  // Field-specific settings
  number_settings?: NumberSettings;
  date_settings?: DateSettings;
  file_settings?: FileSettings;
  rating_settings?: RatingSettings;
  appearance?: AppearanceSettings;
  validation_rules?: ValidationRules;
  conditional_logic?: ConditionalLogic;
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
    help_text: z.string().optional(),
    default_value: z.string().optional(),
    css_class: z.string().optional(),
    width: z.enum(['full', 'half', 'third']).optional(),
    hidden: z.boolean().optional(),
    read_only: z.boolean().optional(),
    options: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })).optional(),
    
    // Field-specific settings
    number_settings: z.object({
      prefix: z.string().optional(),
      suffix: z.string().optional(),
      decimal_places: z.enum(['0', '1', '2', '3', '4']).optional(),
      step: z.number().optional(),
      currency: z.string().optional(),
      format: z.enum(['standard', 'currency', 'percentage']).optional(),
    }).optional(),
    
    date_settings: z.object({
      format: z.enum(['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'DD-MM-YYYY']).optional(),
      enable_time: z.boolean().optional(),
      time_format: z.enum(['12h', '24h']).optional(),
      show_calendar: z.boolean().optional(),
      first_day_of_week: z.union([z.literal(0), z.literal(1)]).optional(),
    }).optional(),
    
    file_settings: z.object({
      multiple: z.boolean().optional(),
      storage_location: z.string().optional(),
      max_file_size: z.string().optional(),
      allowed_extensions: z.string().optional(),
    }).optional(),
    
    appearance: z.object({
      label_position: z.enum(['top', 'left', 'right', 'hidden']).optional(),
      input_size: z.enum(['small', 'medium', 'large']).optional(),
      theme: z.enum(['default', 'outlined', 'filled']).optional(),
    }).optional(),
    
    rating_settings: z.object({
      max_rating: z.union([z.literal(5), z.literal(10)]).optional(),
      icon_type: z.enum(['star', 'heart', 'thumbs', 'number']).optional(),
      allow_half_ratings: z.boolean().optional(),
      display_values: z.boolean().optional(),
    }).optional(),
    
    validation_rules: z.object({
      min: z.string().optional(),
      max: z.string().optional(),
      pattern: z.string().optional(),
      email: z.boolean().optional(),
      url: z.boolean().optional(),
      date: z.boolean().optional(),
      min_date: z.string().optional(),
      max_date: z.string().optional(),
      integer: z.boolean().optional(),
      allowed_extensions: z.string().optional(),
      max_file_size: z.string().optional(),
    }).optional(),
    
    conditional_logic: z.object({
      dependsOn: z.string().optional(),
      condition: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']).optional(),
      value: z.string().optional(),
      action: z.enum(['show', 'hide', 'enable', 'disable']).optional(),
    }).optional(),
  };
  
  return z.object(baseSchema);
};

type FieldFormValues = z.infer<ReturnType<typeof createFieldSchema>>;

export function FieldEditor({ field, isOpen, onClose, onSave, allFields = [] }: FieldEditorProps) {
  const [optionInput, setOptionInput] = useState('');
  const [activeTab, setActiveTab] = useState("basic");
  
  // Create form with dynamic schema based on field type
  const form = useForm({
    resolver: zodResolver(createFieldSchema(field?.type)),
    defaultValues: field || {
      id: '',
      type: 'text',
      label: '',
      required: false,
    },
  });

  // Reset form when field changes
  useEffect(() => {
    if (field) {
      form.reset(field);
    }
  }, [field, form]);

  // Handle form submission
  const onSubmit = (values: any) => {
    onSave(values);
    onClose();
  };

  // Add an option to the field
  const addOption = () => {
    if (optionInput.trim()) {
      const currentOptions = form.getValues('options') || [];
      form.setValue('options', [...currentOptions, { label: optionInput.trim(), value: optionInput.trim() }]);
      setOptionInput('');
    }
  };

  // Remove an option from the field
  const removeOption = (index: number) => {
    const currentOptions = [...(form.getValues('options') || [])];
    currentOptions.splice(index, 1);
    form.setValue('options', currentOptions);
  };

  // Get only fields that come before this field for dependency selection
  // to avoid circular dependencies
  const availableFields = field 
    ? allFields.filter(f => f.id !== field.id) 
    : [];

  const needsOptions = field?.type === 'radio' || field?.type === 'checkbox' || field?.type === 'select' || field?.type === 'multiselect';
  const fieldOptions = form.watch('options') || [];
  const dependentFieldId = form.watch('conditional_logic.dependsOn');
  const dependentField = dependentFieldId ? allFields.find(f => f.id === dependentFieldId) : undefined;

  // Detect if field has options
  const hasOptions = useMemo(() => {
    return ['dropdown', 'checkbox', 'radio', 'multiselect'].includes(form.getValues().type);
  }, [form.getValues().type]);

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
              <Tabs 
                defaultValue="basic" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="options" disabled={!needsOptions}>Options</TabsTrigger>
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="logic">Logic</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
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
                    name="help_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Help Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter help text" {...field} />
                        </FormControl>
                        <FormDescription>
                          Additional information to help users fill in this field.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="default_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Value</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter default value" {...field} />
                        </FormControl>
                        <FormDescription>
                          Pre-filled value when the form loads
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
                  
                  {/* Number field specific settings */}
                  {field?.type === 'number' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Number Field Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="number_settings.prefix"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prefix</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. $, €, £" {...field} />
                              </FormControl>
                              <FormDescription>
                                Text to display before the number
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="number_settings.suffix"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Suffix</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. kg, cm, %" {...field} />
                              </FormControl>
                              <FormDescription>
                                Text to display after the number
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="number_settings.decimal_places"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Decimal Places</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                defaultValue="2"
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select decimal places" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">0 - No decimal places</SelectItem>
                                  <SelectItem value="1">1 decimal place</SelectItem>
                                  <SelectItem value="2">2 decimal places</SelectItem>
                                  <SelectItem value="3">3 decimal places</SelectItem>
                                  <SelectItem value="4">4 decimal places</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Date field specific settings */}
                  {field?.type === 'date' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Date Field Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="date_settings.format"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date Format</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                defaultValue="YYYY-MM-DD"
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select date format" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                  <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="date_settings.enable_time"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Include Time</FormLabel>
                                <FormDescription>
                                  Allow users to select a time as well as a date
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
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* File upload specific settings */}
                  {field?.type === 'file' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">File Upload Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="file_settings.multiple"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Multiple Files</FormLabel>
                                <FormDescription>
                                  Allow users to upload multiple files
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
                        
                        <FormField
                          control={form.control}
                          name="file_settings.storage_location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Storage Location</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                defaultValue="default"
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select storage location" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="default">Default Storage</SelectItem>
                                  <SelectItem value="s3">Amazon S3</SelectItem>
                                  <SelectItem value="cloud">Cloud Storage</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="options" className="space-y-4">
                  {/* Options for fields that support them */}
                  {hasOptions && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Options</CardTitle>
                        <CardDescription>
                          Configure options for this field
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          <Input 
                            placeholder="Add option..." 
                            value={optionInput}
                            onChange={(e) => setOptionInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addOption()}
                          />
                          <Button type="button" onClick={addOption}>
                            <IconPlus size={16} />
                          </Button>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          {/* @ts-ignore - Ignore type issues with fieldOptions */}
                          {fieldOptions.map((option, index) => (
                            <div key={index} className="flex items-center justify-between rounded border p-2">
                              {/* @ts-ignore - Ignore type issues with option.label */}
                              <span>{option.label}</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeOption(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          
                          {fieldOptions.length === 0 && (
                            <div className="text-center p-4 text-gray-500">
                              Add at least one option
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="validation" className="space-y-4">
                  {/* Validation Rules Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Validation Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(field?.type === 'text' || field?.type === 'textarea' || field?.type === 'email' ||
                      field?.type === 'url') && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="validation_rules.min"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Min Length</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="Min length" 
                                      {...field} 
                                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="validation_rules.max"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Max Length</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="Max length" 
                                      {...field} 
                                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="validation_rules.pattern"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pattern (Regex)</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. ^[a-zA-Z0-9]+$" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Regular expression pattern for validation
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      
                      {field?.type === 'number' && (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="validation_rules.min"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Min Value</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Min value" 
                                    {...field} 
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="validation_rules.max"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Value</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Max value" 
                                    {...field} 
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="validation_rules.integer"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel>Integer Only</FormLabel>
                                  <FormDescription>
                                    Only allow whole numbers
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
                        </div>
                      )}
                      
                      {field?.type === 'email' && (
                        <FormField
                          control={form.control}
                          name="validation_rules.email"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Email Validation</FormLabel>
                                <FormDescription>
                                  Validate as email format
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
                      )}
                      
                      {field?.type === 'url' && (
                        <FormField
                          control={form.control}
                          name="validation_rules.url"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>URL Validation</FormLabel>
                                <FormDescription>
                                  Validate as URL format
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
                      )}
                      
                      {field?.type === 'date' && (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="validation_rules.date"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel>Date Validation</FormLabel>
                                  <FormDescription>
                                    Validate as valid date format
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
                          
                          <FormField
                            control={form.control}
                            name="validation_rules.min_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimum Date</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Earliest allowed date
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="validation_rules.max_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Maximum Date</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Latest allowed date
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      {field?.type === 'file' && (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="validation_rules.allowed_extensions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Allowed File Extensions</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. pdf,jpg,png,doc" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Comma-separated list of allowed file extensions
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="validation_rules.max_file_size"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max File Size (MB)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    placeholder="e.g. 5" 
                                    {...field} 
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="appearance" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Field Appearance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Width</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              defaultValue="full"
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select width" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="full">Full Width</SelectItem>
                                <SelectItem value="half">Half Width</SelectItem>
                                <SelectItem value="third">One Third</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Control how much horizontal space this field takes up
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="appearance.label_position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Label Position</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              defaultValue="top"
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="top">Top</SelectItem>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                                <SelectItem value="hidden">Hidden</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="appearance.input_size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Input Size</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              defaultValue="medium"
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="appearance.theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Theme</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              defaultValue="default"
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="outlined">Outlined</SelectItem>
                                <SelectItem value="filled">Filled</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="css_class"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom CSS Class</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. my-custom-field" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Add custom CSS class names to this field
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="hidden"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Hidden Field</FormLabel>
                                <FormDescription>
                                  Field will be hidden
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
                        
                        <FormField
                          control={form.control}
                          name="read_only"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Read Only</FormLabel>
                                <FormDescription>
                                  Field cannot be edited
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
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="logic" className="space-y-4">
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
                                        {dependentField.options?.map((option: any) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
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
                </TabsContent>
              </Tabs>

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