-- Create a view for user permissions
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
  u.id AS user_id,
  p.id AS permission_id,
  p.name AS permission_name,
  p.slug AS permission_code
FROM 
  users u
  JOIN roles r ON u.role_id = r.id
  JOIN roles_permissions rp ON r.id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
WHERE
  r.active = true;

-- Create a function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS TABLE (
  permission_id UUID,
  permission_name VARCHAR(255),
  permission_code VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.permission_id,
    up.permission_name,
    up.permission_code
  FROM 
    user_permissions up
  WHERE 
    up.user_id = get_user_permissions.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_id UUID,
  permission_slug TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM user_permissions up
    WHERE up.user_id = user_has_permission.user_id
    AND up.permission_code = permission_slug
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 