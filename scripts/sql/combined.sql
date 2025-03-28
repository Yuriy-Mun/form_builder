-- Combined SQL script generated on 2025-03-28T12:47:03.849Z

-- ==========================================
-- Start of permissions.sql
-- ==========================================

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

-- ==========================================
-- Start of roles.sql
-- ==========================================

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

-- ==========================================
-- Start of roles_permissions.sql
-- ==========================================

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

-- ==========================================
-- Start of users.sql
-- ==========================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, -- Используем ID из Auth
  email VARCHAR(255) NOT NULL UNIQUE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_role_id_idx ON users (role_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to check if users table exists
CREATE OR REPLACE FUNCTION check_users_table_exists()
RETURNS BOOLEAN AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'users'
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create the check_users_table_exists function
CREATE OR REPLACE FUNCTION create_check_users_table_function()
RETURNS VOID AS $$
BEGIN
  -- Create the function to check if users table exists
  EXECUTE '
    CREATE OR REPLACE FUNCTION check_users_table_exists()
    RETURNS BOOLEAN AS $BODY$
    DECLARE
      table_exists BOOLEAN;
    BEGIN
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = ''public''
        AND table_name = ''users''
      ) INTO table_exists;
      
      RETURN table_exists;
    END;
    $BODY$ LANGUAGE plpgsql SECURITY DEFINER;
  ';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create users table if it doesn't exist
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS JSON AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'users'
  ) THEN
    -- Create users table
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX users_email_idx ON users (email);
    CREATE INDEX users_role_id_idx ON users (role_id);
    
    -- Create trigger for updated_at
    CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    
    RETURN json_build_object('success', true, 'message', 'Users table created successfully');
  ELSE
    RETURN json_build_object('success', true, 'message', 'Users table already exists');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

