-- Create form_fields table
CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- text, textarea, radio, checkbox, select, date, etc.
  label TEXT NOT NULL,
  placeholder TEXT,
  help_text TEXT,
  options JSONB, -- For radio, checkbox, select: [{label: 'Option 1', value: 'opt1'}, ...]
  required BOOLEAN NOT NULL DEFAULT false,
  conditional_logic JSONB, -- {dependsOn: 'field_id', condition: 'equals', value: 'some_value'}
  validation_rules JSONB, -- {min: 5, max: 100, pattern: '^[a-z]+$', etc}
  position INTEGER NOT NULL DEFAULT 0, -- For ordering fields
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS form_fields_form_id_idx ON form_fields (form_id);
CREATE INDEX IF NOT EXISTS form_fields_position_idx ON form_fields (position);
CREATE INDEX IF NOT EXISTS form_fields_active_idx ON form_fields (active);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_form_fields_updated_at ON form_fields;
CREATE TRIGGER set_form_fields_updated_at
BEFORE UPDATE ON form_fields
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RPC function to initialize the table through the API
CREATE OR REPLACE FUNCTION create_form_fields_table()
RETURNS JSON AS $$
BEGIN
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    label TEXT NOT NULL,
    placeholder TEXT,
    help_text TEXT,
    options JSONB,
    required BOOLEAN NOT NULL DEFAULT false,
    conditional_logic JSONB,
    validation_rules JSONB,
    position INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS form_fields_form_id_idx ON form_fields (form_id);
  CREATE INDEX IF NOT EXISTS form_fields_position_idx ON form_fields (position);
  CREATE INDEX IF NOT EXISTS form_fields_active_idx ON form_fields (active);
  
  RETURN json_build_object('success', true, 'message', 'Form fields table created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) policies
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

-- Admin can see and manage all form fields
CREATE POLICY admin_form_fields_policy ON form_fields
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

-- Users can see and manage fields for their own forms
CREATE POLICY user_form_fields_policy ON form_fields
  USING (
    EXISTS (
      SELECT 1 FROM forms f
      WHERE f.id = form_fields.form_id
      AND f.created_by = auth.uid()
    )
  );

-- Everyone can see fields for active forms
CREATE POLICY view_active_form_fields_policy ON form_fields
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forms f
      WHERE f.id = form_fields.form_id
      AND f.active = true
    )
    AND active = true
  ); 