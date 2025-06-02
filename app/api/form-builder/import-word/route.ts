import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import * as mammoth from 'mammoth';
import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getAuthenticatedUser, createClient } from '@/lib/supabase/server';

// Check for OpenAI API key
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error('OPENAI_API_KEY is not set. Please set it in your environment variables.');
}

// Simple in-memory storage for active sessions
type SessionData = {
  controller: ReadableStreamDefaultController;
  uploadStarted?: boolean;
  lastPing: number;
};

const sessions = new Map<string, SessionData>();

// Clean up old sessions periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of sessions.entries()) {
      // Remove sessions that haven't received a ping in 5 minutes
      if (now - session.lastPing > 5 * 60 * 1000) {
        try {
          safelyCloseSession(session.controller, sessionId);
        } catch (e) {
          // Ignore any errors
        }
      }
    }
  }, 5 * 60 * 1000);
}

// Define the schema for form fields
const FormFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'textarea', 'checkbox', 'radio', 'select', 'date']),
  label: z.string(),
  required: z.boolean(),
  placeholder: z.string().optional().default(''),
  options: z.array(z.string()).optional(),
  conditional_logic: z.object({
    dependsOn: z.string(),
    condition: z.enum(['equals', 'not_equals', 'contains', 'not_contains']),
    value: z.string()
  }).optional()
});

const FormSchema = z.object({
  fields: z.array(FormFieldSchema)
});

// Form creation schema
const CreateFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  active: z.boolean().default(true),
  fields: z.array(FormFieldSchema)
});

// Helper function to create a Supabase client with admin privileges
async function createServerClient() {
  return await createClient();
}

