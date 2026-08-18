document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const authModal = document.getElementById('authModal');
  const closeAuthButton = document.getElementById('closeAuth') || document.querySelector('.close-auth');

  if (!loginForm || !registerForm || !loginTab || !registerTab || !authModal || !closeAuthButton) {
    return;
  }

  function switchTab(tab) {
    const showingLogin = tab === 'login';

    loginForm.classList.toggle('hidden', !showingLogin);
    registerForm.classList.toggle('hidden', showingLogin);
    loginTab.classList.toggle('active', showingLogin);
    registerTab.classList.toggle('active', !showingLogin);
  }

  loginTab.addEventListener('click', function () {
    switchTab('login');
  });

  registerTab.addEventListener('click', function () {
    switchTab('register');
  });

  document.querySelectorAll('[data-auth-open]').forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      openAuth();
      switchTab(button.dataset.authOpen || 'login');
    });
  });

  document.querySelectorAll('.terms-link').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      window.location.href = link.getAttribute('href');
    });
  });

  closeAuthButton.addEventListener('click', closeAuth);

  authModal.addEventListener('click', function (event) {
    if (event.target === authModal) {
      authModal.style.display = 'none';
    }
  });

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    alert('Login submitted successfully.');
  });

  registerForm.addEventListener('submit', function (event) {
    event.preventDefault();
    alert('Registration submitted successfully.');
    registerForm.reset();
    switchTab('login');
  });

  authModal.style.display = 'none';
  authModal.classList.remove('active');
});

function openAuth() {
  const authModal = document.getElementById('authModal');

  if (authModal) {
    authModal.style.display = 'block';
    authModal.classList.add('active');
  }
}

function closeAuth() {
  const authModal = document.getElementById('authModal');

  if (authModal) {
    authModal.style.display = 'none';
    authModal.classList.remove('active');
  }
}

function togglePassword(id) {
  const input = document.getElementById(id);

  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}
