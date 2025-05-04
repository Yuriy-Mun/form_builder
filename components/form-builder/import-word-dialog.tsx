'use client';

import { useState, useRef, useEffect } from 'react';
import { IconFileUpload, IconLoader2, IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from './form-field-editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';

interface ImportWordDialogProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess: (fields: FormField[]) => void;
}

type ProcessStatus = {
  step: string;
  message: string;
  details?: string;
};

// Define type for SSE events
interface MessageEvent {
  data: string;
  type: string;
  lastEventId: string;
}

type ImportFormData = {
  title: string;
  description: string;
  active: boolean;
  fields: FormField[];
};

export function ImportWordDialog({ open, onClose, onImportSuccess }: ImportWordDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processStatuses, setProcessStatuses] = useState<ProcessStatus[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [formData, setFormData] = useState<ImportFormData>({
    title: '',
    description: '',
    active: true,
    fields: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Clean up EventSource on unmount or when dialog closes
  useEffect(() => {
    if (!open && eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [open]);

  // Add this function to handle saving the form
  const handleSaveForm = async () => {
    if (formData.fields.length === 0) {
      toast.error('No fields to save');
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create Supabase client
      const supabase = createClient();
      
      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        toast.error('You must be logged in to create a form');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1000);
        return;
      }
      
      // First, insert the form
      const { data: formRecord, error: formError } = await supabase
        .from('forms')
        .insert({
          title: formData.title,
          description: formData.description || null,
          active: formData.active,
          created_by: userData.user.id
        })
        .select()
        .single();
      
      if (formError) {
        throw new Error(`Failed to create form: ${formError.message}`);
      }
      
      if (!formRecord) {
        throw new Error('Failed to create form: No data returned');
      }
      
      // Then insert the form fields
      const formattedFields = formData.fields.map((field, index) => ({
        form_id: formRecord.id,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder || '',
        required: !!field.required,
        options: field.options && field.options.length > 0 ? field.options : null,
        conditional_logic: field.conditional_logic || null,
        position: index,
      }));
      
      const { error: fieldsError } = await supabase
        .from('form_fields')
        .insert(formattedFields);
        
      if (fieldsError) {
        throw new Error(`Failed to create form fields: ${fieldsError.message}`);
      }
      
      toast.success('Form created successfully!');
      onClose();
      
      // Redirect to the forms list after short delay
      setTimeout(() => {
        window.location.href = '/admin/forms';
      }, 500);
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to save form');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleFile = (selectedFile: File) => {
    // Reset states when a new file is selected
    setError(null);
    setProcessStatuses([]);
    setCurrentStatus('');
    setShowSaveForm(false);
    setFormData({
      title: '',
      description: '',
      active: true,
      fields: []
    });
    
    // Check if file is a Word document
    if (!selectedFile.name.endsWith('.docx') && !selectedFile.name.endsWith('.doc')) {
      toast.error('Please upload a Word document (.doc or .docx)');
      return;
    }

    setFile(selectedFile);
    toast.success(`File "${selectedFile.name}" selected`);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    // Reset states
    setIsLoading(true);
    setError(null);
    setProcessStatuses([]);
    setCurrentStatus('Preparing to import...');
    setShowSaveForm(false);

    try {
      // Close any existing EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Add initial status
      addStatus('init', 'Initializing import process');

      // 1. Create EventSource connection first
      const sessionId = Date.now().toString();
      const eventSource = new EventSource(`/api/form-builder/import-word?sessionId=${sessionId}`);
      eventSourceRef.current = eventSource;

      // 2. Set up event listeners
      eventSource.addEventListener('status', (event) => {
        try {
          if (event instanceof MessageEvent) {
            const data = JSON.parse(event.data);
            addStatus('status', data.message, data.details);
            setCurrentStatus(data.message);
          }
        } catch (err) {
          console.error('Error parsing status event:', err);
        }
      });

      eventSource.addEventListener('error', (event) => {
        try {
          if (event instanceof MessageEvent && event.data) {
            const data = JSON.parse(event.data);
            setError(data.message || 'An error occurred');
            addStatus('error', data.message || 'An error occurred');
          } else {
            // Handle EventSource connection error
            console.error('EventSource error:', event);
            // Only set error if we haven't received a success yet
            if (!processStatuses.some(status => status.step === 'success')) {
              setError('Connection error occurred');
              addStatus('error', 'Connection error occurred');
            }
          }
        } catch (err) {
          console.error('Error handling error event:', err);
          setError('An error occurred while processing the file');
          addStatus('error', 'An error occurred while processing the file');
        } finally {
          setIsLoading(false);
          if (event.type === 'error' && eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        }
      });

      eventSource.addEventListener('success', (event) => {
        try {
          if (event instanceof MessageEvent) {
            const data = JSON.parse(event.data);
            addStatus('success', data.message, `Found ${data.fields.length} questions`);
            
            // Ensure fields have the correct structure
            const processedFields = data.fields.map((field: any) => ({
              id: field.id || `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: field.type || 'text',
              label: field.label || 'Untitled Field',
              required: field.required !== undefined ? field.required : false,
              placeholder: field.placeholder || '',
              options: field.options || [],
              conditional_logic: field.conditional_logic
            }));
            
            // Update form data with suggested title if available
            setFormData({
              title: data.suggestedTitle || file.name.replace(/\.(docx|doc)$/, ''),
              description: '',
              active: true,
              fields: processedFields
            });
            
            // Show the save form option
            setShowSaveForm(true);
            
            // Switch to the save tab
            setCurrentTab('save');
            
            // Store fields for later use if needed, but DO NOT close the dialog
            onImportSuccess(processedFields);

            // Show a toast notification to indicate success
            toast.success('Document processed successfully! You can now save your form.');
          }
        } catch (err) {
          console.error('Error parsing success event:', err);
          setError('An error occurred while processing the response');
          addStatus('error', 'An error occurred while processing the response');
        } finally {
          setIsLoading(false);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        }
      });

      eventSource.addEventListener('ping', () => {
        // Keep-alive ping received, do nothing
      });

      // Wait for the connection to be established
      eventSource.addEventListener('open', async () => {
        try {
          addStatus('status', 'Connection established, uploading file...');
          
          // 3. When EventSource is connected, upload the file with POST request
          const formData = new FormData();
          formData.append('file', file);
          formData.append('sessionId', sessionId);

          const response = await fetch('/api/form-builder/import-word', {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'text/event-stream',
            },
          });

          if (!response.ok && eventSourceRef.current) {
            // If POST fails but we still have an open connection, we'll get the error via event stream
            console.error('POST request failed:', response.status, response.statusText);
          }
        } catch (error: any) {
          console.error('Error uploading file:', error);
          setError(error.message || 'Failed to upload file');
          addStatus('error', error.message || 'Failed to upload file');
          setIsLoading(false);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        }
      });
    } catch (error: any) {
      setError(error.message || 'An error occurred while importing the file');
      addStatus('error', error.message || 'An error occurred while importing the file');
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    if (isLoading) {
      if (confirm('Upload is in progress. Are you sure you want to cancel?')) {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        onClose();
      }
    } else {
      onClose();
    }
  };

  const addStatus = (step: string, message: string, details?: string) => {
    setProcessStatuses(prevStatuses => [
      ...prevStatuses,
      { step, message, details }
    ]);
  };

  const renderStatusIcon = (step: string) => {
    switch (step) {
      case 'init':
      case 'status':
        return isLoading ? (
          <IconLoader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <div className="h-5 w-5 rounded-full bg-primary/20" />
        );
      case 'success':
        return <IconCheck className="h-5 w-5 text-green-500" />;
      case 'error':
        return <IconX className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-muted" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Form from Word Document</DialogTitle>
          <DialogDescription>
            Upload a Word document to automatically convert it into a form.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="save" disabled={!showSaveForm}>Save Form</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="pt-4">
            {!isLoading && !error && !showSaveForm && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="mx-auto flex flex-col items-center">
                  <IconFileUpload className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Drag & Drop or Click to Upload</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Support for .doc and .docx files
                  </p>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".doc,.docx"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="secondary"
                  >
                    Browse Files
                  </Button>
                </div>
              </div>
            )}

            {file && !isLoading && !error && !showSaveForm && (
              <div className="mt-4 flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center">
                  <IconFileUpload className="h-5 w-5 text-primary mr-2" />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {file.name}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={isLoading}
                >
                  Process File
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <IconLoader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">{currentStatus}</p>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 space-y-3">
                  {processStatuses.map((status, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="mt-0.5">{renderStatusIcon(status.step)}</div>
                      <div>
                        <p className={`font-medium ${status.step === 'error' ? 'text-red-500' : ''}`}>
                          {status.message}
                        </p>
                        {status.details && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {status.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md flex items-start space-x-3">
                <IconAlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="save" className="space-y-4 pt-4">
            {showSaveForm && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Form Title</Label>
                  <Input 
                    id="title" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter form title" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter form description" 
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                  />
                  <Label htmlFor="active">Make form active immediately</Label>
                </div>
                
                <div className="border rounded-md p-4 mt-4">
                  <h3 className="font-medium mb-2">Form Fields Preview</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {formData.fields.length} fields extracted from document
                  </p>
                  
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {formData.fields.map((field, index) => (
                      <div key={field.id} className="flex justify-between p-2 rounded bg-muted text-sm">
                        <div className="truncate max-w-[200px]">
                          <span className="font-medium">{field.label}</span>
                        </div>
                        <div className="text-muted-foreground">
                          <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
                            {field.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {showSaveForm && currentTab === 'save' && (
            <>
              <Button variant="outline" onClick={() => setCurrentTab('upload')}>
                Back
              </Button>
              <Button onClick={handleSaveForm} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Form'}
              </Button>
            </>
          )}
          
          {currentTab === 'upload' && (
            <>
              <Button variant="outline" onClick={handleDialogClose} disabled={isLoading}>
                Cancel
              </Button>
              {showSaveForm && (
                <Button onClick={() => setCurrentTab('save')} disabled={isLoading}>
                  Continue to Save
                </Button>
              )}
              {!showSaveForm && file && !isLoading && (
                <Button onClick={handleImport} disabled={isLoading || !file}>
                  Process File
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 