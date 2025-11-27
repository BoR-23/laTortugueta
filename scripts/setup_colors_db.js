const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Missing DATABASE_URL in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function setup() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const createTableQuery = `
      create table if not exists colors (
        id int primary key,
        name text,
        hex text not null,
        rgb jsonb,
        image_url text,
        created_at timestamptz default now()
      );
    `;

        await client.query(createTableQuery);
        console.log('Table colors created (or already exists).');

        // Enable RLS
        await client.query('alter table colors enable row level security;');
        console.log('RLS enabled.');

        // Public read access
        try {
            await client.query(`
        create policy "Public read access" on colors
        for select using (true);
      `);
            console.log('Read policy created.');
        } catch (e) {
            console.log('Read policy might already exist:', e.message);
        }

        // Admin write access (assuming service role bypasses RLS, but for client-side admin we might need a policy)
        // For now, we rely on server-side operations or service role for writing.

    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

setup();
