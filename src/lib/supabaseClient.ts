import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

declare global {
  // eslint-disable-next-line no-var
  var __SUPABASE_ENV_WARNING__: boolean | undefined;
}

type SupabaseGlobal = typeof globalThis & {
  __SUPABASE_ENV_WARNING__?: boolean
}

const warnMissingSupabaseConfig = () => {
  if (supabaseUrl && supabaseAnonKey) {
    return
  }

  const globalObject =
    typeof globalThis === 'undefined' ? null : (globalThis as SupabaseGlobal)
  if (!globalObject || globalObject.__SUPABASE_ENV_WARNING__) {
    return
  }

  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      'Supabase env vars are missing. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable DB features.'
    )
  }
  globalObject.__SUPABASE_ENV_WARNING__ = true
}

warnMissingSupabaseConfig()

export const supabaseBrowserClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export const createSupabaseServerClient = ({
  serviceRoleKey
}: {
  serviceRoleKey?: string
} = {}) => {
  const key = serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !key) {
    throw new Error('Missing Supabase server credentials')
  }
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false
    }
  })
}