// Helper function to send SSE messages
function sendSSEMessage(controller: ReadableStreamDefaultController, event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

// Helper function to safely close controller and clean up session
function safelyCloseSession(controller: ReadableStreamDefaultController, sessionId: string) {
  try {
    controller.close();
  } catch (error) {
    // Ignore "controller already closed" errors
    console.log('Note: Controller was already closed');
  }
  sessions.delete(sessionId);
}

// Helper function to process text content in chunks if it's too large
async function processLargeDocument(extractedText: string, controller?: ReadableStreamDefaultController) {
  // Define max chunk size 
  const MAX_CHUNK_SIZE = 12000;
  const chunks = [];
  let currentPosition = 0;

  // Split document into manageable chunks if necessary
  if (extractedText.length > MAX_CHUNK_SIZE) {
    if (controller) {
      sendSSEMessage(controller, 'status', { 
        message: 'Document is large, processing in chunks...',
        details: `Total text length: ${extractedText.length} characters`
      });
    }

    while (currentPosition < extractedText.length) {
      // Try to find a good breaking point (newline) near the max chunk size
      let endPosition = Math.min(currentPosition + MAX_CHUNK_SIZE, extractedText.length);
      if (endPosition < extractedText.length) {
        const nextNewline = extractedText.indexOf('\n', endPosition - 500);
        if (nextNewline !== -1 && nextNewline < endPosition + 500) {
          endPosition = nextNewline;
        }
      }

      chunks.push(extractedText.substring(currentPosition, endPosition));
      currentPosition = endPosition;
    }
  } else {
    // Document fits in a single chunk
    chunks.push(extractedText);
  }

  // Process each chunk
  const allFields = [];
  
  for (let i = 0; i < chunks.length; i++) {
    if (controller) {
      sendSSEMessage(controller, 'status', { 
        message: `Processing chunk ${i+1} of ${chunks.length}...`,
        details: `Chunk size: ${chunks[i].length} characters`
      });
    }

    try {
      // First try with generateObject - preferred for type safety
      const { object: formData } = await generateObject({
        model: openai('gpt-4.1-mini'),
        schema: FormSchema,
        prompt: `Extract form questions from this document and convert them into a structured format. 
        Identify all questions, determine appropriate field types (text, textarea, radio, checkbox, select, date), 
        whether they should be required, any placeholder text, and possible options for select/radio/checkbox fields.
        
        For conditional logic between questions, create conditional_logic objects when appropriate.
        
        Field type guidelines:
        - Use "text" for short answers (name, email, etc.)
        - Use "textarea" for longer text responses
        - Use "radio" for single-select questions with few options
        - Use "select" for single-select questions with many options
        - Use "checkbox" for multi-select questions
        - Use "date" for date inputs
        
        Here is the document chunk to process:
        
        ${chunks[i]}`,
        maxTokens: 6000,
      });

      allFields.push(...formData.fields);

    } catch (error) {
      console.log('Error with generateObject, falling back to generateText:', error);
      
      // Fallback to generateText if generateObject fails
      try {
        const { text } = await generateText({
          model: openai('gpt-4.1-mini'),
          maxTokens: 6000,
          prompt: `Extract form questions from this document and convert them into a structured JSON format. 
          Return ONLY valid JSON with a "fields" array of objects. Each field object should have:
          - id: a unique string identifier (format: field-{number})
          - type: one of "text", "textarea", "checkbox", "radio", "select", "date"
          - label: the question text
          - required: boolean value
          - placeholder: optional string
          - options: array of strings (for radio/checkbox/select fields)
          - conditional_logic: optional object with dependsOn, condition, and value properties
          
          Example JSON format:
          {
            "fields": [
              {
                "id": "field-1",
                "type": "text",
                "label": "Full Name",
                "required": true,
                "placeholder": ""
              },
              {
                "id": "field-2",
                "type": "radio",
                "label": "Gender",
                "required": true,
                "options": ["Male", "Female", "Other"],
                "placeholder": ""
              }
            ]
          }
          
          Here is the document chunk to process:
          
          ${chunks[i]}`
        });

        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            // Parse the JSON and validate it
            const parsedData = JSON.parse(jsonMatch[0]);
            
            if (parsedData && parsedData.fields && Array.isArray(parsedData.fields)) {
              const validatedFields = parsedData.fields.map((field: any, index: number) => {
                // Ensure required fields exist and have valid values
                const validField: any = { ...field };
                
                if (!validField.id || typeof validField.id !== 'string') {
                  validField.id = `field-${index + 1 + allFields.length}`;
                }
                
                if (!['text', 'textarea', 'checkbox', 'radio', 'select', 'date'].includes(validField.type)) {
                  validField.type = 'text';
                }
                
                if (!validField.label || typeof validField.label !== 'string') {
                  validField.label = `Question ${index + 1 + allFields.length}`;
                }
                
                validField.required = !!validField.required;
                validField.placeholder = validField.placeholder || '';
                
                if (['radio', 'checkbox', 'select'].includes(validField.type)) {
                  if (!Array.isArray(validField.options) || validField.options.length === 0) {
                    validField.options = ['Option 1'];
                  }
                }
                
                return validField;
              });
              
              allFields.push(...validatedFields);
            }
          } catch (e) {
            if (controller) {
              sendSSEMessage(controller, 'status', { 
                message: `Warning: Could not parse fields from chunk ${i+1}. Continuing...`,
              });
            }
            console.error('Failed to parse JSON:', e);
          }
        }
      } catch (fallbackError) {
        if (controller) {
          sendSSEMessage(controller, 'status', { 
            message: `Warning: Could not process chunk ${i+1}. Continuing...`,
          });
        }
        console.error('Fallback method also failed:', fallbackError);
      }
    }
  }

  // Ensure unique IDs
  const processedFields = allFields.map((field: any, index: number) => {
    return {
      ...field,
      id: `field-${index + 1}`
    };
  });

  console.log('Processed fields:', processedFields);

  return processedFields;
}

// Helper function to create a new form from imported fields
async function createForm(title: string, description: string | null, fields: any[], userId: string) {
  const supabase = await createServerClient();
  
  // First, check if user exists and has permissions
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  // Begin transaction by creating the form
  const { data: formData, error: formError } = await supabase
    .from('forms')
    .insert({
      title,
      description,
      active: true,
      created_by: userId
    })
    .select()
    .single();
  
  if (formError) {
    throw new Error(`Failed to create form: ${formError.message}`);
  }
  
  if (!formData) {
    throw new Error('Failed to create form: No data returned');
  }
  
  // Then insert the form fields
  const formattedFields = fields.map((field, index) => {
    return {
      form_id: formData.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder || '',
      required: !!field.required,
      options: field.options && field.options.length > 0 ? field.options : null,
      conditional_logic: field.conditional_logic || null,
      position: index,
    };
  });
  
  const { error: fieldsError } = await supabase
    .from('form_fields')
    .insert(formattedFields);
    
  if (fieldsError) {
    throw new Error(`Failed to create form fields: ${fieldsError.message}`);
  }
  
  return {
    formId: formData.id,
    title: formData.title,
    fieldsCount: formattedFields.length
  };
}

