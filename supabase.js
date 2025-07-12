
import { createClient } from '@supabase/supabase-js'


const SUPABASE_URL = "https://ymshxyhpvyerdtzgnpcu.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltc2h4eWhwdnllcmR0emducGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMjQ4NTUsImV4cCI6MjA2NzkwMDg1NX0.0ewiwoCM9Tk2n00siqmeX0zJvNyJUHItMjvdD4MKvas"


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)


