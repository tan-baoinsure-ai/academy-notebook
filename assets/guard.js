/**
 * guard.js — Client-side access guard
 *
 * Credentials are validated server-side via POST /api/verify.
 * No user list is present in this file — DevTools inspection reveals nothing.
 *
 * On success the server returns a signed token which is used to fetch
 * the protected content from GET /api/content.
 */

const SESSION_KEY = 'bao_token';

function guardUnlock(token) {
  fetch('/api/content', {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error('unauthorized');
      return res.text();
    })
    .then((html) => {
      document.body.insertAdjacentHTML('beforeend', html);

      const emptySidebar = document.getElementById('sidebar');
      const emptyMain    = document.getElementById('main');
      if (emptySidebar) emptySidebar.remove();
      if (emptyMain)    emptyMain.remove();

      document.getElementById('guard-overlay').style.display = 'none';

      const s = document.createElement('script');
      s.src = '/assets/main.js';
      document.body.appendChild(s);
    })
    .catch(() => {
      // Token expired or invalid — clear session and show guard again
      sessionStorage.removeItem(SESSION_KEY);
      document.getElementById('guard-overlay').style.display = '';
      document.getElementById('guard-error').textContent =
        'Phiên đã hết hạn. Vui lòng đăng nhập lại.';
    });
}

function guardSubmit() {
  const emailInput = document.getElementById('guard-email');
  const phoneInput = document.getElementById('guard-phone');
  const errEl      = document.getElementById('guard-error');
  const btn        = document.getElementById('guard-btn');

  const email = (emailInput.value || '').trim().toLowerCase();
  const phone = (phoneInput.value || '').trim();

  if (!email) {
    errEl.textContent = 'Vui lòng nhập email của bạn.';
    emailInput.focus();
    return;
  }

  if (!phone) {
    errEl.textContent = 'Vui lòng nhập số điện thoại của bạn.';
    phoneInput.focus();
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Đang xác thực…';
  errEl.textContent = '';

  fetch('/api/verify', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, phone }),
  })
    .then((res) => res.json().then((data) => ({ status: res.status, data })))
    .then(({ status, data }) => {
      if (status !== 200 || !data.token) {
        errEl.textContent = data.error || 'Xác thực thất bại.';
        return;
      }
      sessionStorage.setItem(SESSION_KEY, data.token);
      guardUnlock(data.token);
    })
    .catch(() => {
      errEl.textContent = 'Không kết nối được máy chủ. Vui lòng thử lại.';
    })
    .finally(() => {
      btn.disabled    = false;
      btn.textContent = 'Truy cập tài liệu →';
    });
}

// Auto-unlock if a token is already stored for this session
const savedToken = sessionStorage.getItem(SESSION_KEY);
if (savedToken) {
  guardUnlock(savedToken);
}

// Allow Enter key on either field to submit
['guard-email', 'guard-phone'].forEach((id) => {
  document.getElementById(id).addEventListener('keydown', function (e) {
    if (e.key === 'Enter') guardSubmit();
  });
});
