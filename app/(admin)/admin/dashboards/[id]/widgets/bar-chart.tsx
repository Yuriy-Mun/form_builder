'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2 } from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

interface Widget {
  id: string;
  dashboard_id: string;
  name: string;
  type: 'table' | 'bar_chart' | 'line_chart' | 'pie_chart';
  position: number;
  config: {
    groupBy?: string;
    aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
    colors?: string[];
    useCreatedAtForX?: boolean;
    useCreatedAtForY?: boolean;
    dateGrouping?: 'day' | 'week' | 'month' | 'year';
    yField?: string;
  };
  size: 'small' | 'medium' | 'large';
}

interface FormField {
  id: string;
  label: string;
  type: string;
}

interface ChartData {
  name: string;
  value: number;
}

interface FormResponse {
  id: string;
  created_at: string;
}

interface AggregatedResponse {
  key: string;
  value: number;
}

interface DateAggregatedResponse {
  date_group: string;
  count: number;
}

interface Dashboard {
  id: string;
  form_id: string;
}

export default function BarChartWidget({ widget, dashboard }: { widget: Widget, dashboard: Dashboard }) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [groupByField, setGroupByField] = useState<FormField | null>(null);
  
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
  
  // Set the group by field
  useEffect(() => {
    if (fields.length > 0 && widget.config.groupBy && !widget.config.useCreatedAtForX) {
      const field = fields.find(f => f.id === widget.config.groupBy);
      if (field) {
        setGroupByField(field);
      }
    }
  }, [fields, widget.config.groupBy, widget.config.useCreatedAtForX]);
  
  // Get date-based aggregated data
  const { data: dateAggregatedData = [], isLoading: isLoadingDateAggregation } = useQuery({
    queryKey: ['widget-date-aggregation', dashboard.form_id, widget.config.dateGrouping, widget.config.aggregation, widget.config.yField],
    enabled: !!widget.config.useCreatedAtForX,
    queryFn: async () => {
      const dateFormat = getPostgresDateFormat(widget.config.dateGrouping || 'day');
      
      // If using a specific field for y-axis value, use aggregation
      if (widget.config.yField && !widget.config.useCreatedAtForY) {
        const aggregation = widget.config.aggregation || 'sum';
        
        const { data, error } = await supabase
          .rpc('aggregate_field_by_date', {
            p_form_id: dashboard.form_id,
            p_field_id: widget.config.yField,
            p_date_format: dateFormat,
            p_aggregation: aggregation
          });
        
        if (error) {
          console.error("Error fetching date aggregation with field:", error);
          throw error;
        }
        
        return data;
      } else {
        // Just count responses by date
        const { data, error } = await supabase
          .rpc('aggregate_responses_by_date', {
            p_form_id: dashboard.form_id,
            p_date_format: dateFormat
          });
        
        if (error) {
          console.error("Error fetching date aggregation:", error);
          throw error;
        }
        
        return data;
      }
    }
  });

  // Get field-based aggregated data
  const { data: fieldAggregatedData = [], isLoading: isLoadingFieldAggregation } = useQuery({
    queryKey: ['widget-field-aggregation', dashboard.form_id, widget.config.groupBy, widget.config.aggregation],
    enabled: !widget.config.useCreatedAtForX && !!widget.config.groupBy,
    queryFn: async () => {
      if (!widget.config.groupBy) return [];
      
      const aggregation = widget.config.aggregation || 'count';
      
      const { data, error } = await supabase
        .rpc('aggregate_responses_by_field', {
          p_form_id: dashboard.form_id,
          p_field_id: widget.config.groupBy,
          p_aggregation: aggregation
        });
      
      if (error) {
        console.error("Error fetching field aggregation:", error);
        throw error;
      }
      
      return data as AggregatedResponse[];
    }
  });
  
  // Process date-based data for the chart
  useEffect(() => {
    if (widget.config.useCreatedAtForX && dateAggregatedData.length > 0) {
      // Create a mapping of formatted names to original date strings for sorting
      const originalDates = new Map<string, string>();
      
      const data = dateAggregatedData.map((item: any) => {
        const formattedName = formatDateGroup(item.date_group, widget.config.dateGrouping || 'day');
        originalDates.set(formattedName, item.date_group);
        return {
          name: formattedName,
          value: item.count
        };
      });
      
      // Sort data by original date values
      setChartData(data.sort((a: any, b: any) => {
        const aOriginal = originalDates.get(a.name) || '';
        const bOriginal = originalDates.get(b.name) || '';
        
        const aDateParts = aOriginal.split('-');
        const bDateParts = bOriginal.split('-');
        
        if (aDateParts.length >= 2 && bDateParts.length >= 2) {
          return aDateParts[0] === bDateParts[0] 
            ? parseInt(aDateParts[1]) - parseInt(bDateParts[1])
            : parseInt(aDateParts[0]) - parseInt(bDateParts[0]);
        }
        return a.name.localeCompare(b.name);
      }));
    }
  }, [dateAggregatedData, widget.config.useCreatedAtForX, widget.config.dateGrouping]);
  
  // Process field-based data for the chart
  useEffect(() => {
    if (!widget.config.useCreatedAtForX && fieldAggregatedData.length > 0) {
      const data = fieldAggregatedData.map(item => ({
        name: item.key || 'Blank',
        value: item.value
      }));
      
      // Sort data by value descending for bar charts
      setChartData(data.sort((a, b) => b.value - a.value));
    }
  }, [fieldAggregatedData, widget.config.useCreatedAtForX]);
    
  // Helper function to get PostgreSQL date format based on grouping
  function getPostgresDateFormat(grouping: 'day' | 'week' | 'month' | 'year'): string {
    switch (grouping) {
      case 'day':
        return 'YYYY-MM-DD';
      case 'week':
        return 'IYYY-IW';
      case 'month':
        return 'YYYY-MM';
      case 'year':
        return 'YYYY';
      default:
        return 'YYYY-MM-DD';
    }
  }
  
  // For client-side date formatting
  function formatDateGroup(dateStr: string, grouping: 'day' | 'week' | 'month' | 'year'): string {
    if (!dateStr) return 'Unknown';
    
    try {
      switch (grouping) {
        case 'day':
          // Format YYYY-MM-DD to more readable format
          const [year, month, day] = dateStr.split('-');
          if (year && month && day) {
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (!isNaN(date.getTime())) {
              return format(date, 'MMM d, yyyy');
            }
          }
          return dateStr; // Fallback to original format
          
        case 'week':
          const [weekYear, weekNum] = dateStr.split('-');
          if (weekYear && weekNum) {
            return `Week ${weekNum}, ${weekYear}`;
          }
          return dateStr;
          
        case 'month':
          const [monthYear, monthNum] = dateStr.split('-');
          if (monthYear && monthNum) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = parseInt(monthNum) - 1;
            if (monthIndex >= 0 && monthIndex < 12) {
              return `${monthNames[monthIndex]} ${monthYear}`;
            }
          }
          return dateStr;
          
        case 'year':
          return dateStr;
          
        default:
          return dateStr;
      }
    } catch (error) {
      console.error('Error formatting date:', error, dateStr);
      return dateStr;
    }
  }
  
  const isLoading = isLoadingFields || isLoadingDateAggregation || isLoadingFieldAggregation;
  const hasNoData = chartData.length === 0;
  const chartColor = widget.config.colors?.[0] || '#2563eb';
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (hasNoData) {
    return (
      <div className="flex flex-col justify-center items-center h-48 text-muted-foreground">
        <p>No data available</p>
      </div>
    );
  }
  
  let yAxisLabel = '';
  
  if (widget.config.useCreatedAtForY) {
    yAxisLabel = 'Count';
  } else {
    yAxisLabel = widget && widget.config.aggregation ? 
      widget.config.aggregation.charAt(0).toUpperCase() + widget.config.aggregation.slice(1) : 
      'Count';
  }
  
  let xAxisLabel = '';
  
  if (widget.config.useCreatedAtForX) {
    xAxisLabel = `Date (${widget.config.dateGrouping || 'day'})`;
  } else if (groupByField) {
    xAxisLabel = groupByField.label;
  }
  
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart 
          data={chartData}
          margin={{ top: 15, right: 30, left: 25, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={80}
            tick={{ fontSize: 11 }}
            tickMargin={10}
            label={{ 
              value: xAxisLabel,
              position: 'insideBottom',
              offset: -10,
              style: { textAnchor: 'middle', fontSize: 12 }
            }}
          />
          <YAxis 
            label={{ 
              value: yAxisLabel, 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: 12 } 
            }}
            tickFormatter={(value) => {
              // Format values to be more readable (no decimals for whole numbers)
              return Number.isInteger(value) ? value.toString() : value.toFixed(1);
            }}
          />
          <Tooltip 
            formatter={(value: number) => {
              return [
                Number.isInteger(value) ? value.toString() : value.toFixed(2),
                yAxisLabel
              ];
            }}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          <Bar 
            dataKey="value" 
            fill={chartColor} 
            name={yAxisLabel}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
} 