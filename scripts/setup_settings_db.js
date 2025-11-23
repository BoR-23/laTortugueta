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
            create table if not exists site_settings (
                key text primary key,
                value jsonb not null default '{}'::jsonb,
                updated_at timestamptz default now()
            );
        `;

        await client.query(createTableQuery);
        console.log('Table site_settings created (or already exists).');

        // Enable RLS
        await client.query('alter table site_settings enable row level security;');

        // Public read policy
        try {
            await client.query(`
                create policy "Public read access" on site_settings for select using (true);
            `);
            console.log('Created public read policy');
        } catch (e) {
            // Ignore if exists
            console.log('Public read policy might already exist');
        }

        // Admin update policy (allow authenticated users for now, API handles auth check)
        try {
            await client.query(`
                create policy "Authenticated update access" on site_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
            `);
            console.log('Created authenticated update policy');
        } catch (e) {
            // Ignore if exists
            console.log('Authenticated update policy might already exist');
        }

    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

setup();
