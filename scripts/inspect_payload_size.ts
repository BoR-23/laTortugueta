
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase env vars. Make sure to run with .env.local loaded.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspect() {
    console.log('Connecting to Supabase...');

    // 1. Check Products (select * to find hidden giants)
    console.log('\n--- Inspecting Products ---');
    // Just select * and media_assets
    const { data: products, error } = await supabase
        .from('products')
        .select('*, media_assets(*)');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Fetched ${products.length} products.`);

    let totalPayloadSize = 0;
    let maxFieldSize = 0;
    let maxField = '';

    if (products.length > 0) {
        console.log('Columns found:', Object.keys(products[0]).join(', '));
    }

    products.forEach(p => {
        // Check ALL fields
        Object.entries(p).forEach(([key, val]) => {
            const valStr = JSON.stringify(val) || '';
            const size = valStr.length;
            if (size > maxFieldSize) {
                maxFieldSize = size;
                maxField = `${key} (Product ${p.id})`;
            }
            if (size > 5000) {
                console.log(`[WARN] Product ${p.id} field '${key}' is HUGE: ${size} chars`);
                if (size > 100000) console.log('       -> EXTREMELY HUGE!');
                if (key === 'metadata') {
                    // Dig into metadata
                    const m = val as any;
                    if (m.imagePlaceholders) console.log(`       -> Contains imagePlaceholders! Size: ${JSON.stringify(m.imagePlaceholders).length}`);
                }
            }
        });

        totalPayloadSize += JSON.stringify(p).length;
    });

    console.log(`Max Field: ${maxField} (${maxFieldSize} chars)`);
    console.log(`Approx Raw Product DB Payload: ${(totalPayloadSize / 1024 / 1024).toFixed(2)} MB`);

    // Checking other tables...
    // ...
    console.log('\n--- Inspection Complete ---');
}

inspect().catch(console.error);
