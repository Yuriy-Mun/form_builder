import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Return mock data that matches our new schema
    const mockForm = {
      id: params.id,
      name: 'Test Form',
      description: 'This is a test form',
      fields: [
        {
          id: 'field1',
          type: 'text',
          label: 'Text Field',
          required: true,
          placeholder: 'Enter text here',
          help_text: 'This is a help text',
          width: 'full',
        },
        {
          id: 'field2',
          type: 'dropdown',
          label: 'Dropdown Field',
          required: false,
          options: [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
            { label: 'Option 3', value: 'option3' },
          ],
          width: 'half',
        },
        {
          id: 'field3',
          type: 'number',
          label: 'Number Field',
          required: false,
          number_settings: {
            prefix: '$',
            suffix: '.00',
            decimal_places: '2',
          },
          width: 'half',
        },
        {
          id: 'field4',
          type: 'date',
          label: 'Date Field',
          required: false,
          date_settings: {
            format: 'YYYY-MM-DD',
            enable_time: false,
            first_day_of_week: 0,
          },
          width: 'full',
        }
      ]
    };

    return NextResponse.json(mockForm);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Here we would update the form in the database
    // For now, just return the updated form
    
    return NextResponse.json(body);
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    );
  }
}

// TODO: Add PUT handler for updating the form (title, fields, etc.) 