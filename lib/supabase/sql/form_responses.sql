-- Create form_responses table
CREATE TABLE IF NOT EXISTS form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data JSONB NOT NULL, -- Stores the actual response data
  metadata JSONB, -- Additional metadata (device info, IP, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS form_responses_form_id_idx ON form_responses (form_id);
CREATE INDEX IF NOT EXISTS form_responses_user_id_idx ON form_responses (user_id);
CREATE INDEX IF NOT EXISTS form_responses_completed_at_idx ON form_responses (completed_at);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_form_responses_updated_at ON form_responses;
CREATE TRIGGER set_form_responses_updated_at
BEFORE UPDATE ON form_responses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RPC function to initialize the table through the API
CREATE OR REPLACE FUNCTION create_form_responses_table()
RETURNS JSON AS $$
BEGIN
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    data JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS form_responses_form_id_idx ON form_responses (form_id);
  CREATE INDEX IF NOT EXISTS form_responses_user_id_idx ON form_responses (user_id);
  CREATE INDEX IF NOT EXISTS form_responses_completed_at_idx ON form_responses (completed_at);
  
  RETURN json_build_object('success', true, 'message', 'Form responses table created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) policies
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Admin can see all form responses
CREATE POLICY admin_form_responses_policy ON form_responses
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

-- Form creators can see responses for their forms
CREATE POLICY creator_form_responses_policy ON form_responses
  USING (
    EXISTS (
      SELECT 1 FROM forms f
      WHERE f.id = form_responses.form_id
      AND f.created_by = auth.uid()
    )
  );

-- Users can see their own responses
CREATE POLICY user_form_responses_policy ON form_responses
  USING (user_id = auth.uid()); 