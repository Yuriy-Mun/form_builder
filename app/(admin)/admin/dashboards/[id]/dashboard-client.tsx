'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BarChart, ChevronLeft, Edit, GripVertical, LineChart, PieChart, Plus, Table, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveWidgetModal } from '@/components/ui/responsive-widget-modal';
import WidgetForm from './widget-form';
import DataTable from './widgets/data-table';
import BarChartWidget from './widgets/bar-chart';
import LineChartWidget from './widgets/line-chart';
import PieChartWidget from './widgets/pie-chart';

interface Form {
  id: string;
  title: string;
}

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  form_id: string;
  forms: {
    title: string;
  } | null;
}

interface Widget {
  id: string;
  dashboard_id: string;
  name: string;
  type: 'table' | 'bar_chart' | 'line_chart' | 'pie_chart';
  position: number;
  config: any;
  size: 'small' | 'medium' | 'large';
  form_id: string;
}

export default function DashboardClient({
  dashboardId
}: {
  dashboardId: string;
}) {
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isEditWidgetOpen, setIsEditWidgetOpen] = useState(false);
  const [activeWidget, setActiveWidget] = useState<Widget | null>(null);
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch dashboard data
  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['dashboard', dashboardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboards')
        .select('*, forms:form_id(title)')
        .eq('id', dashboardId)
        .single();
      
      if (error) throw error;
      return data as Dashboard;
    }
  });

  // Fetch dashboard widgets
  const { data: widgets = [], isLoading: isWidgetsLoading, refetch: refetchWidgets } = useQuery({
    queryKey: ['dashboard-widgets', dashboardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Widget[];
    },
    enabled: !!dashboardId
  });

  // Fetch all forms for widget creation
  const { data: forms = [], isLoading: isFormsLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('id, title')
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data as Form[];
    }
  });
  
  // State for tracking loading during form submissions
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  
  // Wrapped submission functions that handle loading states
  async function handleAddWidget(widget: Omit<Widget, 'id' | 'dashboard_id' | 'position'>) {
    setIsAddSubmitting(true);
    try {
      await addWidget(widget);
    } finally {
      setIsAddSubmitting(false);
    }
  }
  
  async function handleUpdateWidget(widget: Widget) {
    setIsEditSubmitting(true);
    try {
      await updateWidget(widget);
    } finally {
      setIsEditSubmitting(false);
    }
  }
  
  async function addWidget(widget: Omit<Widget, 'id' | 'dashboard_id' | 'position'>) {
    try {
      const position = widgets.length > 0 
        ? Math.max(...widgets.map(w => w.position)) + 1 
        : 0;
      
      const { data: newWidget, error } = await supabase
        .from('dashboard_widgets')
        .insert({
          dashboard_id: dashboardId,
          position,
          ...widget
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success('Widget added');
      setIsAddWidgetOpen(false);
      refetchWidgets();
    } catch (error) {
      console.error('Error adding widget:', error);
      toast.error('Failed to add widget');
    }
  }
  
  async function updateWidget(widget: Widget) {
    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .update({
          name: widget.name,
          type: widget.type,
          config: widget.config,
          size: widget.size
        })
        .eq('id', widget.id);
        
      if (error) throw error;
      
      toast.success('Widget updated');
      setIsEditWidgetOpen(false);
      setActiveWidget(null);
      refetchWidgets();
    } catch (error) {
      console.error('Error updating widget:', error);
      toast.error('Failed to update widget');
    }
  }
  
  async function deleteWidget(id: string) {
    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Widget deleted');
      refetchWidgets();
    } catch (error) {
      console.error('Error deleting widget:', error);
      toast.error('Failed to delete widget');
    }
  }
  
  async function handleDragEnd(event: any) {
    if (!event.active || !event.over || event.active.id === event.over.id) return;
    
    const oldIndex = widgets.findIndex(w => w.id === event.active.id);
    const newIndex = widgets.findIndex(w => w.id === event.over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newWidgets = [...widgets];
    const [movedWidget] = newWidgets.splice(oldIndex, 1);
    newWidgets.splice(newIndex, 0, movedWidget);
    
    // Update positions
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      position: index
    }));
    
    // Save the new positions to the database
    try {
      const updates = updatedWidgets.map(widget => ({
        id: widget.id,
        position: widget.position
      }));
      
      const { error } = await supabase
        .from('dashboard_widgets')
        .upsert(updates);
        
      if (error) throw error;
      
      // Refetch widgets to update the UI
      refetchWidgets();
    } catch (error) {
      console.error('Error updating widget positions:', error);
      toast.error('Failed to update widget positions');
    }
  }
  
  function renderWidget(widget: Widget) {
    switch (widget.type) {
      case 'table':
        return <DataTable widget={widget} dashboard={dashboard!} />;
      case 'bar_chart':
        return <BarChartWidget widget={widget} dashboard={dashboard!} />;
      case 'line_chart':
        return <LineChartWidget widget={widget} dashboard={dashboard!} />;
      case 'pie_chart':
        return <PieChartWidget widget={widget} dashboard={dashboard!} />;
      default:
        return <div>Unsupported widget type</div>;
    }
  }

  const isLoading = isDashboardLoading || isWidgetsLoading || isFormsLoading;

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container py-6">
        <h1 className="text-xl">Dashboard not found</h1>
        <Button 
          variant="link" 
          onClick={() => router.push('/admin/dashboards')}
          className="px-0"
        >
          Back to dashboards
        </Button>
      </div>
    );
  }
  
  // Create the add widget button
  const addWidgetButton = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Widget
    </Button>
  );
  
  // Footer components for modals
  const addWidgetFooter = (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        onClick={() => setIsAddWidgetOpen(false)}
        disabled={isAddSubmitting}
      >
        Cancel
      </Button>
      <Button 
        type="submit"
        form="add-widget-form"
        disabled={isAddSubmitting}
      >
        {isAddSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add Widget
      </Button>
    </div>
  );
  
  const editWidgetFooter = (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        onClick={() => {
          setIsEditWidgetOpen(false);
          setActiveWidget(null);
        }}
        disabled={isEditSubmitting}
      >
        Cancel
      </Button>
      <Button 
        type="submit"
        form="edit-widget-form"
        disabled={isEditSubmitting}
      >
        {isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </div>
  );
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/dashboards">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{dashboard.name}</h1>
            {dashboard.description && (
              <p className="text-muted-foreground">{dashboard.description}</p>
            )}
            {dashboard.forms && (
              <div className="text-sm text-muted-foreground mt-1">
                Form: {dashboard.forms.title}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ResponsiveWidgetModal
            title="Add Widget"
            isOpen={isAddWidgetOpen}
            onOpenChange={setIsAddWidgetOpen}
            trigger={addWidgetButton}
            footer={addWidgetFooter}
          >
            <WidgetForm 
              dashboard={dashboard}
              onSubmit={handleAddWidget}
              onCancel={() => setIsAddWidgetOpen(false)}
              formId="add-widget-form"
            />
          </ResponsiveWidgetModal>
          
          <Button 
            variant="outline"
            onClick={() => router.push(`/admin/dashboards/edit/${dashboardId}`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Dashboard
          </Button>
        </div>
      </div>
      
      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <BarChart className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">No widgets yet</h2>
          <p className="mb-8 mt-2 text-center text-sm text-muted-foreground max-w-sm">
            Add your first widget to visualize form data
          </p>
          <Button onClick={() => setIsAddWidgetOpen(true)}>Add Widget</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
              {widgets.map(widget => (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  forms={forms}
                  onEdit={(widget) => {
                    setActiveWidget(widget);
                    setIsEditWidgetOpen(true);
                  }}
                  onDelete={deleteWidget}
                >
                  {renderWidget(widget)}
                </SortableWidget>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
      
      <ResponsiveWidgetModal
        title="Edit Widget"
        isOpen={isEditWidgetOpen}
        onOpenChange={setIsEditWidgetOpen}
        footer={editWidgetFooter}
      >
        {activeWidget && (
          <WidgetForm 
            widget={activeWidget}
            dashboard={dashboard}
            onSubmit={handleUpdateWidget}
            onCancel={() => {
              setIsEditWidgetOpen(false);
              setActiveWidget(null);
            }}
            formId="edit-widget-form"
          />
        )}
      </ResponsiveWidgetModal>
    </div>
  );
}

function SortableWidget({ 
  widget,
  children,
  forms,
  onEdit,
  onDelete 
}: { 
  widget: Widget; 
  children: React.ReactNode;
  forms: Form[];
  onEdit: (widget: Widget) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  let colSpan = 'col-span-1';
  
  if (widget.size === 'medium') {
    colSpan = 'col-span-1 md:col-span-2';
  } else if (widget.size === 'large') {
    colSpan = 'col-span-1 md:col-span-2 lg:col-span-3';
  }
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-lg shadow-sm border ${colSpan}`}
    >
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 rounded hover:bg-accent"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">{widget.name}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {(() => {
                  switch (widget.type) {
                    case 'table':
                      return <Table className="h-4 w-4" />;
                    case 'bar_chart':
                      return <BarChart className="h-4 w-4" />;
                    case 'line_chart':
                      return <LineChart className="h-4 w-4" />;
                    case 'pie_chart':
                      return <PieChart className="h-4 w-4" />;
                    default:
                      return <BarChart className="h-4 w-4" />;
                  }
                })()}
                <span className="ml-1">
                  {widget.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(widget)}
          >
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm('Are you sure you want to delete this widget?')) {
                onDelete(widget.id);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>
      
      <div className="p-4">
        {children}
      </div>
    </div>
  );
} 