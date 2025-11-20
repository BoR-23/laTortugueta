import NextAuth, { type NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

import { createSupabaseServerClient } from './supabaseClient'

const envFallbackEmail = process.env.ADMIN_EMAIL?.toLowerCase()
const envFallbackHash = process.env.ADMIN_PASSWORD_HASH
const fallbackAdmins: Array<{ email: string; passwordHash: string }> =
  envFallbackEmail && envFallbackHash
    ? [{ email: envFallbackEmail, passwordHash: envFallbackHash }]
    : [
        {
          email: 'bor.arroyo@gmail.com',
          passwordHash: '$2b$10$AnDHUF.V4Yl89TWzdxqfP.4XIQbuKooPMfvGhf7slqsAP2zr1aXZm'
        }
      ]

const supabaseAdminClient = (() => {
  try {
    return createSupabaseServerClient()
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Supabase admin auth disabled:', (error as Error).message)
    }
    return null
  }
})()

const findFallbackAdmin = async (email: string, password: string) => {
  const admin = fallbackAdmins.find(user => user.email === email)
  if (!admin) {
    return null
  }
  const isValid = await bcrypt.compare(password, admin.passwordHash)
  if (!isValid) {
    return null
  }
  return {
    id: admin.email,
    email: admin.email,
    role: 'admin'
  }
}

const findSupabaseAdmin = async (email: string, password: string) => {
  if (!supabaseAdminClient) {
    return null
  }

  const normalizedEmail = email.trim().toLowerCase()

  const { data, error } = await supabaseAdminClient
    .from('users_admin')
    .select('id, email, password_hash, role')
    .ilike('email', normalizedEmail)
    .maybeSingle()

  if (error) {
    console.error('Supabase admin lookup failed:', error.message)
    return null
  }

  if (!data || !data.password_hash) {
    return null
  }

  const isValid = await bcrypt.compare(password, data.password_hash)
  if (!isValid) {
    return null
  }

  return {
    id: data.id ?? data.email,
    email: data.email?.toLowerCase?.() ?? data.email,
    role: data.role ?? 'admin'
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/admin'
  },
  providers: [
    Credentials({
      name: 'Credenciales',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.toLowerCase()
        const password = credentials.password

        const supabaseAdmin = await findSupabaseAdmin(email, password)
        if (supabaseAdmin) {
          return supabaseAdmin
        }

        return findFallbackAdmin(email, password)
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? 'admin'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.role = (token.role as string) ?? 'admin'
      }
      return session
    }
  }
}

export const { auth } = NextAuth(authOptions)
