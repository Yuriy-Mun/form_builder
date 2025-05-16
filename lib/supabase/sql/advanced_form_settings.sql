-- Add advanced form settings columns to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS confirmation_message TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS require_login BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS limit_submissions BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS max_submissions_per_user INTEGER;

-- Create indexes for potentially filtered columns
CREATE INDEX IF NOT EXISTS forms_require_login_idx ON forms (require_login);
CREATE INDEX IF NOT EXISTS forms_limit_submissions_idx ON forms (limit_submissions);

-- Update the create_forms_table function to include the new columns
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
    -- Advanced settings
    email_notifications BOOLEAN DEFAULT false,
    confirmation_message TEXT,
    require_login BOOLEAN DEFAULT false,
    limit_submissions BOOLEAN DEFAULT false,
    max_submissions_per_user INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS forms_created_by_idx ON forms (created_by);
  CREATE INDEX IF NOT EXISTS forms_active_idx ON forms (active);
  CREATE INDEX IF NOT EXISTS forms_status_idx ON forms (status);
  CREATE INDEX IF NOT EXISTS forms_require_login_idx ON forms (require_login);
  CREATE INDEX IF NOT EXISTS forms_limit_submissions_idx ON forms (limit_submissions);
  
  RETURN json_build_object('success', true, 'message', 'Forms table created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 