import NextAuth, { type NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { createSupabaseServerClient } from './supabaseClient'

const supabaseAuthAvailable =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

const fallbackAdmins: Array<{ email: string; passwordHash: string }> = [
  {
    email: 'bor.arroyo@gmail.com',
    passwordHash: '$2b$10$mZBp7vFcaFTSp9aKymcrhOIvl9PCvMsxS8Dl1xvhDx9ZJwu8G4Jza'
  }
]

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

        if (supabaseAuthAvailable) {
          try {
            const supabase = createSupabaseServerClient()
            const { data, error } = await supabase
              .from('users_admin')
              .select('*')
              .eq('email', email)
              .single()

            if (!error && data) {
              const isValid = await bcrypt.compare(password, data.password_hash)
              if (isValid) {
                return {
                  id: data.id,
                  email: data.email,
                  role: data.role
                }
              }
            }
          } catch (error) {
            console.error('Auth error', error)
          }
        }

        return await findFallbackAdmin(email, password)
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
