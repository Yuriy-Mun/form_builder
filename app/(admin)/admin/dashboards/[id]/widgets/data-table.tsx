'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Widget {
  id: string;
  dashboard_id: string;
  name: string;
  type: 'table' | 'bar_chart' | 'line_chart' | 'pie_chart';
  position: number;
  config: {
    fields?: string[];
    limit?: number;
  };
  size: 'small' | 'medium' | 'large';
}

interface Dashboard {
  id: string;
  form_id: string;
}

interface FormField {
  id: string;
  label: string;
  type: string;
}

export default function DataTable({ 
  widget, 
  dashboard 
}: { 
  widget: Widget;
  dashboard: Dashboard;
}) {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Get form fields
  const { data: fields = [], isLoading: isLoadingFields } = useQuery({
    queryKey: ['widget-fields', dashboard.form_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_fields')
        .select('id, label, type')
        .eq('form_id', dashboard.form_id)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as FormField[];
    }
  });
  
  // Get form responses
  const { data: responses = [], isLoading: isLoadingResponses } = useQuery({
    queryKey: ['widget-responses', dashboard.form_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_responses')
        .select(`
          id, 
          completed_at, 
          data, 
          metadata
        `)
        .eq('form_id', dashboard.form_id)
        .order('completed_at', { ascending: false })
        .limit(widget.config.limit || 10);
      
      if (error) throw error;
      return data;
    }
  });
  
  // Get response values
  const { data: responseValues = [], isLoading: isLoadingValues } = useQuery({
    queryKey: ['widget-response-values', dashboard.form_id, responses.map(r => r.id).join(',')],
    enabled: responses.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_response_values')
        .select('*')
        .in('response_id', responses.map(r => r.id));
      
      if (error) throw error;
      return data;
    }
  });
  
  // When fields are loaded, update the state
  useEffect(() => {
    if (fields.length > 0) {
      // If no fields are specified in config or "all" is selected, show all fields
      if (!widget.config.fields || widget.config.fields.includes('all')) {
        setFormFields(fields);
      } else {
        // Otherwise filter to only the selected fields
        setFormFields(fields.filter(field => widget.config.fields?.includes(field.id)));
      }
    }
  }, [fields, widget.config.fields]);
  
  // Create a map for easy lookup of response values
  const responseValuesMap = new Map();
  for (const value of responseValues) {
    if (!responseValuesMap.has(value.response_id)) {
      responseValuesMap.set(value.response_id, new Map());
    }
    responseValuesMap.get(value.response_id).set(value.field_id, value);
  }
  
  // Get formatted value
  const getFormattedValue = (responseId: string, fieldId: string) => {
    const valueMap = responseValuesMap.get(responseId);
    if (!valueMap) return '';
    
    const value = valueMap.get(fieldId);
    if (!value) return '';
    
    if (value.boolean_value !== null) {
      return value.boolean_value ? 'Yes' : 'No';
    } else if (value.numeric_value !== null) {
      return value.numeric_value.toString();
    } else {
      return value.value || '';
    }
  };
  
  const isLoading = isLoadingFields || isLoadingResponses || isLoadingValues;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {formFields.map(field => (
              <TableHead key={field.id}>{field.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {responses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={formFields.length} className="text-center h-24 text-muted-foreground">
                No data available
              </TableCell>
            </TableRow>
          ) : (
            responses.map(response => (
              <TableRow key={response.id}>
                {formFields.map(field => (
                  <TableCell key={`${response.id}-${field.id}`}>
                    {getFormattedValue(response.id, field.id)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 