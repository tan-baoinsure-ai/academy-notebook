'use strict';

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const TOKEN_SECRET = process.env.TOKEN_SECRET;


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizePhone(raw) {
  return String(raw).replace(/\D/g, '');
}

function createToken(email) {
  const expiry  = Date.now() + 60 * 60 * 1000; // 1 hour
  const payload = Buffer.from(`${email}:${expiry}`).toString('base64url');
  const sig     = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  if (!token || !TOKEN_SECRET) return false;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;

  const payload = token.slice(0, dot);
  const sig     = token.slice(dot + 1);

  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return false;
    }
  } catch {
    return false;
  }

  const [, expiry] = Buffer.from(payload, 'base64url').toString().split(':');
  return Date.now() < Number(expiry);
}

async function findUser(email, phone) {
  const { data } = await supabase
    .from('valid_users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .eq('phone', normalizePhone(phone))
    .limit(1)
    .maybeSingle();
  return data !== null;
}

module.exports = { normalizePhone, createToken, verifyToken, findUser };
