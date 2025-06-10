'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import {
  Skeleton
} from "@/components/ui/skeleton";
import { createBrowserClient } from '@supabase/ssr';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Download, MoreVertical, Search, SlidersHorizontal, Loader2, FileSpreadsheet, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SetPageTitle, UseHeaderComponent } from '@/lib/page-context';

// Types for form and responses
interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  position: number;
}

interface Form {
  id: string;
  title: string;
  description: string | null;
}

interface ResponseValue {
  id: string;
  response_id: string;
  field_id: string;
  value: string | null;
  numeric_value: number | null;
  boolean_value: boolean | null;
}

interface FormResponse {
  id: string;
  completed_at: string;
  data: any;
  metadata: any;
  user_id: string | null;
}

interface ResponsesClientProps {
  formId: string;
  form: Form;
}

export default function ResponsesClient({ formId, form }: ResponsesClientProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch form fields
  const { data: fields = [], isLoading: isLoadingFields } = useQuery({
    queryKey: ['form-fields', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as FormField[];
    }
  });

  // Process form fields to set initial visible fields (all fields by default)
  const visibleFields = useMemo(() => {
    // If no fields are explicitly selected, show all fields
    if (selectedFields.length === 0) {
      return fields.map(field => field.id);
    }
    return selectedFields;
  }, [fields, selectedFields]);

  // Fetch form responses
  const { data: responses = [], isLoading: isLoadingResponses } = useQuery({
    queryKey: ['form-responses', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_responses')
        .select(`
          id, 
          completed_at, 
          data, 
          metadata, 
          user_id
        `)
        .eq('form_id', formId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data as FormResponse[];
    }
  });

  // Fetch response values only when we have responses
  const { data: responseValues = [], isLoading: isLoadingValues } = useQuery({
    queryKey: ['response-values', formId, responses.map(r => r.id).join(',')],
    enabled: responses.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_response_values')
        .select('*')
        .in('response_id', responses.map(r => r.id));

      if (error) throw error;
      return data as ResponseValue[];
    }
  });

  // Loading state for the entire data
  const isLoading = isLoadingFields || isLoadingResponses || isLoadingValues;

  // Create a map to easily access response values
  const responseValuesMap = useMemo(() => {
    const map = new Map();

    for (const value of responseValues) {
      if (!map.has(value.response_id)) {
        map.set(value.response_id, new Map());
      }
      map.get(value.response_id).set(value.field_id, value);
    }

    return map;
  }, [responseValues]);

  // Filter responses based on search
  const filteredResponses = useMemo(() => {
    if (!search.trim()) {
      return responses;
    }

    const searchLower = search.toLowerCase();

    return responses.filter(response => {
      // Search in response values
      const responseValueMap = responseValuesMap.get(response.id);
      if (!responseValueMap) return false;

      // Check each field value
      for (const field of fields) {
        const value = responseValueMap.get(field.id);
        if (!value) continue;

        const valueString = value.value || '';
        if (valueString.toLowerCase().includes(searchLower)) {
          return true;
        }
      }

      // Search in metadata (like user agent, IP)
      if (response.metadata &&
        JSON.stringify(response.metadata).toLowerCase().includes(searchLower)) {
        return true;
      }

      return false;
    });
  }, [responses, search, responseValuesMap, fields]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage);
  const paginatedResponses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResponses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResponses, currentPage, itemsPerPage]);

  // Prepare data for exports
  const prepareExportData = () => {
    // Prepare headers
    const headers = ['Response ID', 'Submission Date'];
    const fieldsToExport = fields;

    fieldsToExport.forEach(field => {
      headers.push(field.label);
    });

    // Prepare rows
    const rows = responses.map(response => {
      const row = [
        response.id,
        new Date(response.completed_at).toLocaleString()
      ];

      fieldsToExport.forEach(field => {
        const valueMap = responseValuesMap.get(response.id);
        const value = valueMap?.get(field.id);

        if (value) {
          // Select the most appropriate value based on field type
          if (value.boolean_value !== null) {
            row.push(value.boolean_value ? 'Yes' : 'No');
          } else if (value.numeric_value !== null) {
            row.push(value.numeric_value.toString());
          } else {
            row.push(value.value || '');
          }
        } else {
          row.push('');
        }
      });

      return row;
    });

    return { headers, rows };
  };

  // Export responses to CSV
  const exportToCSV = () => {
    setIsExporting('csv');
    try {
      const { headers, rows } = prepareExportData();

      // Combine headers and rows
      const csv = [
        headers.join(','),
        ...rows.map(row =>
          row.map(cell =>
            typeof cell === 'string' && cell.includes(',')
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          ).join(',')
        )
      ].join('\n');

      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${form.title}-responses.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    } finally {
      setIsExporting(null);
    }
  };

  // Export responses to Excel
  const exportToExcel = () => {
    setIsExporting('excel');
    try {
      const { headers, rows } = prepareExportData();

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Responses');

      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, `${form.title}-responses.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setIsExporting(null);
    }
  };

  // Export responses to PDF
  const exportToPDF = () => {
    setIsExporting('pdf');
    try {
      const { headers, rows } = prepareExportData();

      // Create new PDF document - use landscape orientation for better table fit
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      doc.setFontSize(18);
      doc.setTextColor(50, 50, 50);
      doc.text(`${form.title} - Form Responses`, 14, 15);

      // Add generation timestamp
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

      // Optimize column widths based on content
      const columnStyles: Record<string, { cellWidth: number }> = {};
      const maxCellWidth = 35; // Maximum width in mm for any column

      // Make first column (Response ID) smaller
      columnStyles['0'] = { cellWidth: 25 };

      // Make the date column fixed width
      columnStyles['1'] = { cellWidth: 20 };

      // For other columns, calculate appropriate widths
      for (let i = 2; i < headers.length; i++) {
        columnStyles[i.toString()] = { cellWidth: Math.min(headers[i].length + 3, maxCellWidth) };
      }

      // Add table with responses with improved styling
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 28,
        styles: {
          overflow: 'linebreak',
          fontSize: 9,
          cellPadding: 2,
          cellWidth: 'auto'
        },
        columnStyles: columnStyles,
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          halign: 'left'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        didDrawPage: (data) => {
          // Add footer with page number
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          const pageHeight = doc.internal.pageSize.height;
          doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, pageHeight - 10);
        }
      });

      // Save PDF
      doc.save(`${form.title}-responses.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    } finally {
      setIsExporting(null);
    }
  };

  // Get field value for display
  const getFieldValue = (responseId: string, fieldId: string) => {
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

  // Toggle selected fields for display
  const toggleFieldSelection = (fieldId: string) => {
    setSelectedFields(prev => {
      if (prev.includes(fieldId)) {
        return prev.filter(id => id !== fieldId);
      } else {
        return [...prev, fieldId];
      }
    });
  };

  return (
    <>
      <SetPageTitle title={`${form.title} - Responses`} description="View and manage form responses" />
      <UseHeaderComponent id="add-news-button">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={isLoading || responses.length === 0 || !!isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting ? `Exporting ${isExporting}...` : 'Export'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToCSV} disabled={!!isExporting}>
              <Download className="h-4 w-4 mr-2" />
              <span>CSV</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToExcel} disabled={!!isExporting}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              <span>Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToPDF} disabled={!!isExporting}>
              <FileText className="h-4 w-4 mr-2" />
              <span>PDF</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </UseHeaderComponent>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Link href={`/admin/forms`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Forms
          </Link>
        </div>

        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search responses..."
              className="pl-8 w-full"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              disabled={isLoading}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Toggle Visible Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {fields.map(field => (
                <DropdownMenuItem
                  key={field.id}
                  onClick={() => toggleFieldSelection(field.id)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={visibleFields.includes(field.id)}
                      onChange={() => { }}
                      className="mr-2"
                    />
                    <span>{field.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : responses.length > 0 ? (
          <>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Submission Date</TableHead>
                    {fields
                      .filter(field => visibleFields.includes(field.id))
                      .map(field => (
                        <TableHead key={field.id}>{field.label}</TableHead>
                      ))
                    }
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResponses.map(response => (
                    <TableRow key={response.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">
                          {formatDistanceToNow(new Date(response.completed_at), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(response.completed_at).toLocaleDateString()}
                        </div>
                      </TableCell>

                      {fields
                        .filter(field => visibleFields.includes(field.id))
                        .map(field => (
                          <TableCell key={field.id}>
                            {getFieldValue(response.id, field.id)}
                          </TableCell>
                        ))
                      }

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                // Open full response details in a modal or separate page
                                alert('View details functionality to be implemented');
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page =>
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, index, array) => {
                      // Add ellipsis when there's a gap
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <PaginationItem key={`ellipsis-${page}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })
                  }

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <div className="bg-muted rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No responses yet</h2>
            <p className="text-muted-foreground mb-4">
              There are no form submissions to display.
            </p>
            <div className="flex justify-center">
              <Link href={`/forms/${formId}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">View Form</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 