// Handle GET requests for EventSource connection
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId') || Date.now().toString();
  
  // Create a new stream
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller in the sessions map
      sessions.set(sessionId, {
        controller,
        lastPing: Date.now()
      });
      
      // Send initial connection established message
      sendSSEMessage(controller, 'status', { 
        message: 'Connection established',
        sessionId 
      });
      
      // Keep the connection alive with a ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (sessions.has(sessionId)) {
          sendSSEMessage(controller, 'ping', { timestamp: Date.now() });
          // Update last ping time
          const session = sessions.get(sessionId);
          if (session) {
            session.lastPing = Date.now();
          }
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
      
      // Clean up interval when the stream is closed
      return () => {
        clearInterval(pingInterval);
        sessions.delete(sessionId);
      };
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  
  // Handle form upload case (multipart/form-data)
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const sessionId = formData.get('sessionId')?.toString() || '';
    const file = formData.get('file');
    
    // Get the session data
    const session = sessions.get(sessionId);
    
    // If session exists, process via SSE
    if (session && session.controller) {
      // Mark upload as started to prevent duplicate processing
      if (session.uploadStarted) {
        return NextResponse.json({ error: 'Upload already in progress for this session' }, { status: 400 });
      }
      
      session.uploadStarted = true;
      
      // Process file asynchronously and stream updates
      processFileWithSSE(file, session.controller, sessionId).catch(error => {
        console.error('Error in processFileWithSSE:', error);
        try {
          sendSSEMessage(session.controller, 'error', { 
            message: error.message || 'An unexpected error occurred'
          });
          safelyCloseSession(session.controller, sessionId);
        } catch (e) {
          // Ignore errors when sending or closing
        }
      });
      
      // Return immediate success response to the POST request
      return NextResponse.json({ success: true, message: 'Processing started' });
    } else {
      // Regular JSON response for clients that don't use SSE or if session doesn't exist
      try {
        // Check if OpenAI API key is available
        if (!openaiApiKey) {
          return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
        }

        if (!file || !(file instanceof Blob)) {
          return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Check file type
        const filename = (file as any).name?.toLowerCase() || '';
        if (!filename.endsWith('.doc') && !filename.endsWith('.docx')) {
          return NextResponse.json({ error: 'File must be a Word document (.doc or .docx)' }, { status: 400 });
        }

        // Process the file
        const result = await processFile(file);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Error processing Word document:', error);
        return NextResponse.json({ error: error.message || 'Failed to process document' }, { status: 500 });
      }
    }
  } 
  // Handle form creation case (application/json)
  else if (contentType.includes('application/json')) {
    try {
      const data = await request.json();
      
      // Validate the request data
      const result = CreateFormSchema.safeParse(data);
      
      if (!result.success) {
        return NextResponse.json({ 
          error: 'Invalid form data', 
          details: result.error.format() 
        }, { status: 400 });
      }
      
      // Get the current user
      const user = await getAuthenticatedUser();
      
      if (!user.id) {
        return NextResponse.json({ error: 'User ID not available' }, { status: 401 });
      }
      
      // Create the form
      const formResult = await createForm(
        data.title,
        data.description || null,
        data.fields,
        user.id
      );
      
      return NextResponse.json({
        success: true,
        message: 'Form created successfully',
        form: formResult
      });
    } catch (error: any) {
      console.error('Error creating form:', error);
      return NextResponse.json({ 
        error: error.message || 'Failed to create form' 
      }, { status: 500 });
    }
  }
  
  // If we get here, the content type is not supported
  return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
}

