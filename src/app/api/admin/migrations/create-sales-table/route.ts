import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

export async function GET() {
  const client = createSupabaseServerClient()

  const sql = `
    CREATE TABLE IF NOT EXISTS sales (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id TEXT,
      date DATE,
      client TEXT,
      product_name TEXT,
      size TEXT,
      details TEXT,
      delivery_date TEXT,
      status TEXT DEFAULT 'pending',
      product_id TEXT REFERENCES products(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  const { error } = await client.rpc('exec_sql', { sql_query: sql })

  if (error) {
    return NextResponse.json({ error: error.message, sql }, { status: 500 })
  }

  return NextResponse.json({ message: 'Sales table created successfully' })
}
