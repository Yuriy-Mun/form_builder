import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormMetaStore } from "@/lib/store/form-meta-store";
import { createFormField } from "@/lib/store/form-utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Type,
  Mail,
  AlignLeft,
  Hash,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Calendar,
  Phone,
  Globe,
  Upload,
  Clock,
  CalendarClock,
  Sliders,
  ListChecks,
  Star,
  ToggleLeft
} from "lucide-react";

// Available field types
const availableFieldTypes = [
  { id: 'text', name: 'Text Input', icon: <Type size={18} /> },
  { id: 'email', name: 'Email', icon: <Mail size={18} /> },
  { id: 'textarea', name: 'Text Area', icon: <AlignLeft size={18} /> },
  { id: 'number', name: 'Number', icon: <Hash size={18} /> },
  { id: 'phone', name: 'Phone', icon: <Phone size={18} /> },
  { id: 'url', name: 'URL', icon: <Globe size={18} /> },
  { id: 'checkbox', name: 'Checkbox', icon: <CheckSquare size={18} /> },
  { id: 'select', name: 'Dropdown', icon: <ChevronDown size={18} /> },
  { id: 'multiselect', name: 'Multi-Select', icon: <ListChecks size={18} /> },
  { id: 'radio', name: 'Radio Group', icon: <CircleDot size={18} /> },
  { id: 'date', name: 'Date Picker', icon: <Calendar size={18} /> },
  { id: 'time', name: 'Time Picker', icon: <Clock size={18} /> },
  { id: 'datetime', name: 'Date & Time', icon: <CalendarClock size={18} /> },
  { id: 'file', name: 'File Upload', icon: <Upload size={18} /> },
  { id: 'range', name: 'Range Slider', icon: <Sliders size={18} /> },
  { id: 'rating', name: 'Rating', icon: <Star size={18} /> },
  { id: 'toggle', name: 'Toggle', icon: <ToggleLeft size={18} /> },
];

export function FieldTypeSidebar() {
  // Добавление нового поля
  const handleAddField = async (fieldType: string) => {
    const formId = useFormMetaStore.getState().form?.id;
    if (!formId) return;
    
    await createFormField(formId, fieldType);
  };
  
  return (
    <Card className="md:w-56 shrink-0 gap-3">
      <CardHeader className="border-b [.border-b]:pb-3">
        <CardTitle className="text-sm">Add Field</CardTitle>
      </CardHeader>
      <CardContent>
      <ScrollArea className="h-[calc(100vh-300px)] w-full">
        {availableFieldTypes.map((fieldType) => (
          <button
            key={fieldType.id}
            onClick={() => handleAddField(fieldType.id)}
            className="w-full flex items-center p-2 text-left rounded-md hover:bg-accent transition-colors"
          >
            <span className="mr-2 flex-shrink-0 text-muted-foreground">{fieldType.icon}</span>
            <span className="text-sm">{fieldType.name}</span>
          </button>
        ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 