-- Add form_id column to dashboards table
ALTER TABLE dashboards
ADD COLUMN form_id UUID REFERENCES forms(id);

-- Create an index on the form_id column
CREATE INDEX idx_dashboards_form_id ON dashboards(form_id);

-- Remove form_id column from dashboard_widgets table as it's now at the dashboard level
ALTER TABLE dashboard_widgets
DROP COLUMN IF EXISTS form_id;

-- Update the dashboard_widgets view if it exists
DROP VIEW IF EXISTS dashboard_widgets_with_form;

CREATE OR REPLACE VIEW dashboard_widgets_with_form AS
SELECT 
  dw.*,
  d.form_id
FROM 
  dashboard_widgets dw
JOIN 
  dashboards d ON dw.dashboard_id = d.id;

-- Enable row-level security
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;

-- Create policies for dashboards
CREATE POLICY "Users can view dashboards" 
ON dashboards FOR SELECT 
USING (
    EXISTS (
      SELECT 1 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN roles_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = (select auth.uid()) 
      AND p.slug = 'admin.access'
      AND r.active = true
    )
  );

CREATE POLICY "Authenticated users can create dashboards" 
ON dashboards FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN roles_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = (select auth.uid()) 
      AND p.slug = 'admin.access'
      AND r.active = true
    )
  );

CREATE POLICY "Users can update their own dashboards" 
ON dashboards FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own dashboards" 
ON dashboards FOR DELETE 
USING (auth.uid() = created_by); 