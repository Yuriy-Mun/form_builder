'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2 } from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

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

interface Dashboard {
  id: string;
  form_id: string;
}

const DEFAULT_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function PieChartWidget({ widget, dashboard }: { widget: Widget, dashboard: Dashboard }) {
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
  
  // Get form responses
  const { data: responses = [], isLoading: isLoadingResponses } = useQuery({
    queryKey: ['widget-responses', dashboard.form_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_responses')
        .select('id')
        .eq('form_id', dashboard.form_id);
      
      if (error) throw error;
      return data;
    }
  });
  
  // Get response values
  const { data: responseValues = [], isLoading: isLoadingValues } = useQuery({
    queryKey: ['widget-values', dashboard.form_id, responses.map(r => r.id).join(',')],
    enabled: responses.length > 0 && !!widget.config.groupBy,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_response_values')
        .select('*')
        .eq('field_id', widget.config.groupBy)
        .in('response_id', responses.map(r => r.id));
      
      if (error) throw error;
      return data;
    }
  });
  
  // Set the group by field
  useEffect(() => {
    if (fields.length > 0 && widget.config.groupBy) {
      const field = fields.find(f => f.id === widget.config.groupBy);
      if (field) {
        setGroupByField(field);
      }
    }
  }, [fields, widget.config.groupBy]);
  
  // Process data for the chart
  useEffect(() => {
    if (responseValues.length > 0 && groupByField) {
      const aggregation = widget.config.aggregation || 'count';
      const valueMap = new Map<string, number[]>();
      
      // Group values by their content
      for (const response of responseValues) {
        let key = response.value || 'Blank';
        
        // For boolean values, convert to Yes/No
        if (response.boolean_value !== null) {
          key = response.boolean_value ? 'Yes' : 'No';
        } 
        // For numeric fields in sum/avg/min/max, we need the actual number
        else if (response.numeric_value !== null && aggregation !== 'count') {
          valueMap.set(key, [...(valueMap.get(key) || []), response.numeric_value]);
          continue;
        }
        
        // For count, we just increase the count
        valueMap.set(key, [...(valueMap.get(key) || []), 1]);
      }
      
      // Apply aggregation
      const data = Array.from(valueMap.entries()).map(([name, values]) => {
        let value = 0;
        
        switch (aggregation) {
          case 'count':
            value = values.length;
            break;
          case 'sum':
            value = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            value = values.reduce((sum, val) => sum + val, 0) / values.length;
            break;
          case 'min':
            value = Math.min(...values);
            break;
          case 'max':
            value = Math.max(...values);
            break;
        }
        
        return { name, value };
      });
      
      // Sort data by value descending
      setChartData(data.sort((a, b) => b.value - a.value));
    }
  }, [responseValues, groupByField, widget.config.aggregation]);
  
  const isLoading = isLoadingFields || isLoadingResponses || isLoadingValues;
  const hasNoData = chartData.length === 0;
  const chartColors = widget.config.colors || DEFAULT_COLORS;
  
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
  
  const aggregationLabel = widget && widget.config.aggregation ? 
    widget.config.aggregation.charAt(0).toUpperCase() + widget.config.aggregation.slice(1) : 
    'Count';
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ 
    cx, 
    cy, 
    midAngle, 
    innerRadius, 
    outerRadius, 
    percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={90}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={chartColors[index % chartColors.length]} 
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, aggregationLabel]} />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
} 