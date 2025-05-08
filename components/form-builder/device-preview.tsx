import { Smartphone, Tablet, Monitor } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFormUIStore } from "@/lib/store/form-ui-store";
import { useState, useEffect } from "react";

export function DevicePreview() {
  // Используем локальное состояние для UI
  const [devicePreview, setLocalDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Получаем функцию обновления из хранилища
  const setDevicePreview = useFormUIStore(state => state.setDevicePreview);
  
  // Синхронизируем состояние с хранилищем при монтировании и при изменениях
  useEffect(() => {
    // Подписываемся на изменения в хранилище
    const unsubscribe = useFormUIStore.subscribe(
      (state) => {
        setLocalDevicePreview(state.devicePreview);
      }
    );
    
    // Инициализируем локальное состояние
    const initialState = useFormUIStore.getState();
    setLocalDevicePreview(initialState.devicePreview);
    
    // Отписываемся при размонтировании
    return () => unsubscribe();
  }, []);
  
  // Обработчик изменения устройства
  const handleDeviceChange = (value: string) => {
    const device = value as 'desktop' | 'tablet' | 'mobile';
    // Обновляем локальное состояние и хранилище
    setLocalDevicePreview(device);
    setDevicePreview(device);
  };

  return (
    <ToggleGroup type="single" value={devicePreview} onValueChange={handleDeviceChange}>
      <ToggleGroupItem value="desktop" aria-label="Desktop view" className="px-3">
        <Monitor className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="tablet" aria-label="Tablet view" className="px-3">
        <Tablet className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="mobile" aria-label="Mobile view" className="px-3">
        <Smartphone className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
} 