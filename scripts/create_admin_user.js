#!/usr/bin/env node

/**
 * Creates an admin user in Supabase (users_admin table).
 * Usage: node scripts/create_admin_user.js user@example.com password123
 */

const path = require('path')
const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') })

const [email, password] = process.argv.slice(2)

if (!email || !password) {
  console.error('Usage: node scripts/create_admin_user.js email password')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

const main = async () => {
  const passwordHash = await bcrypt.hash(password, 10)
  const { error } = await supabase.from('users_admin').insert({
    email: email.toLowerCase(),
    password_hash: passwordHash,
    role: 'admin'
  })

  if (error) {
    console.error('Failed to create admin user:', error.message)
    process.exit(1)
  }

  console.log(`Admin user created for ${email}`)
}

main()
