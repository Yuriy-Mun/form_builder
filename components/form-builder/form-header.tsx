import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from "@/components/ui/select";
import { useFormMetaStore } from "@/lib/store/form-meta-store";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { PreviewModal } from "./preview-modal";

// Form status options
const formStatusOptions = [
  { value: 'draft', label: 'Draft', description: 'Only visible to you' },
  { value: 'published', label: 'Published', description: 'Visible to everyone, accepting responses' },
  { value: 'locked', label: 'Locked', description: 'Visible but not accepting new responses' },
];

export function FormHeader() {
  // Используем локальное состояние вместо прямого доступа к store
  const [formTitle, setFormTitle] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'published' | 'locked'>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Получаем функции обновления из store
  const updateFormTitle = useFormMetaStore(state => state.updateFormTitle);
  const updateFormStatus = useFormMetaStore(state => state.updateFormStatus);
  
  // Эффект для синхронизации локального состояния с хранилищем
  useEffect(() => {
    // Подписываемся на изменения в хранилище и обновляем локальный state
    const unsubscribe = useFormMetaStore.subscribe(
      (state) => {
        setFormTitle(state.formTitle);
        setFormStatus(state.formStatus);
        setIsSaving(state.isSaving);
      }
    );
    
    // При монтировании компонента получаем начальные значения
    const initialState = useFormMetaStore.getState();
    setFormTitle(initialState.formTitle);
    setFormStatus(initialState.formStatus);
    setIsSaving(initialState.isSaving);
    
    // Отписываемся при размонтировании
    return () => unsubscribe();
  }, []);
  
  // Используем debounce для заголовка
  const debouncedTitle = useDebounce(formTitle, 1000);
  
  // Обновляем заголовок в хранилище после небольшой паузы
  useEffect(() => {
    if (debouncedTitle) {
      updateFormTitle(debouncedTitle);
    }
  }, [debouncedTitle, updateFormTitle]);

  // Обработчик изменения заголовка
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormTitle(e.target.value);
  };

  // Обработчик изменения статуса
  const handleStatusChange = (value: string) => {
    const status = value as 'draft' | 'published' | 'locked';
    setFormStatus(status);
    updateFormStatus(status);
  };

  // Toggle preview modal
  const togglePreview = () => {
    setPreviewOpen(!previewOpen);
  };

  return (
    <>
      <header className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-grow relative">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={formTitle}
              onChange={handleTitleChange}
              placeholder="Enter form title"
              className="w-full text-3xl font-bold p-3 border-none focus:outline-none focus:ring-0 bg-transparent"
            />
            {isSaving && (
              <div className="rounded-full w-5 h-5 border-2 border-primary border-t-transparent animate-spin"></div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Form Status Select */}
          <div className="w-48">
            <Select
              value={formStatus}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    formStatus === 'draft' ? 'bg-gray-400' : 
                    formStatus === 'published' ? 'bg-green-500' : 
                    'bg-amber-500'
                  }`} />
                  <span>{formStatusOptions.find(o => o.value === formStatus)?.label || 'Change status'}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {formStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        option.value === 'draft' ? 'bg-gray-400' : 
                        option.value === 'published' ? 'bg-green-500' : 
                        'bg-amber-500'
                      }`} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Preview Button */}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={togglePreview}>
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </Button>
        </div>
      </header>
      
      {/* Preview Modal */}
      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </>
  );
} 