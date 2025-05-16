-- Create form_response_values table for analytics-friendly storage
CREATE TABLE IF NOT EXISTS form_response_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  value TEXT,
  numeric_value DOUBLE PRECISION,
  boolean_value BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS form_response_values_response_id_idx ON form_response_values (response_id);
CREATE INDEX IF NOT EXISTS form_response_values_field_id_idx ON form_response_values (field_id);
CREATE INDEX IF NOT EXISTS form_response_values_value_idx ON form_response_values (value);
CREATE INDEX IF NOT EXISTS form_response_values_numeric_value_idx ON form_response_values (numeric_value);
CREATE INDEX IF NOT EXISTS form_response_values_boolean_value_idx ON form_response_values (boolean_value);

-- Create RPC function to initialize the table through the API
CREATE OR REPLACE FUNCTION create_form_response_values_table()
RETURNS JSON AS $$
BEGIN
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS form_response_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    value TEXT,
    numeric_value DOUBLE PRECISION,
    boolean_value BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS form_response_values_response_id_idx ON form_response_values (response_id);
  CREATE INDEX IF NOT EXISTS form_response_values_field_id_idx ON form_response_values (field_id);
  CREATE INDEX IF NOT EXISTS form_response_values_value_idx ON form_response_values (value);
  CREATE INDEX IF NOT EXISTS form_response_values_numeric_value_idx ON form_response_values (numeric_value);
  CREATE INDEX IF NOT EXISTS form_response_values_boolean_value_idx ON form_response_values (boolean_value);
  
  RETURN json_build_object('success', true, 'message', 'Form response values table created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) policies
ALTER TABLE form_response_values ENABLE ROW LEVEL SECURITY;

-- Admin can see all form response values
CREATE POLICY admin_form_response_values_policy ON form_response_values
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

-- Form creators can see values for their forms
CREATE POLICY creator_form_response_values_policy ON form_response_values
  USING (
    EXISTS (
      SELECT 1 
      FROM form_responses fr
      JOIN forms f ON fr.form_id = f.id
      WHERE fr.id = form_response_values.response_id
      AND f.created_by = auth.uid()
    )
  );

-- Users can see their own response values
CREATE POLICY user_form_response_values_policy ON form_response_values
  USING (
    EXISTS (
      SELECT 1 
      FROM form_responses fr
      WHERE fr.id = form_response_values.response_id
      AND fr.user_id = auth.uid()
    )
  );