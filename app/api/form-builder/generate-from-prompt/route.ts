import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getAuthenticatedUser, createClient } from '@/lib/supabase/server';

// Check for OpenAI API key
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error('OPENAI_API_KEY is not set. Please set it in your environment variables.');
}

// Define the schema for form fields
const FormFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'textarea', 'checkbox', 'radio', 'select', 'date', 'email', 'phone', 'number']),
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

const FormGenerationSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema)
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Generate form structure using AI
    const { object: formData } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: FormGenerationSchema,
      prompt: `Создай структуру формы на основе следующего описания: "${prompt}"

Требования:
1. Создай подходящий заголовок и описание формы
2. Определи необходимые поля формы
3. Выбери подходящие типы полей:
   - "text" для коротких текстовых полей (имя, фамилия и т.д.)
   - "email" для email адресов
   - "phone" для телефонных номеров
   - "number" для числовых значений
   - "textarea" для длинных текстовых ответов
   - "radio" для выбора одного варианта из нескольких
   - "select" для выпадающих списков
   - "checkbox" для множественного выбора
   - "date" для дат
4. Определи, какие поля должны быть обязательными
5. Добавь подходящие placeholder'ы
6. Для radio, select и checkbox полей создай логичные варианты ответов
7. При необходимости добавь условную логику между полями

Отвечай на русском языке. Создай практичную и удобную форму.`,
      maxTokens: 4000,
    });

    // Create the form in database
    const supabase = await createClient();
    
    // Insert form
    const { data: form, error: formError } = await supabase
      .from('forms')
      .insert({
        title: formData.title,
        description: formData.description || null,
        active: true,
        status: 'published',
        created_by: user.id,
      })
      .select()
      .single();

    if (formError) {
      console.error('Error creating form:', formError);
      return NextResponse.json(
        { error: 'Failed to create form' },
        { status: 500 }
      );
    }

    // Insert form fields
    if (formData.fields.length > 0) {
      const fieldsToInsert = formData.fields.map((field, index) => ({
        form_id: form.id,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder || null,
        required: field.required,
        options: field.options && field.options.length > 0 
          ? field.options.map((option, optIndex) => ({ 
              label: option, 
              value: `option-${optIndex + 1}` 
            }))
          : null,
        conditional_logic: field.conditional_logic || null,
        position: index,
        active: true,
      }));

      const { error: fieldsError } = await supabase
        .from('form_fields')
        .insert(fieldsToInsert);

      if (fieldsError) {
        console.error('Error creating form fields:', fieldsError);
        // Try to clean up the form if field creation failed
        await supabase.from('forms').delete().eq('id', form.id);
        return NextResponse.json(
          { error: 'Failed to create form fields' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        fieldsCount: formData.fields.length
      }
    });

  } catch (error: any) {
    console.error('Error in generate-from-prompt:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 