-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS roles_code_idx ON roles (code);

-- Create index on active status for filtering
CREATE INDEX IF NOT EXISTS roles_active_idx ON roles (active);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_roles_updated_at ON roles;
CREATE TRIGGER set_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RPC function to initialize the table through the API
CREATE OR REPLACE FUNCTION create_roles_table()
RETURNS JSON AS $$
BEGIN
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS roles_code_idx ON roles (code);
  CREATE INDEX IF NOT EXISTS roles_active_idx ON roles (active);
  
  -- Create initial roles if needed
  INSERT INTO roles (name, code, active)
  VALUES 
    ('Administrator', 'admin', true),
    ('User', 'user', true),
    ('Guest', 'guest', true)
  ON CONFLICT (code) DO NOTHING;
  
  RETURN json_build_object('success', true, 'message', 'Roles table created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 