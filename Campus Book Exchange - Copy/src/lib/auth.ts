import { isSupabaseConfigured, supabase } from './supabase'

export type UserAccount = {
  id: string
  name: string
  email: string
  password?: string
  authProvider: 'email' | 'google'
  avatarURL?: string | null
  initials: string
  campus: string
  phone?: string
  bio?: string
  color: string
  createdAt: number
}

export type AuthUser = {
  id: string
  name: string
  initials: string
  campus: string
  email: string
  color: string
  avatarURL?: string | null
}

const SESSION_KEY = 'bookswap_current_session_v1'
const authListeners: Set<() => void> = new Set()

function notifyAuthListeners() {
  authListeners.forEach((fn) => {
    try { fn() } catch (error) { console.error('Error in auth listener:', error) }
  })
}

export function subscribeAuth(callback: () => void): () => void {
  authListeners.add(callback)
  return () => authListeners.delete(callback)
}

export const DEFAULT_ACCOUNTS: UserAccount[] = []

export function getCurrentUser(): UserAccount | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) as UserAccount : null
  } catch (error) {
    console.error('Failed to load cached user:', error)
    return null
  }
}

export function setCurrentUser(user: UserAccount | null): void {
  if (typeof window === 'undefined') return
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  else {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
  }
  notifyAuthListeners()
}

export function getAuthUser(): AuthUser {
  const current = getCurrentUser()
  return current ? {
    id: current.id, name: current.name, initials: current.initials,
    campus: current.campus, email: current.email, color: current.color,
    avatarURL: current.avatarURL,
  } : {
    id: 'user-guest', name: 'Tamu SwapBook', initials: 'TB',
    campus: 'Kampus Umum', email: 'guest@swapbook.id', color: '#cfc6aa', avatarURL: null,
  }
}

export function generateInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : (name.substring(0, 2) || 'SB').toUpperCase()
}

const AVATAR_COLORS = ['#d2c1a6', '#d6bc9b', '#b5cbb7', '#e4b598', '#c4b8a5', '#a8b4a2', '#e9a46e', '#c28e6c']
export function getRandomColor(): string { return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] }

function accountFromAuthUser(authUser: any, profile?: any): UserAccount {
  const metadata = authUser.user_metadata || {}
  const name = profile?.name || metadata.name || authUser.email?.split('@')[0] || 'Pengguna BookSwap'
  return {
    id: authUser.id,
    name,
    email: authUser.email || profile?.email || '',
    authProvider: authUser.app_metadata?.provider === 'google' ? 'google' : 'email',
    initials: generateInitials(name),
    campus: profile?.campus || metadata.campus || 'Universitas Muhammadiyah Cirebon',
    phone: profile?.phone || metadata.phone || '',
    bio: profile?.bio || 'Mahasiswa pencinta buku di SwapBook.',
    color: profile?.color || getRandomColor(),
    avatarURL: profile?.avatar_url || metadata.avatar_url || metadata.picture || null,
    createdAt: Date.now(),
  }
}

async function hydrateUser(authUser: any): Promise<UserAccount> {
  let profile: any = null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
  if (error) console.warn('Tidak dapat membaca profil Supabase:', error.message)
  profile = data
  const user = accountFromAuthUser(authUser, profile)
  if (!profile) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id, name: user.name, email: user.email, campus: user.campus,
      phone: user.phone || '', bio: user.bio || '', color: user.color,
      avatar_url: user.avatarURL || null,
    })
    if (profileError) console.warn('Tidak dapat membuat profil:', profileError.message)
  }
  setCurrentUser(user)
  return user
}

/** Call once when the app shell mounts. The Supabase session, not localStorage alone,
 * is the source of truth for whether a user is signed in. */
export async function syncCurrentUserFromSupabase(): Promise<UserAccount | null> {
  if (!isSupabaseConfigured) {
    setCurrentUser(null)
    return null
  }
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.user) {
    setCurrentUser(null)
    return null
  }
  return hydrateUser(data.session.user)
}

export function watchSupabaseAuth(): () => void {
  if (!isSupabaseConfigured) return () => {}
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      setCurrentUser(null)
      return
    }
    // Defer database work until after the auth callback returns.
    Promise.resolve().then(() => hydrateUser(session.user)).catch((error) => console.error('Gagal menyinkronkan sesi:', error))
  })
  return () => subscription.unsubscribe()
}

export async function signUp(data: {
  name: string; email: string; password: string; campus: string; phone?: string
}): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const email = data.email.trim().toLowerCase()
  if (data.name.trim().length < 2) return { success: false, error: 'Nama lengkap minimal 2 karakter.' }
  if (!email.includes('@') || !email.includes('.')) return { success: false, error: 'Masukkan format email yang valid.' }
  if (data.password.length < 6) return { success: false, error: 'Password minimal 6 karakter.' }
  if (!isSupabaseConfigured) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' }

  try {
    const { data: result, error } = await supabase.auth.signUp({
      email, password: data.password,
      options: { data: { name: data.name.trim(), campus: data.campus, phone: data.phone || '' } },
    })
    if (error) return { success: false, error: error.message }
    if (!result.user) return { success: false, error: 'Supabase tidak mengembalikan data akun. Coba lagi.' }
    if (!result.session) {
      return { success: false, error: 'Akun berhasil dibuat, tetapi email perlu dikonfirmasi. Buka tautan konfirmasi dari email, lalu masuk kembali sebelum mengunggah buku.' }
    }
    const user = await hydrateUser(result.user)
    return { success: true, user }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mendaftar ke Supabase.' }
  }
}

export async function login(email: string, password: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) return { success: false, error: error.message }
    if (!data.user || !data.session) return { success: false, error: 'Login belum menghasilkan sesi aktif. Periksa konfirmasi email akunmu.' }
    const user = await hydrateUser(data.user)
    return { success: true, user }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal login dengan Supabase.' }
  }
}

export async function loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' }
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    return error ? { success: false, error: error.message } : { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal menghubungkan Google OAuth.' }
  }
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Supabase logout error:', error)
  }
  setCurrentUser(null)
}

export async function updateProfile(updates: Partial<UserAccount>): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' }
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) return { success: false, error: 'Sesi login tidak aktif. Silakan masuk kembali.' }
  const current = getCurrentUser() || accountFromAuthUser(authData.user)
  const updated: UserAccount = { ...current, ...updates, id: authData.user.id, initials: updates.name ? generateInitials(updates.name) : current.initials }
  const { error } = await supabase.from('profiles').upsert({
    id: updated.id, name: updated.name, email: updated.email, campus: updated.campus,
    phone: updated.phone || '', bio: updated.bio || '', color: updated.color,
    avatar_url: updated.avatarURL || null,
  })
  if (error) return { success: false, error: error.message }
  setCurrentUser(updated)
  return { success: true, user: updated }
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' }
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/profil` })
  return error ? { success: false, error: error.message } : { success: true }
}
