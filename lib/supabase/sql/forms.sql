-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on created_by for faster lookups
CREATE INDEX IF NOT EXISTS forms_created_by_idx ON forms (created_by);

-- Create index on active status for filtering
CREATE INDEX IF NOT EXISTS forms_active_idx ON forms (active);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_forms_updated_at ON forms;
CREATE TRIGGER set_forms_updated_at
BEFORE UPDATE ON forms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RPC function to initialize the table through the API
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS forms_created_by_idx ON forms (created_by);
  CREATE INDEX IF NOT EXISTS forms_active_idx ON forms (active);
  
  RETURN json_build_object('success', true, 'message', 'Forms table created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) policies
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Admin can see and manage all forms
CREATE POLICY admin_forms_policy ON forms
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

-- Users can see and manage their own forms
CREATE POLICY user_forms_policy ON forms
  USING (created_by = auth.uid());

-- Users can see active forms
CREATE POLICY view_active_forms_policy ON forms
  FOR SELECT
  USING (active = true); 