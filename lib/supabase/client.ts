import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqvdopbegosjggkxamoo.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdmRvcGJlZ29zamdna3hhbW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjE1MTksImV4cCI6MjEwMjczNzUxOX0.6QwwCBOp711RUakYcEHFofpwF9AFnNNHyEa8GGEJSHk'

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure: isHttps,
      maxAge: 60 * 60 * 24 * 30, // 30 días de persistencia de sesión
    },
  })
}
