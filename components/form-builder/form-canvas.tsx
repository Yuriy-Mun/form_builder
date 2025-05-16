import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Layers } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableField } from "./sortable-field";
import { arrayMove } from "@dnd-kit/sortable";
import { FormField } from "@/lib/store/form-fields-store";
import { useFormFieldsStore } from "@/lib/store/form-fields-store";
import { useFormMetaStore } from "@/lib/store/form-meta-store";
import { createFormField } from "@/lib/store/form-utils";

export function FormCanvas() {
  // Используем локальное состояние вместо прямого доступа к store
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  
  // Получаем функции из store правильным образом - через селекторы
  const deselectField = useFormFieldsStore(state => state.deselectField);
  const updateFieldPositions = useFormFieldsStore(state => state.updateFieldPositions);
  
  // Подписываемся на изменения в хранилище полей формы
  useEffect(() => {
    // Подписка на изменения полей и выбранного поля
    const unsubscribe = useFormFieldsStore.subscribe(state => {
      setFormFields(state.formFields);
      setSelectedField(state.selectedField);
    });
    
    // Начальное состояние при монтировании
    const initialState = useFormFieldsStore.getState();
    setFormFields(initialState.formFields);
    setSelectedField(initialState.selectedField);
    
    // Отписываемся при размонтировании
    return () => unsubscribe();
  }, []);
  
  // Функция для добавления нового поля
  const handleAddField = async (fieldType: string) => {
    const formId = useFormMetaStore.getState().form?.id;
    if (!formId) return;
    
    await createFormField(formId, fieldType);
  };

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = formFields.findIndex(f => f.id === active.id);
    const newIndex = formFields.findIndex(f => f.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    
    // Update the local state order
    const updatedFields = arrayMove(formFields, oldIndex, newIndex);
    
    // Update position values
    const reorderedFields = updatedFields.map((field, index) => ({
      ...field,
      position: index,
    }));
    
    // Update positions in store/database
    updateFieldPositions(reorderedFields);
  };

  return (
    <div className="flex-grow flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 overflow-hidden">
      {/* Canvas Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <h2 className="text-sm font-medium">Form Canvas</h2>
      </div>
      
      {/* Canvas Content - Form Builder */}
      <div 
        className={`flex-grow overflow-y-auto p-6 ${selectedField ? 'cursor-pointer' : ''}`}
        onClick={(e) => {
          if (e.currentTarget === e.target) {
            deselectField();
          }
        }}
      >
        {formFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-10">
            <div className="bg-muted/30 p-4 rounded-full">
              <Layers className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <div>
              <p className="font-medium text-lg">Your form is empty</p>
              <p className="text-sm mt-1">Drag and drop form elements from the left sidebar</p>
            </div>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => handleAddField('text')}
              className="mt-2"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add first field
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={formFields.map(field => field.id)}
                strategy={verticalListSortingStrategy}
              >
                {formFields.map((field, index) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    index={index}
                  />
                ))}
              </SortableContext>
            </DndContext>
            
            {/* Add Field Button */}
            <button
              onClick={() => handleAddField('text')}
              className="w-full p-3 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-muted-foreground hover:bg-muted/30 hover:border-muted-foreground transition-colors text-sm flex items-center justify-center"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add a new field
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 