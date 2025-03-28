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