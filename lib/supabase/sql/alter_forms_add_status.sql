-- Add status column to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' NOT NULL;

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS forms_status_idx ON forms (status);

-- Update function to include status field in table creation
CREATE OR REPLACE FUNCTION create_forms_table()
RETURNS JSON AS $$
BEGIN
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(20) DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS forms_created_by_idx ON forms (created_by);
  CREATE INDEX IF NOT EXISTS forms_active_idx ON forms (active);
  CREATE INDEX IF NOT EXISTS forms_status_idx ON forms (status);
  
  RETURN json_build_object('success', true, 'message', 'Forms table created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 