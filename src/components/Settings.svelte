<script>
  import { auth, ui } from '../lib/store.svelte.js';

  // Profile Form States
  let newUsername = $state(auth.currentUser.username);
  let oldPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let profileLoading = $state(false);

  const expenseCats = $derived(auth.categories.filter(c => c.type === 'expense'));

  async function handleUpdateProfile(e) {
    if (e) e.preventDefault();
    
    if (newPassword && newPassword !== confirmPassword) {
      ui.addNotification('Konfirmasi password tidak cocok', 'error');
      return;
    }

    profileLoading = true;
    try {
      await auth.updateProfile({
        newUsername,
        oldPassword,
        newPassword: newPassword || null
      });
      ui.addNotification('Profil berhasil diperbarui', 'success');
      oldPassword = '';
      newPassword = '';
      confirmPassword = '';
    } catch (err) {
      ui.addNotification(err.message, 'error');
    } finally {
      profileLoading = false;
    }
  }

  function handleResetData() {
    ui.askConfirmation({
      title: 'Reset Seluruh Data',
      message: 'Apakah Anda yakin ingin menghapus seluruh transaksi, kategori, dan template? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Reset Data',
      type: 'danger',
      onConfirm: async () => {
        await auth.resetData();
        ui.addNotification('Seluruh data telah direset ke setelan pabrik', 'success');
        ui.currentTab = 'dashboard';
      }
    });
  }

  function formatRupiah(v) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
  }
</script>

<div class="settings-page animate-fade-in pb-12">
  <!-- Page Header -->
  <div class="page-header">
    <h1 class="page-title">
      <span class="page-header-icon icon-warning">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
      </span>
      Pengaturan Akun & Data
    </h1>
    <p class="page-subtitle">Kelola profil akun Anda, atur template pengeluaran, dan manajemen data.</p>
  </div>

  <div class="settings-grid">
    <!-- Profil Section -->
    <div class="glass-card settings-card">
      <div class="card-header">
        <div class="header-icon-box text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </div>
        <div class="header-text">
          <h2 class="settings-title">Profil Pengguna</h2>
          <p class="settings-subtitle">Ubah nama tampilan dan kata sandi keamanan Anda.</p>
        </div>
      </div>

      <form onsubmit={handleUpdateProfile} class="settings-form">
        <div class="form-group">
          <label for="set-username">Nama Pengguna</label>
          <input 
            type="text" 
            id="set-username" 
            bind:value={newUsername} 
            placeholder="Username baru" 
            required 
          />
        </div>

        <div class="divider"></div>

        <div class="password-fields">
          <p class="section-label">Ganti Kata Sandi (Opsional)</p>
          <div class="form-group">
            <label for="set-old-pass">Kata Sandi Lama</label>
            <input 
              type="password" 
              id="set-old-pass" 
              bind:value={oldPassword} 
              placeholder="Masukkan password saat ini" 
              required={newPassword.length > 0}
            />
          </div>
          <div class="form-group">
            <label for="set-new-pass">Kata Sandi Baru</label>
            <input 
              type="password" 
              id="set-new-pass" 
              bind:value={newPassword} 
              placeholder="Minimal 6 karakter" 
            />
          </div>
          <div class="form-group">
            <label for="set-confirm-pass">Konfirmasi Kata Sandi Baru</label>
            <input 
              type="password" 
              id="set-confirm-pass" 
              bind:value={confirmPassword} 
              placeholder="Ulangi password baru" 
            />
          </div>
        </div>

        <button type="submit" class="btn btn-primary w-full mt-2" disabled={profileLoading}>
          {#if profileLoading}
            <div class="spinner"></div>
            Simpan Perubahan...
          {:else}
            Simpan Perubahan
          {/if}
        </button>
      </form>
    </div>

    <!-- Data Management Section -->
    <div class="glass-card settings-card danger-zone">
      <div class="card-header">
        <div class="header-icon-box text-danger">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.34 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </div>
        <div class="header-text">
          <h2 class="settings-title">Zona Berbahaya</h2>
          <p class="settings-subtitle">Manajemen data permanen yang tidak dapat dipulihkan.</p>
        </div>
      </div>

      <div class="danger-box">
        <div class="danger-info">
          <h3 class="danger-label">Reset Seluruh Data Aplikasi</h3>
          <p class="danger-desc">
            Ini akan menghapus secara permanen seluruh catatan transaksi, kategori khusus, dan template Anda. 
            Data akan dikembalikan ke kondisi awal (default).
          </p>
        </div>
        <button type="button" class="btn btn-danger" onclick={handleResetData}>
          Reset Semua Data
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  /* ── Header – Unified ── */

  .settings-page {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .settings-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 0;
  }

  .settings-card {
    padding: 1.75rem;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.75rem;
  }

  .header-icon-box {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background-color: rgba(99, 102, 241, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .header-icon-box.text-danger {
    background-color: rgba(244, 63, 94, 0.1);
  }

  .header-icon-box svg {
    width: 22px;
    height: 22px;
  }

  .settings-title {
    font-size: 1.125rem;
    font-weight: 700;
  }

  .settings-subtitle {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin-top: 0.125rem;
  }

  .settings-form {
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

  .section-label {
    font-size: 0.8125rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .password-fields {
    padding: 1.25rem;
    background-color: rgba(255, 255, 255, 0.02);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  :root.light-theme .password-fields {
    background-color: rgba(0, 0, 0, 0.015);
  }

  .divider {
    height: 1px;
    background-color: var(--border-color);
    margin: 0.5rem 0;
  }

  /* Danger Zone */
  .danger-zone {
    border-color: rgba(244, 63, 94, 0.2);
  }

  .danger-box {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem;
    background-color: rgba(244, 63, 94, 0.04);
    border: 1px solid rgba(244, 63, 94, 0.1);
    border-radius: 16px;
  }

  @media (min-width: 640px) {
    .danger-box {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }

  .danger-info {
    max-width: 480px;
  }

  .danger-label {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-danger);
  }

  .danger-desc {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
    line-height: 1.4;
  }

  .w-full { width: 100%; }
</style>
