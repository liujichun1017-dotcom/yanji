import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ygjujgvzapqsnerbaiml.supabase.co'
const supabaseAnonKey = 'sb_publishable_n1H3sp2LHwUo0HRuDwdhzw_CkInHrDm'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
