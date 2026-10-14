/* ==========================================================================
   Account page — sign-up / log-in toggle.
   There is no auth backend yet, so submitting validates the fields and
   shows a friendly "coming soon" message instead of silently doing nothing.
   Hook your real auth (Netlify Identity, Supabase, etc.) into onSubmit().
   ========================================================================== */
(function () {
  'use strict';
  const form = document.getElementById('auth-form');
  if (!form) return;

  const tabs = { signup: document.getElementById('tab-signup'), login: document.getElementById('tab-login') };
  const title = document.getElementById('auth-title');
  const sub = document.getElementById('auth-sub');
  const msg = document.getElementById('auth-msg');
  const nameField = form.querySelector('[data-signup-only]');
  const pw = form.querySelector('input[name=password]');
  const card = document.querySelector('.auth-card');
  let mode = 'signup';

  function setMode(m) {
    mode = m;
    const signup = m === 'signup';
    tabs.signup.setAttribute('aria-selected', String(signup));
    tabs.login.setAttribute('aria-selected', String(!signup));
    card.dataset.mode = m;
    title.textContent = signup ? 'Create your account' : 'Welcome back';
    sub.textContent = signup ? 'Save your designs and get early access when we launch.' : 'Log in to see your saved designs.';
    nameField.hidden = !signup;
    nameField.querySelector('input').required = signup;
    pw.autocomplete = signup ? 'new-password' : 'current-password';
    msg.hidden = true;
  }

  tabs.signup.addEventListener('click', () => setMode('signup'));
  tabs.login.addEventListener('click', () => setMode('login'));
  document.querySelector('.tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = mode === 'signup' ? 'login' : 'signup';
    setMode(next);
    tabs[next].focus();
  });
  if (location.hash === '#login') setMode('login');

  form.querySelector('.pw-toggle').addEventListener('click', (e) => {
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    e.currentTarget.textContent = show ? 'Hide' : 'Show';
    e.currentTarget.setAttribute('aria-pressed', String(show));
    e.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    msg.className = 'form-msg';
    if (!form.checkValidity()) {
      const bad = form.querySelector(':invalid');
      msg.textContent = bad && bad.name === 'password' ? 'Password must be at least 8 characters.' : 'Please fill in all fields with valid details.';
      msg.classList.add('form-msg--error');
      msg.hidden = false;
      bad && bad.focus();
      return;
    }
    onSubmit(mode, Object.fromEntries(new FormData(form)));
  });

  function onSubmit(m) {
    msg.innerHTML =
      'Accounts are coming soon. <button type="button" class="link-btn" data-open-waitlist>Join the waitlist</button> and we’ll let you know.';
    msg.classList.add('form-msg--success');
    msg.hidden = false;
  }
})();
