'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizePhone(raw) {
  return String(raw).replace(/\D/g, '');
}

async function main() {
  const dataPath = path.join(__dirname, '..', 'data.txt');
  const lines = fs.readFileSync(dataPath, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const users = lines.map(line => {
    const parts = line.split('\t');
    const [name, email, phone] = parts;
    return {
      name: name?.trim() || null,
      email: email?.trim().toLowerCase(),
      phone: normalizePhone(phone || ''),
    };
  }).filter(u => u.email && u.phone);

  console.log(`Importing ${users.length} users...`);

  const { error } = await supabase
    .from('valid_users')
    .upsert(users, { onConflict: 'email' });

  if (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }

  console.log('Import successful.');
}

main();
