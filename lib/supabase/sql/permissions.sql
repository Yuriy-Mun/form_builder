-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS permissions_slug_idx ON permissions (slug);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_permissions_updated_at ON permissions;
CREATE TRIGGER set_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RPC function to initialize the table through the API
CREATE OR REPLACE FUNCTION create_permissions_table()
RETURNS JSON AS $$
BEGIN
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create index on slug
  CREATE INDEX IF NOT EXISTS permissions_slug_idx ON permissions (slug);
  
  -- Create initial permissions if needed
  INSERT INTO permissions (name, slug)
  VALUES 
    ('View Dashboard', 'view-dashboard'),
    ('Manage Users', 'manage-users'),
    ('Manage Permissions', 'manage-permissions')
  ON CONFLICT (slug) DO NOTHING;
  
  RETURN json_build_object('success', true, 'message', 'Permissions table created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 