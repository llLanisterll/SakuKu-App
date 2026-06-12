<script>
  import { auth, ui } from '../lib/store.svelte.js';

  let isLogin = $state(true);
  let email = $state('');
  let username = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let errorMessage = $state('');

  function toggleMode() {
    isLogin = !isLogin;
    email = '';
    username = '';
    password = '';
    confirmPassword = '';
    errorMessage = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    errorMessage = '';

    try {
      if (isLogin) {
        await auth.login(email, password);
        ui.addNotification('Selamat datang kembali!', 'success');
      } else {
        if (password !== confirmPassword) {
          errorMessage = 'Konfirmasi password tidak cocok';
          return;
        }
        if (password.length < 6) {
          errorMessage = 'Password minimal 6 karakter';
          return;
        }
        await auth.register(email, password, username);
        ui.addNotification('Akun berhasil dibuat!', 'success');
      }
    } catch (err) {
      errorMessage = err.message;
      ui.addNotification(err.message, 'error');
    }
  }
</script>

<div class="auth-container animate-fade-in">
  <div class="glass-card auth-card">
    <div class="auth-brand">
      <div class="logo-circle">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h.007v.008H3.75V4.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 7.5h.007v.008H3.75V7.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm15-4.5h.008v.008h-.008V7.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 4.5h.008v.008h-.008V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.75-7.5h.008v.008h-.008V4.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3 16.5h18" />
        </svg>
      </div>
      <h2>SakuKu</h2>
      <p>Catat dan Kendalikan Keuangan Pribadi Anda</p>
    </div>

    <form onsubmit={handleSubmit} class="auth-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          type="email" 
          id="email" 
          bind:value={email} 
          required 
          placeholder="Masukkan email"
          autocomplete="email"
        />
      </div>

      {#if !isLogin}
        <div class="form-group animate-fade-in">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            bind:value={username} 
            required 
            placeholder="Masukkan username"
            autocomplete="username"
          />
        </div>
      {/if}

      <div class="form-group">
        <label for="password">Password</label>
        <input 
          type="password" 
          id="password" 
          bind:value={password} 
          required 
          placeholder="Masukkan password"
          autocomplete="current-password"
        />
      </div>

      {#if !isLogin}
        <div class="form-group animate-fade-in">
          <label for="confirm-password">Konfirmasi Password</label>
          <input 
            type="password" 
            id="confirm-password" 
            bind:value={confirmPassword} 
            required 
            placeholder="Ketik ulang password"
            autocomplete="new-password"
          />
        </div>
      {/if}

      {#if errorMessage}
        <div class="error-banner animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="err-icon">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      {/if}

      <button type="submit" class="btn btn-primary auth-submit-btn">
        {isLogin ? 'Masuk ke Aplikasi' : 'Daftar Akun Baru'}
      </button>
    </form>

    <div class="auth-toggle">
      <span>{isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}</span>
      <button class="toggle-link-btn" onclick={toggleMode}>
        {isLogin ? 'Daftar Sekarang' : 'Masuk Sekarang'}
      </button>
    </div>
  </div>
</div>

<style>
  .auth-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 1.25rem;
    background: radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(124, 58, 237, 0.12) 0%, transparent 40%);
  }

  .auth-card {
    width: 100%;
    max-width: 400px;
    padding: 2rem 1.5rem;
  }

  @media (min-width: 640px) {
    .auth-card { padding: 3rem 2.5rem; }
  }

  .auth-brand {
    text-align: center;
    margin-bottom: 2rem;
  }

  .logo-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, var(--color-primary), #7c3aed);
    color: #fff;
    border-radius: 16px;
    margin-bottom: 1.25rem;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  }

  .logo-circle svg {
    width: 32px;
    height: 32px;
  }

  .auth-brand h2 {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }

  .auth-brand p {
    color: var(--text-secondary);
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: var(--color-danger-bg);
    border: 1px solid var(--color-danger-border);
    border-radius: 12px;
    color: var(--color-danger);
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .err-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .auth-submit-btn {
    margin-top: 0.5rem;
  }

  .auth-toggle {
    margin-top: 1.75rem;
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  @media (min-width: 480px) {
    .auth-toggle { flex-direction: row; justify-content: center; gap: 0.35rem; }
  }

  .toggle-link-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    font-weight: 800;
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0;
  }

  .toggle-link-btn:hover {
    text-decoration: underline;
  }
</style>
