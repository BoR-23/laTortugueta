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
      create table if not exists hero_slides (
        id uuid default gen_random_uuid() primary key,
        image_url text not null,
        title text,
        subtitle text,
        cta_text text,
        cta_link text,
        priority int default 0,
        active boolean default true,
        created_at timestamptz default now()
      );
    `;

        await client.query(createTableQuery);
        console.log('Table hero_slides created (or already exists).');

        // Enable RLS if not already enabled (optional, but good practice)
        // await client.query('alter table hero_slides enable row level security;');

        // Create policy for public read access
        // await client.query(`
        //   create policy "Public read access" on hero_slides
        //   for select using (true);
        // `);

    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

setup();
