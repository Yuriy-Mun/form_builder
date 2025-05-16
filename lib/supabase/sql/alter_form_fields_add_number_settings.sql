-- Add number_settings column to form_fields table
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS number_settings JSONB;

-- Add date_settings column to form_fields table if it doesn't exist yet
ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS date_settings JSONB;

COMMENT ON COLUMN form_fields.number_settings IS 'Settings specific to number fields: prefix, suffix, decimal_places, step, currency, format';
COMMENT ON COLUMN form_fields.date_settings IS 'Settings specific to date fields: format, enable_time, time_format, show_calendar, first_day_of_week'; 