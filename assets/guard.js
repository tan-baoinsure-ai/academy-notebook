/**
 * guard.js — Email + phone access control
 *
 * Both email and phone must match the same record in the whitelist.
 * The ebook content is NOT in the initial HTML — it is fetched and
 * injected only after successful auth, so DevTools inspection of
 * index.html reveals nothing to unlock.
 *
 * Auth state is persisted in sessionStorage so the prompt does not
 * re-appear on page refresh within the same tab.
 */

// Mockup whitelist — each entry must match on BOTH email and phone
const VALID_USERS = [
  { email: 'tanleit151@gmail.com',   phone: '0379793815' },
  { email: 'anh.phan@baoacademy.ai',   phone: '0374057248' },
  { email: 'ducminh.htdn@gmail.com',   phone: '0339230429' },
  { email: 'tranthaovy2801@gmail.com',   phone: '0942277045' },
  { email: ' nguyenphamanhkhoa1807@gmail.com',     phone: '0348857093' },
  { email: 'nguyenbichnhi01021994@gmail.com', phone: '0886622090' },
  
];

const SESSION_KEY = 'bao_access';

/** Strip all non-digit characters for loose phone comparison */
function normalizePhone(raw) {
  return raw.replace(/\D/g, '');
}

function guardUnlock() {
  fetch('assets/content.html')
    .then((res) => res.text())
    .then((html) => {
      document.body.insertAdjacentHTML('beforeend', html);

      const emptySidebar = document.getElementById('sidebar');
      const emptyMain    = document.getElementById('main');
      if (emptySidebar) emptySidebar.remove();
      if (emptyMain)    emptyMain.remove();

      document.getElementById('guard-overlay').style.display = 'none';

      // Inject main.js now that nav DOM exists
      const s = document.createElement('script');
      s.src = 'assets/main.js';
      document.body.appendChild(s);
    })
    .catch(() => {
      document.getElementById('guard-error').textContent =
        'Không tải được nội dung. Vui lòng thử lại.';
    });
}

function guardSubmit() {
  const emailInput = document.getElementById('guard-email');
  const phoneInput = document.getElementById('guard-phone');
  const errEl      = document.getElementById('guard-error');

  const email = (emailInput.value || '').trim().toLowerCase();
  const phone = normalizePhone(phoneInput.value || '');

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

  const match = VALID_USERS.find(
    (u) => u.email === email && normalizePhone(u.phone) === phone
  );

  if (match) {
    sessionStorage.setItem(SESSION_KEY, '1');
    guardUnlock();
  } else {
    errEl.textContent = 'Email hoặc số điện thoại không khớp với danh sách truy cập.';
    emailInput.focus();
  }
}

// Auto-unlock if already verified this session
if (sessionStorage.getItem(SESSION_KEY) === '1') {
  guardUnlock();
}

// Allow Enter key on either field to submit
['guard-email', 'guard-phone'].forEach((id) => {
  document.getElementById(id).addEventListener('keydown', function (e) {
    if (e.key === 'Enter') guardSubmit();
  });
});
