'use strict';

const fs   = require('fs');
const path = require('path');
const { verifyToken } = require('./_helpers');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Phiên đã hết hạn. Vui lòng đăng nhập lại.' });
  }

  const contentPath = path.join(process.cwd(), 'assets', 'content.html');
  if (!fs.existsSync(contentPath)) {
    return res.status(404).json({ error: 'Content not found.' });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(fs.readFileSync(contentPath, 'utf8'));
};
