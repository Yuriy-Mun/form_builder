-- Function to aggregate responses by date
CREATE OR REPLACE FUNCTION aggregate_responses_by_date(
  p_form_id UUID,
  p_date_format TEXT DEFAULT 'YYYY-MM-DD'
)
RETURNS TABLE (
  date_group TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(fr.created_at, p_date_format) AS date_group,
    COUNT(*) AS count
  FROM form_responses fr
  WHERE fr.form_id = p_form_id
  GROUP BY date_group
  ORDER BY date_group;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate field values by date
CREATE OR REPLACE FUNCTION aggregate_field_by_date(
  p_form_id UUID,
  p_field_id UUID,
  p_date_format TEXT DEFAULT 'YYYY-MM-DD',
  p_aggregation TEXT DEFAULT 'sum'
)
RETURNS TABLE (
  date_group TEXT,
  count DOUBLE PRECISION
) AS $$
BEGIN
  IF p_aggregation = 'sum' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(fr.created_at, p_date_format) AS date_group,
      SUM(COALESCE(frv.numeric_value, 0)) AS count
    FROM form_responses fr
    JOIN form_response_values frv ON fr.id = frv.response_id
    WHERE fr.form_id = p_form_id
    AND frv.field_id = p_field_id
    GROUP BY date_group
    ORDER BY date_group;
  ELSIF p_aggregation = 'avg' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(fr.created_at, p_date_format) AS date_group,
      AVG(COALESCE(frv.numeric_value, 0)) AS count
    FROM form_responses fr
    JOIN form_response_values frv ON fr.id = frv.response_id
    WHERE fr.form_id = p_form_id
    AND frv.field_id = p_field_id
    GROUP BY date_group
    ORDER BY date_group;
  ELSIF p_aggregation = 'min' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(fr.created_at, p_date_format) AS date_group,
      MIN(COALESCE(frv.numeric_value, 0)) AS count
    FROM form_responses fr
    JOIN form_response_values frv ON fr.id = frv.response_id
    WHERE fr.form_id = p_form_id
    AND frv.field_id = p_field_id
    GROUP BY date_group
    ORDER BY date_group;
  ELSIF p_aggregation = 'max' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(fr.created_at, p_date_format) AS date_group,
      MAX(COALESCE(frv.numeric_value, 0)) AS count
    FROM form_responses fr
    JOIN form_response_values frv ON fr.id = frv.response_id
    WHERE fr.form_id = p_form_id
    AND frv.field_id = p_field_id
    GROUP BY date_group
    ORDER BY date_group;
  ELSE
    -- Default to count
    RETURN QUERY
    SELECT 
      TO_CHAR(fr.created_at, p_date_format) AS date_group,
      COUNT(*)::DOUBLE PRECISION AS count
    FROM form_responses fr
    JOIN form_response_values frv ON fr.id = frv.response_id
    WHERE fr.form_id = p_form_id
    AND frv.field_id = p_field_id
    GROUP BY date_group
    ORDER BY date_group;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate responses by field
CREATE OR REPLACE FUNCTION aggregate_responses_by_field(
  p_form_id UUID,
  p_field_id UUID,
  p_aggregation TEXT DEFAULT 'count'
)
RETURNS TABLE (
  key TEXT,
  value NUMERIC
) AS $$
BEGIN
  IF p_aggregation = 'count' THEN
    RETURN QUERY
    SELECT 
      COALESCE(
        CASE 
          WHEN frv.boolean_value IS NOT NULL THEN 
            CASE WHEN frv.boolean_value THEN 'Yes' ELSE 'No' END
          ELSE frv.value
        END,
        'Blank'
      ) AS key,
      COUNT(*)::numeric AS value
    FROM form_responses fr
    JOIN form_response_values frv ON fr.id = frv.response_id
    WHERE fr.form_id = p_form_id
    AND frv.field_id = p_field_id
    GROUP BY key
    ORDER BY key;
  ELSIF p_aggregation = 'sum' THEN
    RETURN QUERY
    SELECT 
      COALESCE(
        CASE 
          WHEN frv.boolean_value IS NOT NULL THEN 
            CASE WHEN frv.boolean_value THEN 'Yes' ELSE 'No' END
          ELSE frv.value
        END,
        'Blank'
      ) AS key,
      SUM(COALESCE(frv.numeric_value, 0)) AS value
    FROM form_responses fr
    JOIN form_response_values frv ON fr.id = frv.response_id
    WHERE fr.form_id = p_form_id
    AND frv.field_id = p_field_id
    GROUP BY key
    ORDER BY key;
  ELSIF p_aggregation = 'avg' THEN
    RETURN QUERY
    SELECT 
      COALESCE(
        CASE 
          WHEN frv.boolean_value IS NOT NULL THEN 
            CASE WHEN frv.boolean_value THEN 'Yes' ELSE 'No' END
          ELSE frv.value
        END,
        'Blank'
      ) AS key,
      AVG(COALESCE(frv.numeric_value, 0)) AS value
    FROM form_responses fr
    JOIN form_response_values frv ON fr.id = frv.response_id
    WHERE fr.form_id = p_form_id
    AND frv.field_id = p_field_id
    GROUP BY key
    ORDER BY key;
  ELSIF p_aggregation = 'min' THEN
    RETURN QUERY
    SELECT 
      COALESCE(
        CASE 
          WHEN frv.boolean_value IS NOT NULL THEN 
            CASE WHEN frv.boolean_value THEN 'Yes' ELSE 'No' END
          ELSE frv.value
        END,
        'Blank'
      ) AS key,
      MIN(COALESCE(frv.numeric_value, 0)) AS value
    FROM form_responses fr
    JOIN form_response_values frv ON fr.id = frv.response_id
    WHERE fr.form_id = p_form_id
    AND frv.field_id = p_field_id
    GROUP BY key
    ORDER BY key;
  ELSIF p_aggregation = 'max' THEN
    RETURN QUERY
    SELECT 
      COALESCE(
        CASE 
          WHEN frv.boolean_value IS NOT NULL THEN 
            CASE WHEN frv.boolean_value THEN 'Yes' ELSE 'No' END
          ELSE frv.value
        END,
        'Blank'
      ) AS key,
      MAX(COALESCE(frv.numeric_value, 0)) AS value
    FROM form_responses fr
    JOIN form_response_values frv ON fr.id = frv.response_id
    WHERE fr.form_id = p_form_id
    AND frv.field_id = p_field_id
    GROUP BY key
    ORDER BY key;
  ELSE
    -- Default to count if unknown aggregation
    RETURN QUERY
    SELECT 
      COALESCE(
        CASE 
          WHEN frv.boolean_value IS NOT NULL THEN 
            CASE WHEN frv.boolean_value THEN 'Yes' ELSE 'No' END
          ELSE frv.value
        END,
        'Blank'
      ) AS key,
      COUNT(*)::numeric AS value
    FROM form_responses fr
    JOIN form_response_values frv ON fr.id = frv.response_id
    WHERE fr.form_id = p_form_id
    AND frv.field_id = p_field_id
    GROUP BY key
    ORDER BY key;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 