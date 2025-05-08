import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormMetaStore } from "@/lib/store/form-meta-store";
import { useFormFieldsStore } from "@/lib/store/form-fields-store";
import { useState, useEffect } from "react";
import { Form } from "@/lib/store/form-meta-store";
import { FormField } from "@/lib/store/form-fields-store";

export function CodeTab() {
  // Локальное состояние
  const [form, setForm] = useState<Form | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  
  // Подписываемся на изменения в хранилищах
  useEffect(() => {
    const unsubscribeMeta = useFormMetaStore.subscribe(state => {
      setForm(state.form);
    });
    
    const unsubscribeFields = useFormFieldsStore.subscribe(state => {
      setFormFields(state.formFields);
    });
    
    // Инициализируем начальные значения
    setForm(useFormMetaStore.getState().form);
    setFormFields(useFormFieldsStore.getState().formFields);
    
    return () => {
      unsubscribeMeta();
      unsubscribeFields();
    };
  }, []);

  const handleCopyCode = () => {
    const code = JSON.stringify({ form, fields: formFields }, null, 2);
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Form Code</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1.5"
          onClick={handleCopyCode}
        >
          <Copy className="h-4 w-4" />
          {isCopied ? 'Copied!' : 'Copy'}
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="p-4 bg-muted rounded-lg overflow-auto text-sm h-[400px]">
          {JSON.stringify({ form, fields: formFields }, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
} 