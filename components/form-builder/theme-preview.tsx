"use client";

import { useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useFormTheme } from '@/hooks/use-form-theme';

interface ThemeSettings {
  primaryColor: string;
  formTheme: string;
  layout: string;
}

interface ThemePreviewProps {
  themeSettings: ThemeSettings;
  className?: string;
}

export function ThemePreview({ themeSettings, className }: ThemePreviewProps) {
  // Применяем тему
  useFormTheme({ themeSettings });
  
  // Определяем классы на основе темы
  const getPreviewClasses = () => {
    const baseClasses = "p-4 rounded-lg transition-all duration-300";
    
    switch (themeSettings.formTheme) {
      case 'modern':
        return cn(
          baseClasses,
          "bg-gradient-to-br from-slate-50 to-slate-100 border-0"
        );
      case 'classic':
        return cn(
          baseClasses,
          "bg-white border"
        );
      case 'gradient':
        return cn(
          baseClasses,
          "bg-gradient-to-br from-blue-50 via-white to-purple-50 border-0"
        );
      default:
        return cn(
          baseClasses,
          "bg-slate-50 border"
        );
    }
  };
  
  const getCardClasses = () => {
    const baseClasses = "transition-all duration-300 scale-75 origin-top-left";
    
    switch (themeSettings.formTheme) {
      case 'modern':
        return cn(
          baseClasses,
          "rounded-2xl border-0 shadow-xl bg-white/80 backdrop-blur-sm"
        );
      case 'classic':
        return cn(
          baseClasses,
          "rounded-none border shadow-sm bg-white"
        );
      case 'gradient':
        return cn(
          baseClasses,
          "rounded-xl border-0 shadow-2xl bg-gradient-to-br from-white via-white to-slate-50"
        );
      default:
        return cn(
          baseClasses,
          "rounded-lg border shadow-sm bg-white"
        );
    }
  };
  
  const getFieldClasses = () => {
    const baseClasses = "transition-all duration-200 text-xs";
    
    switch (themeSettings.formTheme) {
      case 'modern':
        return cn(
          baseClasses,
          "rounded-xl border-2 h-8"
        );
      case 'classic':
        return cn(
          baseClasses,
          "rounded-sm border h-7"
        );
      case 'gradient':
        return cn(
          baseClasses,
          "rounded-lg border-2 bg-gradient-to-r from-white to-slate-50 h-8"
        );
      default:
        return cn(
          baseClasses,
          "rounded-lg h-8"
        );
    }
  };
  
  const getButtonClasses = () => {
    const baseClasses = "w-full transition-all duration-200 font-medium text-xs h-8";
    
    switch (themeSettings.formTheme) {
      case 'modern':
        return cn(
          baseClasses,
          "rounded-xl bg-[var(--form-primary-color)] hover:bg-[var(--form-primary-color-hover)] text-white shadow-lg"
        );
      case 'classic':
        return cn(
          baseClasses,
          "rounded-sm bg-[var(--form-primary-color)] hover:bg-[var(--form-primary-color-hover)] text-white"
        );
      case 'gradient':
        return cn(
          baseClasses,
          "rounded-lg bg-gradient-to-r from-[var(--form-primary-color)] to-[var(--form-primary-color-hover)] text-white shadow-lg"
        );
      default:
        return cn(
          baseClasses,
          "rounded-lg bg-[var(--form-primary-color)] hover:bg-[var(--form-primary-color-hover)] text-white"
        );
    }
  };
  
  return (
    <div 
      className={cn(getPreviewClasses(), className)}
      data-form-theme={themeSettings.formTheme}
      data-form-layout={themeSettings.layout}
    >
      <Card className={getCardClasses()}>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-bold">Sample Form</h3>
          <p className="text-xs text-muted-foreground">Preview of your form theme</p>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className={cn(
            "space-y-3",
            themeSettings.layout === 'two-column' && "grid grid-cols-2 gap-2 space-y-0",
            themeSettings.layout === 'compact' && "space-y-2"
          )}>
            {/* Text Input */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Name *</Label>
              <Input 
                placeholder="Enter your name" 
                className={getFieldClasses()}
                disabled
              />
            </div>
            
            {/* Email Input */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Email</Label>
              <Input 
                type="email" 
                placeholder="your@email.com" 
                className={getFieldClasses()}
                disabled
              />
            </div>
            
            {/* Select */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Category</Label>
              <Select disabled>
                <SelectTrigger className={getFieldClasses()}>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Textarea */}
            <div className="space-y-1 col-span-full">
              <Label className="text-xs font-medium">Message</Label>
              <Textarea 
                placeholder="Your message..." 
                className={cn(getFieldClasses(), "h-16 resize-none")}
                disabled
              />
            </div>
            
            {/* Radio Group */}
            <div className="space-y-1 col-span-full">
              <Label className="text-xs font-medium">Preference</Label>
              <RadioGroup disabled className="flex gap-4">
                <div className="flex items-center space-x-1">
                  <RadioGroupItem 
                    value="yes" 
                    id="yes" 
                    className="w-3 h-3"
                    style={{ color: 'var(--form-primary-color)' }}
                  />
                  <Label htmlFor="yes" className="text-xs">Yes</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem 
                    value="no" 
                    id="no" 
                    className="w-3 h-3"
                  />
                  <Label htmlFor="no" className="text-xs">No</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Checkbox */}
            <div className="flex items-center space-x-2 col-span-full">
              <Checkbox 
                id="terms" 
                className="w-3 h-3"
                style={{ color: 'var(--form-primary-color)' }}
                disabled
              />
              <Label htmlFor="terms" className="text-xs">
                I agree to the terms
              </Label>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="pt-2">
            <Button 
              className={getButtonClasses()}
              disabled
            >
              Submit Form
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 