import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if the required environment variables exist
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Required environment variables are missing. Make sure you have set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

// Create a Supabase client with admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration(filePath: string) {
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Applying migration from ${filePath}...`);
    
    // Split SQL into individual statements (basic splitting, not handling all edge cases)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });
      
      if (error) {
        console.error(`Error applying statement ${i + 1}:`, error);
        process.exit(1);
      }
    }
    
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Check if a file path was provided
if (process.argv.length < 3) {
  console.error('Usage: bun scripts/apply-migration.ts <path-to-sql-file>');
  process.exit(1);
}

// Get the file path from command line arguments
const filePath = process.argv[2];
const resolvedPath = path.resolve(process.cwd(), filePath);

// Check if the file exists
if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: File not found at ${resolvedPath}`);
  process.exit(1);
}

// Apply the migration
applyMigration(resolvedPath); 