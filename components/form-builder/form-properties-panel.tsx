import { useState, useEffect } from "react";
import { PanelRight, Plus, X, Settings, Shield, Cog, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormMetaStore } from "@/lib/store/form-meta-store";
import { useFormFieldsStore } from "@/lib/store/form-fields-store";
import { FormField } from "@/lib/store/form-fields-store";
import { useDebounce } from "@/hooks/use-debounce";
import { ScrollArea } from "../ui/scroll-area";

export function FormPropertiesPanel() {
  // Локальное состояние для UI
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldLabel, setLocalFieldLabel] = useState('');
  const [fieldHelpText, setLocalFieldHelpText] = useState('');
  const [formDescription, setLocalFormDescription] = useState('');
  const [isFormSettingsSaving, setIsFormSettingsSaving] = useState(false);
  const [newOption, setNewOption] = useState('');
  
  // Получаем функции обновления из store
  const updateFormDescription = useFormMetaStore(state => state.updateFormDescription);
  const deselectField = useFormFieldsStore(state => state.deselectField);
  const updateField = useFormFieldsStore(state => state.updateField);
  const setFieldLabel = useFormFieldsStore(state => state.setFieldLabel);
  const setFieldHelpText = useFormFieldsStore(state => state.setFieldHelpText);
  
  // Подписываемся на изменения в store
  useEffect(() => {
    // Подписка на изменения в хранилище fields
    const unsubscribeFields = useFormFieldsStore.subscribe(state => {
      setSelectedField(state.selectedField);
      setEditingField(state.editingField);
      setLocalFieldLabel(state.fieldLabel);
      setLocalFieldHelpText(state.fieldHelpText);
    });
    
    // Подписка на изменения в хранилище meta
    const unsubscribeMeta = useFormMetaStore.subscribe(state => {
      setLocalFormDescription(state.formDescription);
      setIsFormSettingsSaving(state.isSaving);
    });
    
    // Инициализируем начальные значения
    const initialFieldsState = useFormFieldsStore.getState();
    const initialMetaState = useFormMetaStore.getState();
    
    setSelectedField(initialFieldsState.selectedField);
    setEditingField(initialFieldsState.editingField);
    setLocalFieldLabel(initialFieldsState.fieldLabel);
    setLocalFieldHelpText(initialFieldsState.fieldHelpText);
    setLocalFormDescription(initialMetaState.formDescription);
    setIsFormSettingsSaving(initialMetaState.isSaving);
    
    // Отписываемся при размонтировании
    return () => {
      unsubscribeFields();
      unsubscribeMeta();
    };
  }, []);

  const debouncedDescription = useDebounce(formDescription, 1000);
  const debouncedFieldLabel = useDebounce(fieldLabel, 1000);
  const debouncedFieldHelpText = useDebounce(fieldHelpText, 1000);
  
  // Update form description when debounced value changes
  useEffect(() => {
    if (debouncedDescription) {
      updateFormDescription(debouncedDescription);
    }
  }, [debouncedDescription, updateFormDescription]);

  // Update field label when debounced value changes
  useEffect(() => {
    if (selectedField && debouncedFieldLabel && debouncedFieldLabel !== selectedField.label) {
      updateField(selectedField.id, { label: debouncedFieldLabel });
    }
  }, [debouncedFieldLabel, selectedField, updateField]);

  // Update field help text when debounced value changes
  useEffect(() => {
    if (selectedField && debouncedFieldHelpText !== selectedField.help_text) {
      updateField(selectedField.id, { help_text: debouncedFieldHelpText });
    }
  }, [debouncedFieldHelpText, selectedField, updateField]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalFormDescription(e.target.value);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldLabel(e.target.value);
  };

  const handleHelpTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFieldHelpText(e.target.value);
  };

  const handleRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedField) return;
    updateField(selectedField.id, { required: e.target.checked });
  };

  const handlePlaceholderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedField) return;
    updateField(selectedField.id, { placeholder: e.target.value });
  };

  const handleDefaultValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedField) return;
    updateField(selectedField.id, { default_value: e.target.value });
  };

  // Handle validation rule changes
  const handleValidationChange = (rule: string, value: any) => {
    if (!selectedField) return;
    
    const validationRules = selectedField.validation_rules || {};
    updateField(selectedField.id, { 
      validation_rules: { 
        ...validationRules, 
        [rule]: value 
      } 
    });
  };

  // Handle number settings changes
  const handleNumberSettingChange = (setting: string, value: any) => {
    if (!selectedField) return;
    
    const numberSettings = selectedField.number_settings || {};
    updateField(selectedField.id, { 
      number_settings: { 
        ...numberSettings, 
        [setting]: value 
      } 
    });
  };

  // Handle date settings changes
  const handleDateSettingChange = (setting: string, value: any) => {
    if (!selectedField) return;
    
    const dateSettings = selectedField.date_settings || {};
    updateField(selectedField.id, { 
      date_settings: { 
        ...dateSettings, 
        [setting]: value 
      } 
    });
  };

  // Handle conditional logic changes
  const handleConditionalLogicChange = (setting: string, value: any) => {
    if (!selectedField) return;
    
    const conditionalLogic = selectedField.conditional_logic || {};
    updateField(selectedField.id, { 
      conditional_logic: { 
        ...conditionalLogic, 
        [setting]: value 
      } 
    });
  };

  // Helper to check if field needs options
  const fieldNeedsOptions = (field: FormField) => {
    return ['select', 'radio', 'checkbox', 'multiselect'].includes(field.type);
  };

  // Add a new option to the field
  const addOption = () => {
    if (!selectedField || !newOption.trim()) return;
    
    const currentOptions = selectedField.options || [];
    let updatedOptions;
    
    // Handle both string[] and {label, value}[] formats
    if (Array.isArray(currentOptions) && currentOptions.length > 0 && typeof currentOptions[0] === 'string') {
      updatedOptions = [...currentOptions, newOption.trim()];
    } else {
      updatedOptions = [
        ...(Array.isArray(currentOptions) ? currentOptions : []), 
        { label: newOption.trim(), value: newOption.trim() }
      ];
    }
    
    updateField(selectedField.id, { options: updatedOptions });
    setNewOption('');
  };

  // Remove an option from the field
  const removeOption = (index: number) => {
    if (!selectedField) return;
    
    const currentOptions = selectedField.options || [];
    const updatedOptions = [...currentOptions];
    updatedOptions.splice(index, 1);
    
    updateField(selectedField.id, { options: updatedOptions });
  };

  // Format options for display
  const getOptionLabel = (option: any): string => {
    if (typeof option === 'string') return option;
    if (option && typeof option === 'object' && option.label) return option.label;
    return String(option);
  };

  // Check if field is of a specific type
  const isFieldType = (type: string | string[]): boolean => {
    if (!selectedField) return false;
    
    if (Array.isArray(type)) {
      return type.includes(selectedField.type);
    }
    
    return selectedField.type === type;
  };

  return (
    <Card className="md:w-80 shrink-0 gap-3">
      <CardHeader className="border-b [.border-b]:pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{selectedField ? 'Field Properties' : 'Form Properties'}</span>
          {isFormSettingsSaving && (
            <div className="rounded-full w-4 h-4 border-2 border-primary border-t-transparent animate-spin"></div>
          )}
          {selectedField && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={deselectField}>
              <PanelRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
      <ScrollArea className="h-[calc(100vh-300px)] w-full">
        {!selectedField ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="form-description">
                Form Description
              </label>
              <Textarea
                id="form-description"
                value={formDescription}
                onChange={handleDescriptionChange}
                rows={4}
                className="w-full resize-none"
                placeholder="Add a description for your form..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                This description will be shown to users when they view your form.
              </p>
            </div>
            
            {/* Additional form settings can be added here */}
          </>
        ) : (
          <>
            {/* Field Properties when a field is selected */}
            <Accordion type="multiple" className="w-full space-y-2">
              <AccordionItem value="basic" className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-md border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px]">
                <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Basic</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 py-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Label
                    </label>
                    <Input
                      value={fieldLabel}
                      onChange={handleLabelChange}
                      placeholder="Enter field label"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Placeholder
                    </label>
                    <Input
                      value={selectedField?.placeholder || ''}
                      onChange={handlePlaceholderChange}
                      placeholder="Enter placeholder text"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Text shown when no value is entered
                    </p>
                  </div>
                
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Help Text
                    </label>
                    <Textarea
                      value={fieldHelpText}
                      onChange={handleHelpTextChange}
                      rows={3}
                      className="w-full resize-none"
                      placeholder="Add help text for this field..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Displayed below the field to provide additional information.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Default Value
                    </label>
                    <Input
                      value={selectedField?.default_value || ''}
                      onChange={handleDefaultValueChange}
                      placeholder="Enter default value"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Pre-filled value when the form loads
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="field-required"
                      checked={selectedField.required || false}
                      onChange={handleRequiredChange}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <label htmlFor="field-required" className="text-sm">
                      Required field
                    </label>
                  </div>
                
                  {/* Options for select, radio, checkbox fields */}
                  {fieldNeedsOptions(selectedField) && (
                    <div className="mt-6 border-t pt-4">
                      <h3 className="text-sm font-medium mb-2">Field Options</h3>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <Input
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          placeholder="Add an option"
                          onKeyDown={(e) => e.key === 'Enter' && addOption()}
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={addOption}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {selectedField.options && Array.isArray(selectedField.options) && 
                        selectedField.options.length > 0 ? (
                          selectedField.options.map((option, index) => (
                            <div key={index} className="flex items-center justify-between group rounded border p-2">
                              <span className="text-sm">{getOptionLabel(option)}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeOption(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            No options added yet. Add options for users to select from.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Number field specific settings */}
                  {isFieldType('number') && (
                    <div className="mt-6 border-t pt-4">
                      <h3 className="text-sm font-medium mb-2">Number Settings</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Prefix
                          </label>
                          <Input 
                            value={selectedField?.number_settings?.prefix || ''}
                            onChange={(e) => handleNumberSettingChange('prefix', e.target.value)}
                            placeholder="e.g. $, €, £"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Suffix
                          </label>
                          <Input 
                            value={selectedField?.number_settings?.suffix || ''}
                            onChange={(e) => handleNumberSettingChange('suffix', e.target.value)}
                            placeholder="e.g. kg, cm, %"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Decimal Places
                          </label>
                          <Select
                            value={selectedField?.number_settings?.decimal_places || '2'}
                            onValueChange={(value) => handleNumberSettingChange('decimal_places', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select decimal places" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0 - No decimal places</SelectItem>
                              <SelectItem value="1">1 decimal place</SelectItem>
                              <SelectItem value="2">2 decimal places</SelectItem>
                              <SelectItem value="3">3 decimal places</SelectItem>
                              <SelectItem value="4">4 decimal places</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date field specific settings */}
                  {isFieldType('date') && (
                    <div className="mt-6 border-t pt-4">
                      <h3 className="text-sm font-medium mb-2">Date Settings</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Date Format
                          </label>
                          <Select
                            value={selectedField?.date_settings?.format || 'YYYY-MM-DD'}
                            onValueChange={(value) => handleDateSettingChange('format', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select date format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                              <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium">
                            Include Time
                          </label>
                          <Switch
                            checked={selectedField?.date_settings?.enable_time || false}
                            onCheckedChange={(value) => handleDateSettingChange('enable_time', value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="validation" className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-md border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px]">
                <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Validation</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 py-2">
                  <h3 className="text-sm font-medium mb-2">Validation Rules</h3>

                  {isFieldType(['text', 'textarea', 'email']) && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Min Length
                        </label>
                        <Input
                          type="number"
                          value={selectedField?.validation_rules?.min || ''}
                          onChange={(e) => handleValidationChange('min', e.target.value)}
                          placeholder="0"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Max Length
                        </label>
                        <Input
                          type="number"
                          value={selectedField?.validation_rules?.max || ''}
                          onChange={(e) => handleValidationChange('max', e.target.value)}
                          placeholder="∞"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  {isFieldType('number') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Min Value
                        </label>
                        <Input
                          type="number"
                          value={selectedField?.validation_rules?.min || ''}
                          onChange={(e) => handleValidationChange('min', e.target.value)}
                          placeholder="0"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Max Value
                        </label>
                        <Input
                          type="number"
                          value={selectedField?.validation_rules?.max || ''}
                          onChange={(e) => handleValidationChange('max', e.target.value)}
                          placeholder="∞"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  {isFieldType(['text', 'email', 'url']) && (
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Pattern
                      </label>
                      <Input
                        value={selectedField?.validation_rules?.pattern || ''}
                        onChange={(e) => handleValidationChange('pattern', e.target.value)}
                        placeholder="Regular expression"
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Custom validation pattern (regex)
                      </p>
                    </div>
                  )}

                  {isFieldType('email') && (
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">
                        Validate Email Format
                      </label>
                      <Switch
                        checked={selectedField?.validation_rules?.email || false}
                        onCheckedChange={(value) => handleValidationChange('email', value)}
                      />
                    </div>
                  )}

                  {isFieldType('url') && (
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">
                        Validate URL Format
                      </label>
                      <Switch
                        checked={selectedField?.validation_rules?.url || false}
                        onCheckedChange={(value) => handleValidationChange('url', value)}
                      />
                    </div>
                  )}

                  {isFieldType('number') && (
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">
                        Integer Only (No Decimals)
                      </label>
                      <Switch
                        checked={selectedField?.validation_rules?.integer || false}
                        onCheckedChange={(value) => handleValidationChange('integer', value)}
                      />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="advanced" className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-md border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px]">
                <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                  <div className="flex items-center gap-2">
                    <Cog className="h-4 w-4" />
                    <span>Advanced</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 py-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">
                      Read Only
                    </label>
                    <Switch
                      checked={selectedField?.read_only || false}
                      onCheckedChange={(value) => updateField(selectedField.id, { read_only: value })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">
                      Hidden Field
                    </label>
                    <Switch
                      checked={selectedField?.hidden || false}
                      onCheckedChange={(value) => updateField(selectedField.id, { hidden: value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">
                      CSS Class
                    </label>
                    <Input
                      value={selectedField?.css_class || ''}
                      onChange={(e) => updateField(selectedField.id, { css_class: e.target.value })}
                      placeholder="Custom CSS classes"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Add custom styling to this field
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Field Width
                    </label>
                    <Select
                      value={selectedField?.width || 'full'}
                      onValueChange={(value: 'full' | 'half' | 'third') => updateField(selectedField.id, { width: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select field width" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full width</SelectItem>
                        <SelectItem value="half">Half width</SelectItem>
                        <SelectItem value="third">One third width</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="logic" className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-md border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px]">
                <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Logic</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 py-2">
                  <h3 className="text-sm font-medium mb-2">Conditional Logic</h3>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">
                      Enable Conditional Logic
                    </label>
                    <Switch
                      checked={selectedField?.conditional_logic?.enabled || false}
                      onCheckedChange={(value) => handleConditionalLogicChange('enabled', value)}
                    />
                  </div>
                  
                  {selectedField?.conditional_logic?.enabled && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Action
                        </label>
                        <Select
                          value={selectedField?.conditional_logic?.action || 'show'}
                          onValueChange={(value) => handleConditionalLogicChange('action', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="show">Show this field</SelectItem>
                            <SelectItem value="hide">Hide this field</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          What to do when condition is met
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Depends On Field
                        </label>
                        <Select
                          value={selectedField?.conditional_logic?.depends_on || ''}
                          onValueChange={(value) => handleConditionalLogicChange('depends_on', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {useFormFieldsStore.getState().formFields
                              .filter(f => f.id !== selectedField.id)
                              .map(field => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.label}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Field that controls whether this field is shown
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Condition
                        </label>
                        <Select
                          value={selectedField?.conditional_logic?.condition || 'equals'}
                          onValueChange={(value) => handleConditionalLogicChange('condition', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="not_contains">Does not contain</SelectItem>
                            <SelectItem value="greater_than">Greater than</SelectItem>
                            <SelectItem value="less_than">Less than</SelectItem>
                            <SelectItem value="is_empty">Is empty</SelectItem>
                            <SelectItem value="is_not_empty">Is not empty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedField?.conditional_logic?.condition !== 'is_empty' && 
                       selectedField?.conditional_logic?.condition !== 'is_not_empty' && (
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Value
                          </label>
                          <Input
                            value={selectedField?.conditional_logic?.value || ''}
                            onChange={(e) => handleConditionalLogicChange('value', e.target.value)}
                            placeholder="Enter value to compare"
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            The value to compare against
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {!selectedField?.conditional_logic?.enabled && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Enable conditional logic to show or hide this field based on the value of another field.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 