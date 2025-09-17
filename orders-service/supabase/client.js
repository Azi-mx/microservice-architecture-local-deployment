const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key not provided. Some features may not work correctly.');
}

const supabase = createClient(
  supabaseUrl || 'https://your-project-url.supabase.co',
  supabaseKey || 'your-anon-key'
);

module.exports = supabase;
