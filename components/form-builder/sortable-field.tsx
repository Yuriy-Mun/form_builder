import { useState, useEffect } from "react";
import {
  Settings2,
  GripVertical,
  Trash2,
  Type,
  Mail,
  AlignLeft,
  Hash,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Calendar,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ConfirmPopover } from "@/components/ui/confirm-popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { FormField } from "@/lib/store/form-fields-store";
import { useFormFieldsStore } from "@/lib/store/form-fields-store";

interface SortableFieldProps {
  field: FormField;
  index: number;
}

export function SortableField({ field, index }: SortableFieldProps) {
  // Локальное состояние для UI
  const [editingField, setEditingField] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [fieldLabel, setLocalFieldLabel] = useState('');
  const [fieldHelpText, setLocalFieldHelpText] = useState('');
  
  // Получаем функции из хранилища
  const selectField = useFormFieldsStore(state => state.selectField);
  const deleteField = useFormFieldsStore(state => state.deleteField);
  const setFieldLabel = useFormFieldsStore(state => state.setFieldLabel);
  
  // Подписываемся на изменения состояния в хранилище
  useEffect(() => {
    const unsubscribe = useFormFieldsStore.subscribe(state => {
      setEditingField(state.editingField);
      setSelectedField(state.selectedField);
      setLocalFieldLabel(state.fieldLabel);
      setLocalFieldHelpText(state.fieldHelpText);
    });
    
    // Инициализируем начальное состояние
    const initialState = useFormFieldsStore.getState();
    setEditingField(initialState.editingField);
    setSelectedField(initialState.selectedField);
    setLocalFieldLabel(initialState.fieldLabel);
    setLocalFieldHelpText(initialState.fieldHelpText);
    
    return () => unsubscribe();
  }, []);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  // Is this the currently selected/active field?
  const isActive = editingField === field.id;

  // Обработчик изменения названия поля
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldLabel(e.target.value);
  };

  // Get field type icon
  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type size={16} className="text-muted-foreground" />;
      case 'email':
        return <Mail size={16} className="text-muted-foreground" />;
      case 'textarea':
        return <AlignLeft size={16} className="text-muted-foreground" />;
      case 'number':
        return <Hash size={16} className="text-muted-foreground" />;
      case 'checkbox':
        return <CheckSquare size={16} className="text-muted-foreground" />;
      case 'select':
        return <ChevronDown size={16} className="text-muted-foreground" />;
      case 'radio':
        return <CircleDot size={16} className="text-muted-foreground" />;
      case 'date':
        return <Calendar size={16} className="text-muted-foreground" />;
      default:
        return <FileText size={16} className="text-muted-foreground" />;
    }
  };

  // Field preview content based on type
  const getFieldPreview = () => {
    // Helper function to get option label
    const getOptionLabel = (option: any): string => {
      if (typeof option === 'string') return option;
      if (option && typeof option === 'object' && option.label) return option.label;
      return String(option);
    };
    
    // Get field options with proper type handling
    const fieldOptions = field.options || [];
    const optionsList = Array.isArray(fieldOptions) ? fieldOptions : [];
    
    switch (field.type) {
      case 'text':
        return <Input disabled placeholder="Text input" className="w-full bg-muted/50 cursor-default" />;
      case 'email':
        return <Input disabled type="email" placeholder="Email address" className="w-full bg-muted/50 cursor-default" />;
      case 'textarea':
        return <Textarea disabled placeholder="Text area content" className="w-full h-20 resize-none bg-muted/50 cursor-default" />;
      case 'number':
        return <Input disabled type="number" placeholder="0" className="w-full bg-muted/50 cursor-default" />;
      case 'checkbox':
        return (
          <div className="space-y-2">
            {optionsList.length > 0 ? (
              optionsList.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input type="checkbox" disabled className="rounded text-primary focus:ring-primary mr-2" />
                  <span className="text-sm text-muted-foreground">{getOptionLabel(option)}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center">
                <input type="checkbox" disabled className="rounded text-primary focus:ring-primary mr-2" />
                <span className="text-sm text-muted-foreground">Checkbox option</span>
              </div>
            )}
          </div>
        );
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger className="w-full bg-muted/50 cursor-default">
              <SelectValue placeholder={optionsList.length > 0 
                ? `Select ${optionsList.length} options...` 
                : "Select an option"} 
              />
            </SelectTrigger>
          </Select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {optionsList.length > 0 ? (
              optionsList.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input 
                    type="radio" 
                    disabled 
                    name={`radio-${field.id}`} 
                    className="text-primary focus:ring-primary mr-2" 
                  />
                  <span className="text-sm text-muted-foreground">{getOptionLabel(option)}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center">
                  <input type="radio" disabled name={`radio-${field.id}`} className="text-primary focus:ring-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Option 1</span>
                </div>
                <div className="flex items-center">
                  <input type="radio" disabled name={`radio-${field.id}`} className="text-primary focus:ring-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Option 2</span>
                </div>
              </>
            )}
          </div>
        );
      case 'date':
        return <Input disabled type="date" className="w-full bg-muted/50 cursor-default" />;
      default:
        return <Input disabled placeholder="Field preview" className="w-full bg-muted/50 cursor-default" />;
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-lg overflow-hidden transition-all duration-200",
        isActive 
          ? "border-2 border-primary shadow-md" 
          : "border border-border shadow-sm hover:border-primary/50",
        isDragging ? "opacity-50" : "opacity-100"
      )}
    >
      {/* Card header with field number and type indicator */}
      <div className="flex items-center justify-between p-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
            {index + 1}
          </div>
          <div className="flex items-center gap-1">
            <span className="flex items-center justify-center">{getFieldTypeIcon(field.type)}</span>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {field.type}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            className={cn(
              "p-1.5 rounded-md text-muted-foreground cursor-grab active:cursor-grabbing",
              "hover:bg-muted hover:text-foreground transition-colors"
            )}
            title="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button
            className={cn(
              "p-1.5 rounded-md text-muted-foreground",
              "hover:bg-muted hover:text-foreground transition-colors",
              isActive && "text-primary"
            )}
            title="Edit field"
            onClick={() => selectField(field)}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
          <ConfirmPopover
            trigger={
              <button 
                className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Delete field"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            }
            title="Delete field"
            description="Are you sure you want to delete this field? This action cannot be undone."
            confirmText="Delete"
            onConfirm={() => deleteField(field.id)}
          />
        </div>
      </div>
      
      {/* Field content area */}
      <div className="p-4 bg-card">
        {isActive ? (
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={selectedField?.id === field.id ? fieldLabel : field.label}
                onChange={handleLabelChange}
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-base font-medium"
                placeholder="Type your question here"
                onClick={(e) => e.stopPropagation()}
              />
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </div>
            
            {field.help_text && (
              <p className="text-sm text-muted-foreground">{field.help_text}</p>
            )}
            
            <div className="pt-2">
              {getFieldPreview()}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div 
              className="font-medium cursor-pointer"
              onClick={() => selectField(field)}
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </div>
            
            {field.help_text && (
              <p className="text-sm text-muted-foreground">{field.help_text}</p>
            )}
            
            <div className="pt-2">
              {getFieldPreview()}
            </div>
          </div>
        )}
      </div>
      
      {isActive && (
        <div className="absolute top-0 left-0 h-full w-1 bg-primary"></div>
      )}
    </div>
  );
} 