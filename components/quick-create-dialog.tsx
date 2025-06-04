'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { IconLoader2, IconSparkles, IconFileUpload, IconEdit } from '@tabler/icons-react';
import { FormBuilder, FormValues } from '@/components/form-builder/form-builder';
import { ImportWordContent } from '@/components/form-builder/import-word-content';
import { apiClient } from '@/lib/api/client';

interface QuickCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function QuickCreateDialog({ open, onClose }: QuickCreateDialogProps) {
  const [activeTab, setActiveTab] = useState('prompt');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handlePromptGeneration = async () => {
    if (!prompt.trim()) {
      toast.error('Пожалуйста, введите описание формы');
      return;
    }

    setIsGenerating(true);

    try {
      // Используем тот же API что и для импорта из Word, но с промптом
      const response = await fetch('/api/form-builder/generate-from-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Ошибка генерации формы');
      }

      const { form } = await response.json();
      
      toast.success('Форма успешно создана!');
      onClose();
      
      // Перенаправляем на страницу редактирования созданной формы
      router.push(`/admin/forms/edit/${form.id}`);
      
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании формы');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualFormSave = async (formData: FormValues) => {
    try {
      const { form } = await apiClient.forms.create({
        title: formData.title,
        description: formData.description || null,
        active: formData.active,
      });

      toast.success('Форма создана! Теперь добавьте поля.');
      onClose();
      
      // Перенаправляем на страницу редактирования полей
      router.push(`/admin/forms/edit/${form.id}`);
      
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании формы');
    }
  };

  const handleImportWordSuccess = (formId: string) => {
    onClose();
    // Перенаправляем на страницу редактирования созданной формы
    router.push(`/admin/forms/edit/${formId}`);
  };

  const handleDialogClose = () => {
    if (!isGenerating) {
      onClose();
      setPrompt('');
      setActiveTab('prompt');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconSparkles className="h-5 w-5" />
              Быстрое создание формы
            </DialogTitle>
            <DialogDescription>
              Выберите способ создания новой формы
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="prompt" className="flex items-center gap-2">
                <IconSparkles className="h-4 w-4" />
                Из промпта
              </TabsTrigger>
              <TabsTrigger value="word" className="flex items-center gap-2">
                <IconFileUpload className="h-4 w-4" />
                Из Word
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <IconEdit className="h-4 w-4" />
                Вручную
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prompt" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Опишите форму, которую хотите создать</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Например: Форма регистрации на мероприятие с полями для имени, email, телефона, выбора типа билета и дополнительных пожеланий"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] mt-2"
                    disabled={isGenerating}
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handlePromptGeneration}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                        Генерация...
                      </>
                    ) : (
                      <>
                        <IconSparkles className="h-4 w-4" />
                        Сгенерировать форму
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="word" className="mt-6">
              <ImportWordContent onImportSuccess={handleImportWordSuccess} />
            </TabsContent>

            <TabsContent value="manual" className="mt-6">
              <FormBuilder 
                onSave={handleManualFormSave}
                onCancel={() => {}} // Пустая функция, так как отмена обрабатывается через закрытие диалога
                showRedirectSuccess={false}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

    </>
  );
} 