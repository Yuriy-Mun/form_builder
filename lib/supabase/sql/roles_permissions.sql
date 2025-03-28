-- Create roles_permissions table (связь многие ко многим)
CREATE TABLE IF NOT EXISTS roles_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id) -- Уникальное сочетание role_id и permission_id
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS roles_permissions_role_id_idx ON roles_permissions (role_id);
CREATE INDEX IF NOT EXISTS roles_permissions_permission_id_idx ON roles_permissions (permission_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_roles_permissions_updated_at ON roles_permissions;
CREATE TRIGGER set_roles_permissions_updated_at
BEFORE UPDATE ON roles_permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RPC function to initialize the table through the API
CREATE OR REPLACE FUNCTION create_roles_permissions_table()
RETURNS JSON AS $$
BEGIN
  -- Create the table if it doesn't exist
  CREATE TABLE IF NOT EXISTS roles_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS roles_permissions_role_id_idx ON roles_permissions (role_id);
  CREATE INDEX IF NOT EXISTS roles_permissions_permission_id_idx ON roles_permissions (permission_id);
  
  RETURN json_build_object('success', true, 'message', 'Roles_permissions table created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign a permission to a role
CREATE OR REPLACE FUNCTION assign_permission_to_role(
  role_code TEXT,
  permission_slug TEXT
)
RETURNS JSON AS $$
DECLARE
  v_role_id UUID;
  v_permission_id UUID;
BEGIN
  -- Get role_id by code
  SELECT id INTO v_role_id FROM roles WHERE code = role_code;
  IF v_role_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Role not found with code: ' || role_code);
  END IF;
  
  -- Get permission_id by slug
  SELECT id INTO v_permission_id FROM permissions WHERE slug = permission_slug;
  IF v_permission_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Permission not found with slug: ' || permission_slug);
  END IF;
  
  -- Insert the relation (or do nothing if it already exists)
  INSERT INTO roles_permissions (role_id, permission_id)
  VALUES (v_role_id, v_permission_id)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  RETURN json_build_object('success', true, 'message', 'Permission assigned to role successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if a role has a permission
CREATE OR REPLACE FUNCTION role_has_permission(
  role_code TEXT,
  permission_slug TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM roles_permissions rp
    JOIN roles r ON rp.role_id = r.id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE r.code = role_code
    AND p.slug = permission_slug
    AND r.active = true
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 