// Function to process file with streaming updates
async function processFileWithSSE(file: FormDataEntryValue | null, controller: ReadableStreamDefaultController, sessionId: string) {
  try {
    // Check if OpenAI API key is available
    if (!openaiApiKey) {
      sendSSEMessage(controller, 'error', { message: 'OpenAI API key is not configured' });
      safelyCloseSession(controller, sessionId);
      return;
    }

    sendSSEMessage(controller, 'status', { message: 'Starting file processing...' });
    
    // Check file
    if (!file || !(file instanceof Blob)) {
      sendSSEMessage(controller, 'error', { message: 'No file provided' });
      safelyCloseSession(controller, sessionId);
      return;
    }

    // Check file type
    const filename = (file as any).name?.toLowerCase() || '';
    if (!filename.endsWith('.doc') && !filename.endsWith('.docx')) {
      sendSSEMessage(controller, 'error', { message: 'File must be a Word document (.doc or .docx)' });
      safelyCloseSession(controller, sessionId);
      return;
    }

    sendSSEMessage(controller, 'status', { message: 'Extracting text from document...' });
    
    // Convert the file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from Word document
    let extractedText;
    try {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } catch (error) {
      console.error('Error extracting text from Word document:', error);
      sendSSEMessage(controller, 'error', { message: 'Failed to extract text from the document' });
      safelyCloseSession(controller, sessionId);
      return;
    }

    if (!extractedText || extractedText.trim().length === 0) {
      sendSSEMessage(controller, 'error', { message: 'No text content found in the document' });
      safelyCloseSession(controller, sessionId);
      return;
    }

    sendSSEMessage(controller, 'status', { 
      message: 'Text extracted successfully. Processing with AI...',
      details: `Found ${extractedText.split(/\s+/).length} words to analyze`
    });

    try {
      // Process the document in chunks if needed
      const fields = await processLargeDocument(extractedText, controller);
      
      // Extract possible title from the document
      let suggestedTitle = '';
      try {
        // Try to generate a title based on the document content
        const { text: title } = await generateText({
          model: openai('gpt-4.1-mini'),
          prompt: `Based on the content of this document, suggest a clear, concise title for the form (max 5-7 words). 
          Return ONLY the title with no explanation or additional text.
          
          Document content:
          ${extractedText.substring(0, 2000)}...`,
          maxTokens: 100
        });
        
        suggestedTitle = title.trim();
      } catch (error) {
        console.error('Error generating title suggestion:', error);
        // If title generation fails, use a default title
        suggestedTitle = filename.replace(/\.(doc|docx)$/, '') || 'Imported Form';
      }
      
      sendSSEMessage(controller, 'success', { 
        message: 'Processing complete!', 
        fields,
        suggestedTitle,
        stats: {
          totalFields: fields.length,
          fieldTypes: fields.reduce((acc: Record<string, number>, field: any) => {
            acc[field.type] = (acc[field.type] || 0) + 1;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      console.error('Error processing document:', error);
      sendSSEMessage(controller, 'error', { message: 'Failed to process document content' });
      safelyCloseSession(controller, sessionId);
      return;
    }
    
    // Keep the connection open for a bit so the client can receive the success message
    setTimeout(() => {
      safelyCloseSession(controller, sessionId);
    }, 3000);
  } catch (error: any) {
    console.error('Error processing Word document:', error);
    sendSSEMessage(controller, 'error', { message: error.message || 'Failed to process document' });
    safelyCloseSession(controller, sessionId);
  }
}

// Function to process file without streaming (regular API mode)
async function processFile(file: Blob): Promise<any> {
  // Check if OpenAI API key is available
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  // Check file type
  const filename = (file as any).name?.toLowerCase() || '';
  if (!filename.endsWith('.doc') && !filename.endsWith('.docx')) {
    throw new Error('File must be a Word document (.doc or .docx)');
  }

  // Convert the file to buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Extract text from Word document
  let extractedText;
  try {
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value;
  } catch (error) {
    console.error('Error extracting text from Word document:', error);
    throw new Error('Failed to extract text from the document');
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('No text content found in the document');
  }

  try {
    // Process the document, potentially in chunks
    const fields = await processLargeDocument(extractedText);
    return { fields };
  } catch (error) {
    console.error('Error processing document:', error);
    throw new Error('Failed to process document content');
  }
} 