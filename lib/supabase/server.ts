import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqvdopbegosjggkxamoo.supabase.co'
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdmRvcGJlZ29zamdna3hhbW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjE1MTksImV4cCI6MjEwMjczNzUxOX0.6QwwCBOp711RUakYcEHFofpwF9AFnNNHyEa8GGEJSHk'

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorado en Server Components con proxy activo
          }
        },
      },
    }
  )
}
