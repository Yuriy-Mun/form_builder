import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Simply echo back the data for now, but in a real app
    // this might generate a preview HTML or validate the form
    return NextResponse.json({
      success: true,
      formData,
      preview: {
        html: `<div class="form-preview">
                <h2>${formData.name || 'Form Preview'}</h2>
                <p>${formData.description || 'Form description would appear here'}</p>
                <div class="form-fields">
                  ${(formData.fields || []).map((field: any) => `
                    <div class="form-field">
                      <label>${field.label}</label>
                      <input type="${mapFieldType(field.type)}" placeholder="${field.placeholder || ''}">
                      ${field.help_text ? `<div class="help-text">${field.help_text}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>`
      }
    });
  } catch (error) {
    console.error('Error processing form preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}

// Helper function to map field types to HTML input types
function mapFieldType(fieldType: string): string {
  const typeMap: Record<string, string> = {
    text: 'text',
    email: 'email',
    number: 'number',
    date: 'date',
    time: 'time',
    datetime: 'datetime-local',
    url: 'url',
    tel: 'tel',
    password: 'password',
    color: 'color',
    range: 'range',
    file: 'file',
    dropdown: 'select',
    checkbox: 'checkbox',
    radio: 'radio',
    textarea: 'textarea',
    // Add more mappings as needed
  };
  
  return typeMap[fieldType] || 'text';
}
