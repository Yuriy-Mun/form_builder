import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import * as mammoth from 'mammoth';

// Get Claude API key from environment variables
const claudeApiKey = process.env.CLAUDE_API_KEY;

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

// Define instruction prompt for Claude
const SYSTEM_PROMPT = `You are an AI assistant specialized in extracting form questions from documents and converting them into a structured JSON format. Your task is to:

1. Identify all questions in the provided text
2. For each question, determine:
   - The question text/label
   - The appropriate field type (text, textarea, radio, checkbox, select, date)
   - Whether the field should be required
   - Any placeholder text
   - For radio/checkbox/select fields, extract the possible options
   - Identify any conditional logic (questions that depend on answers to other questions)

3. Format everything into a JSON object with a "fields" array following this structure:
{
  "fields": [
    {
      "id": "field-1",
      "type": "text", // One of: text, textarea, checkbox, radio, select, date
      "label": "Ф.И.О.",
      "required": true, // or false
      "placeholder": ""
    },
    {
      "id": "field-2",
      "type": "date",
      "label": "Дата рождения",
      "required": true,
      "placeholder": ""
    },
    {
      "id": "field-3",
      "type": "radio",
      "label": "Another question here",
      "required": false,
      "options": ["Yes", "No", "Maybe"],
      "placeholder": "",
      "conditional_logic": {
        "dependsOn": "field-1", // ID of the field this question depends on
        "condition": "equals", // One of: equals, not_equals, contains, not_contains
        "value": "Some value" // Value to compare against
      }
    }
  ]
}

Field type guidelines:
- Use "text" for short answers (name, email, etc.)
- Use "textarea" for longer text responses
- Use "radio" for single-select questions with few options
- Use "select" for single-select questions with many options
- Use "checkbox" for multi-select questions
- Use "date" for date inputs

For conditional logic, identify any phrases like "If you answered Yes to question 3..." and create appropriate conditional_logic objects.

Ensure each field has a unique "id" in the format "field-{number}" with sequential numbering.

Return ONLY the valid JSON with no additional text or explanation.`;

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
      // Check if Claude API key is available
      if (!claudeApiKey) {
        return NextResponse.json({ error: 'Claude API key is not configured' }, { status: 500 });
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

// Function to process file with streaming updates
async function processFileWithSSE(file: FormDataEntryValue | null, controller: ReadableStreamDefaultController, sessionId: string) {
  try {
    // Check if Claude API key is available
    if (!claudeApiKey) {
      sendSSEMessage(controller, 'error', { message: 'Claude API key is not configured' });
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

    // Create Anthropic client
    const anthropic = new Anthropic({
      apiKey: claudeApiKey,
    });

    // Process the extracted text with Claude
    sendSSEMessage(controller, 'status', { message: 'Analyzing document structure and identifying questions...' });
    
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: extractedText }
      ],
    });

    sendSSEMessage(controller, 'status', { message: 'AI processing complete. Parsing response...' });

    // Extract and parse the JSON response
    const responseContent = response.content.find(c => c.type === 'text')?.text;
    
    if (!responseContent) {
      sendSSEMessage(controller, 'error', { message: 'No text response from Claude' });
      safelyCloseSession(controller, sessionId);
      return;
    }
    
    let parsedData;
    
    try {
      console.log('responseContent', responseContent);
      // Try to parse the entire response as JSON
      parsedData = JSON.parse(responseContent);
    } catch (e) {
      // If that fails, try to extract JSON from the response
      sendSSEMessage(controller, 'status', { message: 'Extracting JSON from response...' });
      
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          console.log('jsonMatch', jsonMatch);
          // Попытка исправить неполный JSON
          let jsonString = jsonMatch[0];
          
          // Проверка на незавершенный JSON и попытка его восстановления
          const openBraces = (jsonString.match(/\{/g) || []).length;
          const closeBraces = (jsonString.match(/\}/g) || []).length;
          const openBrackets = (jsonString.match(/\[/g) || []).length;
          const closeBrackets = (jsonString.match(/\]/g) || []).length;
          
          // Если скобки не сбалансированы, попробуем исправить JSON
          if (openBraces > closeBraces || openBrackets > closeBrackets) {
            console.log('Unbalanced JSON detected, attempting to repair');
            
            // Проверим и обработаем ситуацию с оборванным полем options или другими массивами
            jsonString = jsonString.replace(/,\s*"options"\s*:\s*\[\s*"[^"]*"(?:\s*,\s*"[^"]*")*\s*$/g, 
              (match) => match + ']');
            
            // Закрыть массив fields, если он незавершен
            if (jsonString.includes('"fields": [') && openBrackets > closeBrackets) {
              jsonString += ']';
            }
            
            // Закрыть объект JSON если нужно
            if (openBraces > closeBraces) {
              jsonString += '}';
            }
            
            console.log('Repaired JSON:', jsonString);
          }
          
          parsedData = JSON.parse(jsonString);
          
          // Дополнительная проверка структуры полей
          if (parsedData && parsedData.fields && Array.isArray(parsedData.fields)) {
            // Проверить и исправить каждое поле
            parsedData.fields = parsedData.fields.map((field: any, index: number) => {
              const validField = { ...field };
              
              // Обеспечить наличие необходимых полей
              if (!validField.id) validField.id = `field-${index + 1}`;
              if (!validField.type) validField.type = 'text';
              if (!validField.label) validField.label = `Field ${index + 1}`;
              validField.required = !!validField.required;
              validField.placeholder = validField.placeholder || '';
              
              // Обеспечить options для соответствующих типов полей
              if ((validField.type === 'radio' || validField.type === 'checkbox' || validField.type === 'select') 
                  && (!Array.isArray(validField.options) || validField.options.length === 0)) {
                validField.options = ['Option 1'];
              }
              
              return validField;
            });
          }
        } catch (e2) {
          console.error('Failed to parse JSON from Claude response:', e2);
          sendSSEMessage(controller, 'error', { message: 'Failed to parse form structure' });
          safelyCloseSession(controller, sessionId);
          return;
        }
      } else {
        console.error('No valid JSON found in Claude response');
        sendSSEMessage(controller, 'error', { message: 'Failed to extract form structure' });
        safelyCloseSession(controller, sessionId);
        return;
      }
    }

    // Validate the parsed data has a fields array
    if (!parsedData || !parsedData.fields || !Array.isArray(parsedData.fields)) {
      sendSSEMessage(controller, 'error', { message: 'Invalid form structure returned' });
      safelyCloseSession(controller, sessionId);
      return;
    }

    // Send the final result
    sendSSEMessage(controller, 'success', { 
      message: 'Processing complete!', 
      fields: parsedData.fields,
      stats: {
        totalFields: parsedData.fields.length,
        fieldTypes: parsedData.fields.reduce((acc: any, field: any) => {
          acc[field.type] = (acc[field.type] || 0) + 1;
          return acc;
        }, {})
      }
    });
    
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
  // Check if Claude API key is available
  if (!claudeApiKey) {
    throw new Error('Claude API key is not configured');
  }

  // Create Anthropic client
  const anthropic = new Anthropic({
    apiKey: claudeApiKey,
  });

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

  // Process the extracted text with Claude
  const response = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: extractedText }
    ],
  });

  // Extract and parse the JSON response
  const responseContent = response.content.find(c => c.type === 'text')?.text;
  
  if (!responseContent) {
    throw new Error('No text response from Claude');
  }
  
  let parsedData;
  
  try {
    // Try to parse the entire response as JSON
    parsedData = JSON.parse(responseContent);
  } catch (e) {
    // If that fails, try to extract JSON from the response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        // Попытка исправить неполный JSON
        let jsonString = jsonMatch[0];
        
        // Проверка на незавершенный JSON и попытка его восстановления
        const openBraces = (jsonString.match(/\{/g) || []).length;
        const closeBraces = (jsonString.match(/\}/g) || []).length;
        const openBrackets = (jsonString.match(/\[/g) || []).length;
        const closeBrackets = (jsonString.match(/\]/g) || []).length;
        
        // Если скобки не сбалансированы, попробуем исправить JSON
        if (openBraces > closeBraces || openBrackets > closeBrackets) {
          console.log('Unbalanced JSON detected, attempting to repair');
          
          // Проверим и обработаем ситуацию с оборванным полем options или другими массивами
          jsonString = jsonString.replace(/,\s*"options"\s*:\s*\[\s*"[^"]*"(?:\s*,\s*"[^"]*")*\s*$/g, 
            (match) => match + ']');
          
          // Закрыть массив fields, если он незавершен
          if (jsonString.includes('"fields": [') && openBrackets > closeBrackets) {
            jsonString += ']';
          }
          
          // Закрыть объект JSON если нужно
          if (openBraces > closeBraces) {
            jsonString += '}';
          }
        }
        
        parsedData = JSON.parse(jsonString);
        
        // Дополнительная проверка структуры полей
        if (parsedData && parsedData.fields && Array.isArray(parsedData.fields)) {
          // Проверить и исправить каждое поле
          parsedData.fields = parsedData.fields.map((field: any, index: number) => {
            const validField = { ...field };
            
            // Обеспечить наличие необходимых полей
            if (!validField.id) validField.id = `field-${index + 1}`;
            if (!validField.type) validField.type = 'text';
            if (!validField.label) validField.label = `Field ${index + 1}`;
            validField.required = !!validField.required;
            validField.placeholder = validField.placeholder || '';
            
            // Обеспечить options для соответствующих типов полей
            if ((validField.type === 'radio' || validField.type === 'checkbox' || validField.type === 'select') 
                && (!Array.isArray(validField.options) || validField.options.length === 0)) {
              validField.options = ['Option 1'];
            }
            
            return validField;
          });
        }
      } catch (e2) {
        console.error('Failed to parse JSON from Claude response:', e2);
        throw new Error('Failed to parse form structure');
      }
    } else {
      console.error('No valid JSON found in Claude response');
      throw new Error('Failed to extract form structure');
    }
  }

  // Validate the parsed data has a fields array
  if (!parsedData || !parsedData.fields || !Array.isArray(parsedData.fields)) {
    throw new Error('Invalid form structure returned');
  }

  return parsedData;
} 