#!/usr/bin/env node

/**
 * Migra data/categories.json a la tabla "categories" en Supabase.
 * Hace esto:
 *  1) Borra todas las filas actuales de categories
 *  2) Inserta primero las categorías padre (sin parentId)
 *  3) Inserta después las categorías hijo (con parentId) para respetar la FK
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Cargar .env.local del root
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const categoriesFile = path.join(__dirname, '..', 'data', 'categories.json');

function readCategories() {
  if (!fs.existsSync(categoriesFile)) {
    console.error('❌ No existe data/categories.json');
    process.exit(1);
  }

  const raw = fs.readFileSync(categoriesFile, 'utf8').trim();
  if (!raw) return [];

  const json = JSON.parse(raw);

  if (!Array.isArray(json)) {
    console.error('❌ data/categories.json no es un array');
    process.exit(1);
  }

  return json;
}

function buildPayload(record) {
  return {
    id: record.id,
    scope: record.scope || 'filter',
    name: record.name,
    tag_key: record.tagKey ?? null,
    parent_id: record.parentId ?? null,
    // en la tabla el campo es sort_order
    sort_order: typeof record.order === 'number' ? record.order : 0,
  };
}

async function migrate() {
  const records = readCategories();

  const parents = records.filter((c) => !c.parentId);
  const children = records.filter((c) => c.parentId);

  console.log(`Total categorías en JSON: ${records.length}`);
  console.log(`Padres (sin parentId): ${parents.length}`);
  console.log(`Hijos (con parentId): ${children.length}`);
  console.log('');

  // 1) Borrar todo
  console.log('🧹 Borrando categorías existentes en Supabase...');
  const { error: deleteError } = await supabase.from('categories').delete().neq('id', '');
  if (deleteError) {
    console.error('❌ Error borrando categorías existentes:', deleteError);
    process.exit(1);
  }

  // 2) Insertar padres
  console.log('⬆️ Insertando categorías PADRE...');
  const parentPayload = parents.map(buildPayload);
  let { error: parentsError } = await supabase.from('categories').upsert(parentPayload);
  if (parentsError) {
    console.error('❌ Error insertando padres:', parentsError);
    process.exit(1);
  }

  // 3) Insertar hijos
  console.log('⬆️ Insertando categorías HIJO...');
  const childrenPayload = children.map(buildPayload);
  let { error: childrenError } = await supabase.from('categories').upsert(childrenPayload);
  if (childrenError) {
    console.error('❌ Error insertando hijos:', childrenError);
    process.exit(1);
  }

  console.log('');
  console.log('✅ Categorías migradas correctamente a Supabase.');
}

migrate().catch((err) => {
  console.error('❌ Migration failed', err);
  process.exit(1);
});
