'use strict';

require('dotenv').config();

const express = require('express');
const crypto  = require('crypto');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Config ──────────────────────────────────────────────────────────────────

const TOKEN_SECRET = process.env.TOKEN_SECRET;
if (!TOKEN_SECRET ) {
  console.warn('[WARN] TOKEN_SECRET is not set or is using the default value.');
}

let VALID_USERS;
try {
  VALID_USERS = JSON.parse(process.env.VALID_USERS || '[]');
} catch {
  console.error('[ERROR] VALID_USERS in .env is not valid JSON.');
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Strip non-digit characters for loose phone comparison */
function normalizePhone(raw) {
  return String(raw).replace(/\D/g, '');
}

/**
 * Create a short-lived HMAC token.
 * Payload: base64(email + ':' + expiry_timestamp)
 * Signature: HMAC-SHA256(payload, TOKEN_SECRET)
 */
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
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;

  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return false;
  }

  const [, expiry] = Buffer.from(payload, 'base64url').toString().split(':');
  return Date.now() < Number(expiry);
}

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json());

// Serve public static assets (style.css, guard.js, main.js, logo — NOT content.html)
app.use('/assets', (req, res, next) => {
  if (req.path === '/content.html') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}, express.static(path.join(__dirname, 'assets')));

// Serve index.html
app.use(express.static(__dirname, { index: 'index.html' }));

// ── API Routes ────────────────────────────────────────────────────────────────

/**
 * POST /api/verify
 * Body: { email, phone }
 * Returns: { token } on success, 401 on mismatch
 */
app.post('/api/verify', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = normalizePhone(req.body.phone || '');

  const match = VALID_USERS.find(
    (u) =>
      u.email.trim().toLowerCase() === email &&
      normalizePhone(u.phone) === phone
  );

  if (!match) {
    return res.status(401).json({ error: 'Email hoặc số điện thoại không khớp.' });
  }

  res.json({ token: createToken(email) });
});

/**
 * GET /api/content
 * Header: Authorization: Bearer <token>
 * Returns: content.html on valid token, 401 otherwise
 */
app.get('/api/content', (req, res) => {
  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Phiên đã hết hạn. Vui lòng đăng nhập lại.' });
  }

  const contentPath = path.join(__dirname, 'assets', 'content.html');
  if (!fs.existsSync(contentPath)) {
    return res.status(404).json({ error: 'Content not found.' });
  }

  res.sendFile(contentPath);
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
