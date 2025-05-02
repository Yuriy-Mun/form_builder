-- Create a function to execute SQL (admin only)
-- IMPORTANT: This function should be run by the Supabase admin
-- This function is dangerous and should only be used for initial setup
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 