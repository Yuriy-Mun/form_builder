import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFormMetaStore } from "@/lib/store/form-meta-store";
import { Palette, Layout, Sparkles, Check } from "lucide-react";
import { ThemePreview } from "./theme-preview";

const colorPalettes = [
  { name: 'Indigo', color: '#4f46e5', description: 'Professional & trustworthy' },
  { name: 'Blue', color: '#0ea5e9', description: 'Calm & reliable' },
  { name: 'Emerald', color: '#10b981', description: 'Fresh & positive' },
  { name: 'Amber', color: '#f59e0b', description: 'Warm & energetic' },
  { name: 'Rose', color: '#ef4444', description: 'Bold & attention-grabbing' },
  { name: 'Purple', color: '#8b5cf6', description: 'Creative & modern' },
  { name: 'Teal', color: '#14b8a6', description: 'Balanced & sophisticated' },
  { name: 'Orange', color: '#f97316', description: 'Vibrant & friendly' },
];

const formThemes = [
  { id: 'default', name: 'Default', description: 'Clean and minimal design' },
  { id: 'modern', name: 'Modern', description: 'Sleek with rounded corners' },
  { id: 'classic', name: 'Classic', description: 'Traditional form styling' },
  { id: 'gradient', name: 'Gradient', description: 'Colorful gradient accents' },
];

const layoutOptions = [
  { id: 'default', name: 'Single Column', description: 'Fields stacked vertically' },
  { id: 'two-column', name: 'Two Column', description: 'Fields in two columns' },
  { id: 'compact', name: 'Compact', description: 'Minimal spacing' },
];

export function ThemeTab() {
  // Get state and functions from form meta store
  const { themeSettings, updateThemeSettings, isSaving } = useFormMetaStore();
  
  // Local state for immediate UI updates
  const [localSettings, setLocalSettings] = useState(themeSettings);
  
  // Sync with store when it changes
  useEffect(() => {
    setLocalSettings(themeSettings);
  }, [themeSettings]);
  
  // Handle color change
  const handleColorChange = async (color: string) => {
    setLocalSettings(prev => ({ ...prev, primaryColor: color }));
    await updateThemeSettings({ primaryColor: color });
  };
  
  // Handle theme change
  const handleThemeChange = async (theme: string) => {
    setLocalSettings(prev => ({ ...prev, formTheme: theme }));
    await updateThemeSettings({ formTheme: theme });
  };
  
  // Handle layout change
  const handleLayoutChange = async (layout: string) => {
    setLocalSettings(prev => ({ ...prev, layout }));
    await updateThemeSettings({ layout });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Theme Customization</h2>
          <p className="text-sm text-muted-foreground">
            Personalize your form's appearance to match your brand
          </p>
        </div>
        {isSaving && (
          <div className="ml-auto">
            <Badge variant="secondary" className="animate-pulse">
              Saving...
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Palette */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Color Palette</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose a primary color that represents your brand
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {colorPalettes.map((palette) => (
                <button
                  key={palette.color}
                  onClick={() => handleColorChange(palette.color)}
                  className={`group relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    localSettings.primaryColor === palette.color
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full shadow-sm"
                      style={{ backgroundColor: palette.color }}
                    />
                    <div className="text-left">
                      <div className="font-medium text-sm">{palette.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {palette.description}
                      </div>
                    </div>
                  </div>
                  {localSettings.primaryColor === palette.color && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Theme */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Form Style</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Select the overall visual style for your form
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {formThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all hover:bg-accent/50 ${
                  localSettings.formTheme === theme.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{theme.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {theme.description}
                    </div>
                  </div>
                  {localSettings.formTheme === theme.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Layout Options */}
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Layout Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose how your form fields are arranged
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {layoutOptions.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => handleLayoutChange(layout.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all hover:bg-accent/50 ${
                    localSettings.layout === layout.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{layout.name}</div>
                    {localSettings.layout === layout.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {layout.description}
                  </div>
                  {/* Visual preview */}
                  <div className="mt-3 p-2 bg-muted/50 rounded">
                    {layout.id === 'default' && (
                      <div className="space-y-1">
                        <div className="h-2 bg-muted rounded w-full" />
                        <div className="h-2 bg-muted rounded w-full" />
                        <div className="h-2 bg-muted rounded w-3/4" />
                      </div>
                    )}
                    {layout.id === 'two-column' && (
                      <div className="grid grid-cols-2 gap-1">
                        <div className="h-2 bg-muted rounded" />
                        <div className="h-2 bg-muted rounded" />
                        <div className="h-2 bg-muted rounded" />
                        <div className="h-2 bg-muted rounded" />
                      </div>
                    )}
                    {layout.id === 'compact' && (
                      <div className="space-y-0.5">
                        <div className="h-1.5 bg-muted rounded w-full" />
                        <div className="h-1.5 bg-muted rounded w-full" />
                        <div className="h-1.5 bg-muted rounded w-2/3" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Live Preview</CardTitle>
          <p className="text-sm text-muted-foreground">
            See how your form will look with the current theme settings
          </p>
        </CardHeader>
        <CardContent>
          <ThemePreview 
            themeSettings={localSettings}
          />
        </CardContent>
      </Card>
    </div>
  );
} 