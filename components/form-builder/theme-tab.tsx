import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormUIStore } from "@/lib/store/form-ui-store";

export function ThemeTab() {
  // Локальное состояние
  const [primaryColor, setLocalPrimaryColor] = useState('#4f46e5');
  
  // Получаем функцию из хранилища
  const setPrimaryColor = useFormUIStore(state => state.setPrimaryColor);
  
  // Подписываемся на изменения в хранилище
  useEffect(() => {
    const unsubscribe = useFormUIStore.subscribe(state => {
      setLocalPrimaryColor(state.primaryColor);
    });
    
    // Инициализируем начальное значение
    const initialState = useFormUIStore.getState();
    setLocalPrimaryColor(initialState.primaryColor);
    
    return () => unsubscribe();
  }, []);
  
  // Обработчик изменения цвета
  const handleColorChange = (color: string) => {
    setLocalPrimaryColor(color);
    setPrimaryColor(color);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Customize the appearance of your form with theme settings.
          </p>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Primary Color</label>
            <div className="grid grid-cols-6 gap-2">
              {['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                <button 
                  key={color}
                  className={`w-full aspect-square rounded-full hover:opacity-80 transition-opacity ${
                    primaryColor === color ? 'ring-2 ring-offset-2 ring-primary' : 'border-2 border-muted'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Layout Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Adjust the layout and spacing of your form elements.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 