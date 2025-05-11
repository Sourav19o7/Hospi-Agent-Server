const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase client with anonymous key (for client-side operations)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase admin client with service key (for server-side operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabaseClient, supabaseAdmin };