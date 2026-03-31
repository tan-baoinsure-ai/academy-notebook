'use strict';

const crypto = require('crypto');

const TOKEN_SECRET = process.env.TOKEN_SECRET;

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

function getValidUsers() {
  try {
    return JSON.parse(process.env.VALID_USERS || '[]');
  } catch {
    return [];
  }
}

module.exports = { normalizePhone, createToken, verifyToken, getValidUsers };
