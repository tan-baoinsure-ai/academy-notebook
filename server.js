'use strict';

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Static assets ──────────────────────────────────────────────────────────────

app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve only index.html from the root (do NOT expose server files)
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all: return index.html for any unmatched route (SPA fallback)
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
