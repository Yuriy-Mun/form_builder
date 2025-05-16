-- Create dashboard table
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create dashboard widgets table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'table', 'bar_chart', 'line_chart', 'pie_chart', etc.
  position INTEGER NOT NULL, -- For ordering widgets on the dashboard
  config JSONB NOT NULL, -- Widget configuration (fields to display, colors, etc.)
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  size TEXT DEFAULT 'medium', -- 'small', 'medium', 'large' for widget size in the grid
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for dashboards table
CREATE TRIGGER update_dashboards_updated_at
BEFORE UPDATE ON dashboards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for dashboard_widgets table
CREATE TRIGGER update_dashboard_widgets_updated_at
BEFORE UPDATE ON dashboard_widgets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
