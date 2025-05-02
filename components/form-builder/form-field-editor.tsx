import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IconGripVertical, IconPlus, IconEye } from '@tabler/icons-react';
import { FieldEditor } from './field-editor';
import { FormPreview } from './form-preview';

// Define the form field types
export type FieldType = 'text' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'date';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[]; // For radio, checkbox, select
  placeholder?: string;
  conditional_logic?: {
    dependsOn?: string; // ID of the field this field depends on
    condition?: 'equals' | 'not_equals' | 'contains' | 'not_contains'; // Type of condition
    value?: string; // Value to compare against
  };
}

// Sortable Field Item Component
interface SortableFieldItemProps {
  field: FormField;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableFieldItem({ field, onEdit, onDelete }: SortableFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="mb-3"
    >
      <Card>
        <div className="flex items-center">
          <div 
            className="p-3 cursor-move text-gray-400 hover:text-gray-600" 
            {...attributes} 
            {...listeners}
          >
            <IconGripVertical size={20} />
          </div>
          <CardContent className="flex-1 py-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{field.label}</p>
                <p className="text-sm text-gray-500">{field.type}{field.required ? ' (required)' : ''}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(field.id)}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(field.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}

// Field selector component
interface FieldSelectorProps {
  onAddField: (type: FieldType) => void;
}

function FieldSelector({ onAddField }: FieldSelectorProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Add a Field</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <Button onClick={() => onAddField('text')} variant="outline" className="justify-start">
            <IconPlus size={16} className="mr-2" />
            Text Input
          </Button>
          <Button onClick={() => onAddField('textarea')} variant="outline" className="justify-start">
            <IconPlus size={16} className="mr-2" />
            Text Area
          </Button>
          <Button onClick={() => onAddField('checkbox')} variant="outline" className="justify-start">
            <IconPlus size={16} className="mr-2" />
            Checkbox
          </Button>
          <Button onClick={() => onAddField('radio')} variant="outline" className="justify-start">
            <IconPlus size={16} className="mr-2" />
            Radio Buttons
          </Button>
          <Button onClick={() => onAddField('select')} variant="outline" className="justify-start">
            <IconPlus size={16} className="mr-2" />
            Dropdown
          </Button>
          <Button onClick={() => onAddField('date')} variant="outline" className="justify-start">
            <IconPlus size={16} className="mr-2" />
            Date Picker
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Props for the main form field editor
interface FormFieldEditorProps {
  initialFields?: FormField[];
  onSave?: (fields: FormField[]) => void;
  onCancel?: () => void;
  formName?: string;
  formDescription?: string;
}

// Main form field editor component
export function FormFieldEditor({ 
  initialFields = [], 
  onSave, 
  onCancel, 
  formName = "Untitled Form",
  formDescription = ""
}: FormFieldEditorProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentField, setCurrentField] = useState<FormField | null>(null);
  
  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Field management functions
  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `New ${type} field`,
      required: false,
      placeholder: '',
      ...(type === 'radio' || type === 'select' || type === 'checkbox' ? { options: ['Option 1'] } : {})
    };
    
    setCurrentField(newField);
    setIsEditorOpen(true);
  };

  const editField = (id: string) => {
    const fieldToEdit = fields.find(field => field.id === id);
    if (fieldToEdit) {
      setCurrentField(fieldToEdit);
      setIsEditorOpen(true);
    }
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const handleFieldSave = (updatedField: FormField) => {
    const existingIndex = fields.findIndex(field => field.id === updatedField.id);
    
    if (existingIndex >= 0) {
      // Update existing field
      const updatedFields = [...fields];
      updatedFields[existingIndex] = updatedField;
      setFields(updatedFields);
    } else {
      // Add new field
      setFields([...fields, updatedField]);
    }
    
    setCurrentField(null);
  };

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(fields);
    }
  };

  const togglePreview = () => {
    setIsPreviewOpen(!isPreviewOpen);
  };

  if (isPreviewOpen) {
    return (
      <FormPreview
        formName={formName}
        formDescription={formDescription}
        fields={fields}
        onClose={() => setIsPreviewOpen(false)}
      />
    );
  }

  if (isEditorOpen) {
    return (
      <FieldEditor
        field={currentField}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleFieldSave}
        allFields={fields}
      />
    );
  }

  return (
    <div className="space-y-6">
      <FieldSelector onAddField={addField} />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Form Fields</CardTitle>
          {fields.length > 0 && (
            <Button variant="outline" onClick={togglePreview}>
              <IconEye size={16} className="mr-2" />
              Preview Form
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              Add form fields by selecting a field type above
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext 
                items={fields.map(field => field.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map(field => (
                  <SortableFieldItem 
                    key={field.id}
                    field={field}
                    onEdit={editField}
                    onDelete={deleteField}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button 
            variant="outline" 
            className="mr-2" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Fields
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 