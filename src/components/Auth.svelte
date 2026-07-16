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

  async function handleGoogleLogin() {
    errorMessage = '';
    await auth.loginWithGoogle();
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
        <label for="identifier">{isLogin ? 'Email atau Username' : 'Email'}</label>
        <input 
          type={isLogin ? "text" : "email"} 
          id="identifier" 
          bind:value={email} 
          required 
          placeholder={isLogin ? "Masukkan email atau username" : "Masukkan email"}
          autocomplete="username"
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

    <div class="auth-divider">
      <span>atau</span>
    </div>

    <button type="button" class="btn-google" onclick={handleGoogleLogin} disabled={auth.currentUser !== null}>
      <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Masuk dengan Google
    </button>

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

  /* Divider */
  .auth-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.5rem 0 1rem;
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .auth-divider::before,
  .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-color);
  }

  /* Google Button */
  .btn-google {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1.25rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-body);
  }

  :root.light-theme .btn-google {
    background: rgba(0, 0, 0, 0.03);
  }

  .btn-google:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--border-color-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  :root.light-theme .btn-google:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.06);
  }

  .btn-google:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-google:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .google-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
</style>
