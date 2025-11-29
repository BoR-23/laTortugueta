import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseClient'

export async function GET() {
    const client = createSupabaseServerClient()

    // Add is_wholesale column
    const { error } = await client.rpc('exec_sql', {
        sql_query: `
      ALTER TABLE sales 
      ADD COLUMN IF NOT EXISTS is_wholesale BOOLEAN DEFAULT FALSE;
    `
    })

    // Fallback if RPC is not available (which we know it isn't, so we provide the SQL for manual execution)
    if (error) {
        return NextResponse.json({
            message: "RPC failed. Please run this SQL in Supabase SQL Editor:",
            sql: "ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_wholesale BOOLEAN DEFAULT FALSE;"
        }, { status: 200 }) // Return 200 to see the message easily
    }

    return NextResponse.json({ message: "Migration successful" })
}
