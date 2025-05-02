-- Create the form_fields table if it doesn't exist
CREATE TABLE IF NOT EXISTS form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    options JSONB, -- For select, radio, checkbox fields
    placeholder TEXT,
    conditional_logic JSONB, -- For fields that should show/hide based on other field values
    "order" INTEGER NOT NULL, -- For storing the display order 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookup by form_id
CREATE INDEX IF NOT EXISTS form_fields_form_id_idx ON form_fields(form_id);

-- Add RLS policies
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

-- Policy for admins (who can manage forms)
CREATE POLICY form_fields_admin_policy
    ON form_fields
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = auth.uid()
            AND p.name = 'manage_forms'
        )
    );

-- Policy for reading form fields for forms that belong to the user
CREATE POLICY form_fields_owner_select_policy
    ON form_fields FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM forms f
            WHERE f.id = form_fields.form_id
            AND f.created_by = auth.uid()
        )
    );

-- Policy for reading form fields for active forms (for public users)
CREATE POLICY form_fields_public_select_policy
    ON form_fields FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM forms f
            WHERE f.id = form_fields.form_id
            AND f.active = true
        )
    );

-- Trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_form_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_fields_updated_at
BEFORE UPDATE ON form_fields
FOR EACH ROW
EXECUTE FUNCTION update_form_fields_updated_at(); 