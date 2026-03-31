'use strict';

require('dotenv').config();

const express = require('express');
const crypto  = require('crypto');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Config ────────────────────────────────────────────────────────────────────

const TOKEN_SECRET = process.env.TOKEN_SECRET;
if (!TOKEN_SECRET) {
  console.warn('[WARN] TOKEN_SECRET is not set.');
}

let VALID_USERS;
try {
  VALID_USERS = JSON.parse(process.env.VALID_USERS || '[]');
} catch {
  console.error('[ERROR] VALID_USERS in .env is not valid JSON.');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  if (!token) return false;
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

// ── Body parser ───────────────────────────────────────────────────────────────

app.use(express.json());

// ── API routes (must be before static middleware) ─────────────────────────────

/**
 * POST /api/verify
 * Body: { email, phone }
 * Returns: { token } on success, 401 on mismatch
 */
app.post('/api/verify', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = normalizePhone(req.body.phone || '');

  if (!email || !phone) {
    return res.status(400).json({ error: 'Email và số điện thoại là bắt buộc.' });
  }

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

// ── Static assets (after API routes) ─────────────────────────────────────────

// Public assets — block direct access to content.html
app.use('/assets', (req, res, next) => {
  if (req.path === '/content.html') {
    return res.status(403).end();
  }
  next();
}, express.static(path.join(__dirname, 'assets')));

// Serve only index.html from the root (do NOT expose server files)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all: return index.html for any unmatched route (SPA fallback)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
