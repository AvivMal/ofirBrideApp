import { createClient } from '@supabase/supabase-js'

// ─── Paste your Supabase credentials here (or set in .env) ───────────────────
// Project ID: edfvfhulzmayzbnvtlco
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://edfvfhulzmayzbnvtlco.supabase.co'

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_3pPN2qvBpCtd4sBI1PHv0g_Pez68Q8D'
// ─────────────────────────────────────────────────────────────────────────────

const isPlaceholder =
  !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

export const isDemoMode = isPlaceholder

// Safe client — will not throw even if keys are placeholders
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// ─── Auth helpers ────────────────────────────────────────────────────────────

/**
 * Sign in with Email OTP (Magic Link)
 * Supabase table: auth.users
 */
export async function signInWithEmailOtp(email) {
  if (isDemoMode) return { data: null, error: null, demo: true }
  return supabase.auth.signInWithOtp({ email })
}

/**
 * Sign in with Phone OTP
 * Supabase table: auth.users
 */
export async function signInWithPhoneOtp(phone) {
  if (isDemoMode) return { data: null, error: null, demo: true }
  return supabase.auth.signInWithOtp({ phone })
}

/**
 * Sign in with Google OAuth
 * Supabase → Authentication → Providers → Google (enable + add Client ID/Secret)
 */
export async function signInWithGoogle() {
  if (isDemoMode) return { data: null, error: null, demo: true }
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
}

/**
 * Verify OTP token
 * @param {'email'|'sms'} type
 */
export async function verifyOtp({ email, phone, token, type }) {
  if (isDemoMode) return { data: { session: { user: { id: 'demo' } } }, error: null, demo: true }
  return supabase.auth.verifyOtp({ email, phone, token, type })
}

export async function signOut() {
  return supabase.auth.signOut()
}

/*
  ─── Suggested Supabase tables ──────────────────────────────────────────────

  trips:
    id uuid PK, name text, destination text, start_date date,
    end_date date, background_url text, created_by uuid FK auth.users

  trip_members:
    id uuid PK, trip_id uuid FK trips, user_id uuid FK auth.users,
    display_name text, avatar_url text, role text (bride|maid|guest)

  schedule_items:
    id uuid PK, trip_id uuid FK trips, day date, time time,
    title text, location text, emoji text, icon text, order int

  chat_messages:
    id uuid PK, trip_id uuid FK trips, user_id uuid FK auth.users,
    type text (text|voice|image|location), content text,
    media_url text, created_at timestamptz

  saved_places:
    id uuid PK, trip_id uuid FK trips, name text, category text,
    address text, lat float, lng float, notes text, added_by uuid FK auth.users

  memories:
    id uuid PK, trip_id uuid FK trips, user_id uuid FK auth.users,
    media_url text, caption text, day date, created_at timestamptz
*/
