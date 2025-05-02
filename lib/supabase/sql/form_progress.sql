-- Create form_progress table
CREATE TABLE IF NOT EXISTS form_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- Stores the in-progress form data
  last_field_id UUID REFERENCES form_fields(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS form_progress_form_id_idx ON form_progress (form_id);
CREATE INDEX IF NOT EXISTS form_progress_user_id_idx ON form_progress (user_id);
CREATE INDEX IF NOT EXISTS form_progress_updated_at_idx ON form_progress (updated_at);

-- Create unique constraint to ensure only one progress record per user per form
ALTER TABLE form_progress ADD CONSTRAINT form_progress_form_user_unique UNIQUE (form_id, user_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_form_progress_updated_at ON form_progress;
CREATE TRIGGER set_form_progress_updated_at
BEFORE UPDATE ON form_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RPC function to initialize the table through the API
CREATE OR REPLACE FUNCTION create_form_progress_table()
RETURNS JSON AS $$
BEGIN
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS form_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    last_field_id UUID REFERENCES form_fields(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS form_progress_form_id_idx ON form_progress (form_id);
  CREATE INDEX IF NOT EXISTS form_progress_user_id_idx ON form_progress (user_id);
  CREATE INDEX IF NOT EXISTS form_progress_updated_at_idx ON form_progress (updated_at);
  
  -- Create unique constraint
  ALTER TABLE form_progress ADD CONSTRAINT form_progress_form_user_unique UNIQUE (form_id, user_id);
  
  RETURN json_build_object('success', true, 'message', 'Form progress table created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) policies
ALTER TABLE form_progress ENABLE ROW LEVEL SECURITY;

-- Admin can see all form progress
CREATE POLICY admin_form_progress_policy ON form_progress
  USING (
    EXISTS (
      SELECT 1 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN roles_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = auth.uid() 
      AND p.slug = 'admin.access'
      AND r.active = true
    )
  );

-- Form creators can see progress for their forms
CREATE POLICY creator_form_progress_policy ON form_progress
  USING (
    EXISTS (
      SELECT 1 FROM forms f
      WHERE f.id = form_progress.form_id
      AND f.created_by = auth.uid()
    )
  );

-- Users can see and update only their own progress
CREATE POLICY user_form_progress_policy ON form_progress
  USING (user_id = auth.uid()); 