'use strict';

const { normalizePhone, createToken, getValidUsers } = require('./_helpers');

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const phone = normalizePhone(req.body?.phone || '');

  if (!email || !phone) {
    return res.status(400).json({ error: 'Email và số điện thoại là bắt buộc.' });
  }

  const match = getValidUsers().find(
    (u) =>
      u.email.trim().toLowerCase() === email &&
      normalizePhone(u.phone) === phone
  );

  if (!match) {
    return res.status(401).json({ error: 'Email hoặc số điện thoại không khớp.' });
  }

  res.status(200).json({ token: createToken(email) });
};
