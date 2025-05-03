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

export function ImportWordDialog({ open, onClose, onImportSuccess }: ImportWordDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processStatuses, setProcessStatuses] = useState<ProcessStatus[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
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
              options: field.options || []
            }));
            
            onImportSuccess(processedFields);
            toast.success('Form questions imported successfully');
            
            // Give some time to see the success message before closing
            setTimeout(() => {
              onClose();
            }, 1000);
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

  const addStatus = (step: string, message: string, details?: string) => {
    setProcessStatuses(prev => [...prev, { step, message, details }]);
  };

  const handleDialogClose = () => {
    // Clean up EventSource when dialog is closed
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Reset states
    setFile(null);
    setIsLoading(false);
    setError(null);
    setProcessStatuses([]);
    setCurrentStatus('');
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Form Questions from Word</DialogTitle>
          <DialogDescription>
            Upload a Word document containing your form questions. The AI will automatically extract and format them.
          </DialogDescription>
        </DialogHeader>

        {!isLoading ? (
          // File selection UI
          <div 
            className={`
              mt-4 flex flex-col items-center justify-center p-10 border-2 border-dashed 
              rounded-lg transition-colors duration-200 cursor-pointer
              ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept=".doc,.docx"
              className="hidden"
            />
            
            <IconFileUpload 
              size={48} 
              className={`mb-4 ${isDragging ? 'text-primary' : 'text-gray-400'}`} 
            />
            
            <p className="text-sm font-medium mb-1">
              {file ? file.name : 'Drag & drop your Word file here'}
            </p>
            <p className="text-xs text-gray-500">
              {file ? `${(file.size / 1024).toFixed(2)} KB` : 'or click to browse (.doc, .docx)'}
            </p>
          </div>
        ) : (
          // Processing status UI
          <div className="mt-4 py-4">
            <div className="mb-4 text-center">
              <p className="text-lg font-medium mb-1">Processing your document</p>
              <p className="text-sm text-muted-foreground">{currentStatus}</p>
            </div>
            
            {/* Progress timeline */}
            <div className="space-y-3 mt-6 max-h-[200px] overflow-y-auto pr-2">
              {processStatuses.map((status, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {status.step === 'error' && <IconX className="h-5 w-5 text-red-500" />}
                    {status.step === 'success' && <IconCheck className="h-5 w-5 text-green-500" />}
                    {(status.step === 'status' || status.step === 'init') && (
                      index === processStatuses.length - 1 ? (
                        <IconLoader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                      )
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{status.message}</p>
                    {status.details && (
                      <p className="text-xs text-muted-foreground">{status.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <IconAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleDialogClose} disabled={isLoading && !error}>
            {error ? 'Close' : 'Cancel'}
          </Button>
          {!isLoading && (
            <Button 
              onClick={handleImport} 
              disabled={!file}
              className="gap-2"
            >
              Import Questions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 