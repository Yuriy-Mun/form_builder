'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFormMetaStore } from '@/lib/store/form-meta-store';
import { useFormFieldsStore } from '@/lib/store/form-fields-store';
import { FormPreview } from './form-preview';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { useFormUIStore } from '@/lib/store/form-ui-store';
import { FormField as EditorFormField, FieldType } from './form-field-editor';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
}

export function PreviewModal({ open, onClose }: PreviewModalProps) {
  const form = useFormMetaStore((state) => state.form);
  const storeFields = useFormFieldsStore((state) => state.formFields);
  
  // Device previewing
  const devicePreview = useFormUIStore((state) => state.devicePreview);
  const setDevicePreview = useFormUIStore((state) => state.setDevicePreview);

  // Transform store fields to editor fields format
  const fields = useMemo(() => {
    return storeFields.map((field): EditorFormField => {
      // Convert validation rules with proper type conversions
      const validationRules = field.validation_rules ? {
        min: field.validation_rules.min,
        max: field.validation_rules.max,
        pattern: field.validation_rules.pattern,
        email: field.validation_rules.email,
        url: field.validation_rules.url,
        date: field.validation_rules.date,
        integer: field.validation_rules.integer
      } : undefined;

      return {
        id: field.id,
        type: field.type as FieldType,
        label: field.label,
        required: field.required || false,
        placeholder: field.placeholder,
        help_text: field.help_text,
        options: field.options,
        validation_rules: validationRules,
        conditional_logic: field.conditional_logic ? {
          dependsOn: field.conditional_logic.depends_on,
          condition: field.conditional_logic.condition as 'equals' | 'not_equals' | 'contains' | 'not_contains',
          value: field.conditional_logic.value
        } : undefined
      };
    });
  }, [storeFields]);

  // Get the correct container width class based on device
  const getContainerClass = () => {
    switch (devicePreview) {
      case 'mobile':
        return 'max-w-sm';
      case 'tablet':
        return 'max-w-xl';
      case 'desktop':
      default:
        return 'max-w-4xl';
    }
  };

  // Handle device change
  const handleDeviceChange = (device: 'desktop' | 'tablet' | 'mobile') => {
    setDevicePreview(device);
  };

  if (!form) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{form.title || 'Form Preview'}</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant={devicePreview === 'desktop' ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleDeviceChange('desktop')}
                className="w-8 h-8"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={devicePreview === 'tablet' ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleDeviceChange('tablet')}
                className="w-8 h-8"
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={devicePreview === 'mobile' ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleDeviceChange('mobile')}
                className="w-8 h-8"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-grow overflow-auto">
          <div className={`mx-auto ${getContainerClass()}`}>
            <FormPreview
              formName={form.title}
              formDescription={form.description || ''}
              fields={fields}
              onClose={onClose}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 