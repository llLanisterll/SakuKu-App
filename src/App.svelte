<script>
  import Auth from './components/Auth.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import ExpenseEntry from './components/ExpenseEntry.svelte';
  import DataManager from './components/DataManager.svelte';
  import TransactionHistory from './components/TransactionHistory.svelte';
  import Settings from './components/Settings.svelte';
  import Reports from './components/Reports.svelte';
  import AdminDashboard from './components/AdminDashboard.svelte';
  import AdminUsers from './components/AdminUsers.svelte';
  import Notification from './components/Notification.svelte';
  import Confirmation from './components/Confirmation.svelte';
  import InstallPrompt from './components/InstallPrompt.svelte';
  
  import { auth, ui } from './lib/store.svelte.js';

  const isSuperAdmin = $derived(!!auth.currentUser?.isSuperAdmin);

  function handleToggleTheme() {
    auth.toggleTheme();
    ui.addNotification(`Tema diubah ke ${auth.currentUser.theme === 'light' ? 'Terang ☀️' : 'Gelap 🌙'}`, 'info');
  }

  function handleLogout() {
    ui.askConfirmation({
      title: 'Keluar Akun',
      message: 'Apakah Anda yakin ingin keluar dari akun Anda?',
      confirmText: 'Keluar',
      type: 'danger',
      onConfirm: async () => {
        await auth.logout();
        ui.addNotification('Berhasil keluar!', 'success');
      }
    });
  }
</script>

{#if ui.isLoading}
  <div class="global-loader-overlay">
    <div class="loader-spinner"></div>
    <p>Memproses...</p>
  </div>
{/if}

{#if !auth.currentUser}
  <Auth />
{:else if isSuperAdmin}
  <!-- ══════════════════════════════════════
       SUPERADMIN LAYOUT
  ══════════════════════════════════════ -->
  <div class="app-layout">
    <!-- Sidebar Admin Desktop -->
    <aside class="app-sidebar admin-sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo admin-brand-logo">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div class="brand-name-group">
          <span class="brand-name">SakuKu</span>
          <span class="admin-badge">Admin</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button class="nav-item-btn {ui.currentTab === 'admin-dashboard' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'admin-dashboard'}>
          <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="nav-label">Dashboard Admin</span>
        </button>

        <button class="nav-item-btn {ui.currentTab === 'admin-users' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'admin-users'}>
          <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span class="nav-label">Manajemen Pengguna</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="footer-action-btn" onclick={handleToggleTheme}>
          {#if auth.currentUser.theme === 'light'}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
            <span>Mode Gelap</span>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.58 1.58m12.42 12.42l1.58 1.58M3 12h2.25m13.5 0H21M6.02 17.98l1.58-1.58M16.42 7.58l1.58-1.58M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
            </svg>
            <span>Mode Terang</span>
          {/if}
        </button>

        <div class="user-profile-row admin-profile-row">
          <div class="user-avatar admin-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div class="user-meta-info">
            <span class="user-name-txt">superadmin</span>
            <button class="btn-logout-link" onclick={handleLogout}>Keluar</button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Admin Mobile Header -->
    <header class="mobile-app-header admin-mobile-header">
      <div class="mobile-header-brand">
        <div class="brand-logo-small admin-brand-logo-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <span class="mobile-brand-name">Admin Panel</span>
      </div>
      <div class="mobile-header-actions">
        <button class="mobile-action-btn" onclick={handleToggleTheme} title="Ganti Tema">
          {#if auth.currentUser.theme === 'light'}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.58 1.58m12.42 12.42l1.58 1.58M3 12h2.25m13.5 0H21M6.02 17.98l1.58-1.58M16.42 7.58l1.58-1.58M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
            </svg>
          {/if}
        </button>
        <button class="mobile-action-btn is-danger" onclick={handleLogout} title="Keluar">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    </header>

    <main class="app-main-content">
      <div class="container">
        {#if ui.currentTab === 'admin-dashboard'}
          <AdminDashboard />
        {:else if ui.currentTab === 'admin-users'}
          <AdminUsers />
        {/if}
      </div>
    </main>

    <!-- Admin Mobile Bottom Nav -->
    <nav class="mobile-bottom-navbar admin-mobile-nav">
      <button class="mobile-nav-btn {ui.currentTab === 'admin-dashboard' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'admin-dashboard'}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Dashboard</span>
      </button>

      <button class="mobile-nav-btn {ui.currentTab === 'admin-users' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'admin-users'}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Users</span>
      </button>
    </nav>
  </div>

{:else}
  <!-- ══════════════════════════════════════
       NORMAL USER LAYOUT
  ══════════════════════════════════════ -->
  <div class="app-layout">
    
    <!-- Sidebar (Desktop) -->
    <aside class="app-sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h.007v.008H3.75V4.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 7.5h.007v.008H3.75V7.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm15-4.5h.008v.008h-.008V7.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 4.5h.008v.008h-.008V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.75-7.5h.008v.008h-.008V4.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3 16.5h18" />
          </svg>
        </div>
        <span class="brand-name">SakuKu</span>
      </div>

      <nav class="sidebar-nav">
        <button class="nav-item-btn {ui.currentTab === 'dashboard' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'dashboard'}>
          <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="nav-label">Dashboard</span>
        </button>

        <button class="nav-item-btn {ui.currentTab === 'input' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'input'}>
          <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="nav-label">Catat Pengeluaran</span>
        </button>

        <button class="nav-item-btn {ui.currentTab === 'data' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'data'}>
          <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span class="nav-label">Kelola Data</span>
        </button>

        <button class="nav-item-btn {ui.currentTab === 'history' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'history'}>
          <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span class="nav-label">Riwayat</span>
        </button>

        <button class="nav-item-btn {ui.currentTab === 'reports' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'reports'}>
          <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <span class="nav-label">Laporan</span>
        </button>


      </nav>

      <div class="sidebar-footer">
        <button class="footer-action-btn {ui.currentTab === 'settings' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'settings'}>
          <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Pengaturan</span>
        </button>

        <button class="footer-action-btn" onclick={handleToggleTheme}>
          {#if auth.currentUser.theme === 'light'}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
            <span>Mode Gelap</span>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.58 1.58m12.42 12.42l1.58 1.58M3 12h2.25m13.5 0H21M6.02 17.98l1.58-1.58M16.42 7.58l1.58-1.58M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
            </svg>
            <span>Mode Terang</span>
          {/if}
        </button>

        <div class="user-profile-row">
          <div class="user-avatar">
            {auth.currentUser.username[0].toUpperCase()}
          </div>
          <div class="user-meta-info">
            <span class="user-name-txt">{auth.currentUser.username}</span>
            <button class="btn-logout-link" onclick={handleLogout}>Keluar</button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile Top Header -->
    <header class="mobile-app-header">
      <div class="mobile-header-brand">
        <div class="brand-logo-small">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h.007v.008H3.75V4.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 7.5h.007v.008H3.75V7.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm15-4.5h.008v.008h-.008V7.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 4.5h.008v.008h-.008V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.75-7.5h.008v.008h-.008V4.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3 16.5h18" />
          </svg>
        </div>
        <span class="mobile-brand-name">SakuKu</span>
      </div>
      <div class="mobile-header-actions">
        <button class="mobile-action-btn" onclick={handleToggleTheme} title="Ganti Tema">
          {#if auth.currentUser.theme === 'light'}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.58 1.58m12.42 12.42l1.58 1.58M3 12h2.25m13.5 0H21M6.02 17.98l1.58-1.58M16.42 7.58l1.58-1.58M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
            </svg>
          {/if}
        </button>
        <button class="mobile-action-btn is-danger" onclick={handleLogout} title="Keluar">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main-content">
      <div class="container">
        {#if ui.currentTab === 'dashboard'}
          <Dashboard />
        {:else if ui.currentTab === 'input'}
          <ExpenseEntry />
        {:else if ui.currentTab === 'history'}
          <TransactionHistory />
        {:else if ui.currentTab === 'reports'}
          <Reports />
        {:else if ui.currentTab === 'data'}
          <DataManager />
        {:else if ui.currentTab === 'settings'}
          <Settings />
        {/if}
      </div>
    </main>

    <!-- Mobile Bottom Nav -->
    <nav class="mobile-bottom-navbar">
      <button class="mobile-nav-btn {ui.currentTab === 'dashboard' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'dashboard'}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Home</span>
      </button>

      <button class="mobile-nav-btn {ui.currentTab === 'input' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'input'}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Catat</span>
      </button>

      <button class="mobile-nav-btn {ui.currentTab === 'reports' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'reports'}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <span>Laporan</span>
      </button>

      <button class="mobile-nav-btn {ui.currentTab === 'history' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'history'}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span>Riwayat</span>
      </button>

      <button class="mobile-nav-btn {ui.currentTab === 'settings' ? 'is-active' : ''}" onclick={() => ui.currentTab = 'settings'}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Setelan</span>
      </button>
    </nav>
  </div>
{/if}

<!-- Global UI Components -->
<Notification />
<Confirmation />
<InstallPrompt />

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow-x: hidden;
  }

  @media (min-width: 1024px) {
    .app-layout { flex-direction: row; }
  }

  /* ── Sidebar ── */
  .app-sidebar {
    display: none;
    flex-direction: column;
    width: 252px;
    background-color: var(--bg-sidebar);
    border-right: 1px solid var(--border-color);
    padding: 1.5rem 1rem;
    position: sticky;
    top: 0;
    height: 100vh;
    flex-shrink: 0;
    z-index: 50;
    overflow: hidden;
  }

  @media (min-width: 1024px) { .app-sidebar { display: flex; } }

  .admin-sidebar {
    border-right-color: rgba(245,158,11,0.15);
    background: linear-gradient(180deg, var(--bg-sidebar) 0%, rgba(245,158,11,0.02) 100%);
  }
  
  .admin-mobile-nav {
    border-top-color: rgba(245,158,11,0.15);
  }
  .admin-mobile-nav .mobile-nav-btn.is-active {
    color: #f59e0b;
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.875rem 0.75rem 0.375rem;
    margin-bottom: 1.75rem;
  }

  .brand-logo {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--color-primary), #7c3aed);
    color: #fff;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 10px rgba(99, 102, 241, 0.35);
  }



  .global-loader-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
  }
  .loader-spinner {
    width: 40px; height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  @keyframes spin { 100% { transform: rotate(360deg); } }
  .admin-brand-logo {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    box-shadow: 0 4px 10px rgba(245,158,11,0.35);
  }

  .brand-logo svg { width: 18px; height: 18px; }

  .brand-name-group {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .brand-name {
    font-family: var(--font-title);
    font-size: 1.3125rem;
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .admin-badge {
    font-size: 0.5625rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #f59e0b;
    background: rgba(245,158,11,0.12);
    padding: 0.05rem 0.35rem;
    border-radius: 4px;
    width: fit-content;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex-grow: 1;
  }

  .nav-item-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6875rem 0.875rem;
    background: none;
    border: none;
    color: var(--text-secondary);
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: color 0.15s ease, background-color 0.15s ease;
    font-family: var(--font-sans);
    position: relative;
    overflow: hidden;
  }

  .nav-item-btn:hover {
    color: var(--text-primary);
    background-color: rgba(255,255,255,0.05);
  }

  :root.light-theme .nav-item-btn:hover { background-color: rgba(0,0,0,0.045); }

  .nav-item-btn.is-active {
    color: #fff;
    background: linear-gradient(135deg, var(--color-primary), #7c3aed);
    box-shadow: 0 3px 10px rgba(99, 102, 241, 0.2);
    font-weight: 600;
  }

  .admin-sidebar .nav-item-btn.is-active {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    box-shadow: 0 3px 10px rgba(245, 158, 11, 0.2);
  }

  .nav-icon { width: 17px; height: 17px; flex-shrink: 0; }
  .nav-item-btn.is-active .nav-icon { stroke-width: 2.5px; }
  .nav-label { font-size: 0.875rem; font-weight: 500; }
  .nav-item-btn.is-active .nav-label { font-weight: 600; }

  .sidebar-footer {
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .footer-action-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.875rem;
    background: none;
    border: none;
    color: var(--text-secondary);
    border-radius: 10px;
    cursor: pointer;
    width: 100%;
    font-family: var(--font-sans);
    font-size: 0.8125rem;
    font-weight: 500;
    transition: color 0.15s ease, background-color 0.15s ease;
  }

  .footer-action-btn:hover { color: var(--text-primary); background-color: rgba(255,255,255,0.05); }
  :root.light-theme .footer-action-btn:hover { background-color: rgba(0,0,0,0.045); }

  .footer-action-btn.is-active {
    color: var(--color-primary);
    background-color: var(--color-primary-glow);
    font-weight: 700;
  }

  .footer-action-btn svg { width: 16px; height: 16px; flex-shrink: 0; }

  .user-profile-row {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.625rem 0.75rem 0.375rem;
  }

  .user-avatar {
    width: 34px; height: 34px;
    background: var(--color-primary-glow);
    border: 1.5px solid var(--color-primary);
    color: var(--color-primary);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-title);
    font-weight: 800;
    font-size: 0.9375rem;
    flex-shrink: 0;
  }

  .admin-avatar {
    background: rgba(245,158,11,0.12);
    border-color: #f59e0b;
    color: #f59e0b;
  }

  .admin-avatar svg { width: 18px; height: 18px; }

  .user-meta-info { display: flex; flex-direction: column; min-width: 0; }

  .user-name-txt {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .btn-logout-link {
    background: none; border: none;
    color: var(--color-danger);
    font-weight: 600; font-size: 0.6875rem;
    cursor: pointer; text-align: left; padding: 0;
    transition: opacity 0.15s;
  }

  .btn-logout-link:hover { opacity: 0.75; text-decoration: underline; }

  /* ── Mobile Header ── */
  .mobile-app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background-color: var(--bg-sidebar);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .admin-mobile-header { border-bottom-color: rgba(245,158,11,0.15); }

  @media (min-width: 1024px) { .mobile-app-header { display: none; } }

  .mobile-header-brand { display: flex; align-items: center; gap: 0.5rem; }

  .brand-logo-small {
    width: 28px; height: 28px;
    background: linear-gradient(135deg, var(--color-primary), #7c3aed);
    color: #fff;
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
  }

  .admin-brand-logo-sm {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }

  .brand-logo-small svg { width: 15px; height: 15px; }

  .mobile-brand-name {
    font-family: var(--font-title);
    font-size: 1rem;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  .mobile-header-actions { display: flex; align-items: center; gap: 0.25rem; }

  .mobile-action-btn {
    width: 32px; height: 32px;
    background: none; border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s ease;
  }

  .mobile-action-btn svg { width: 17px; height: 17px; }

  .mobile-action-btn:hover { background-color: rgba(255,255,255,0.07); color: var(--text-primary); }
  .mobile-action-btn.is-danger:hover { background-color: var(--color-danger-bg); color: var(--color-danger); }

  /* ── Main Content ── */
  .app-main-content {
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: 72px;
  }

  @media (min-width: 1024px) {
    .app-main-content { padding-bottom: 0; height: 100vh; }
  }

  /* ── Mobile Bottom Nav ── */
  .mobile-bottom-navbar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background-color: var(--bg-sidebar);
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-around;
    padding: 0.375rem 0.5rem;
    padding-bottom: calc(0.375rem + env(safe-area-inset-bottom, 0px));
    z-index: 50;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 -1px 0 var(--border-color);
  }

  @media (min-width: 1024px) { .mobile-bottom-navbar { display: none; } }

  .mobile-nav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1875rem;
    background: none; border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.5625rem;
    font-weight: 500;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    flex: 1;
    padding: 0.375rem 0.25rem;
    border-radius: 7px;
    transition: color 0.15s ease;
    font-family: var(--font-sans);
  }

  .mobile-nav-btn svg {
    width: 19px; height: 19px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.75px;
  }

  .mobile-nav-btn.is-active { color: var(--color-primary); font-weight: 700; }
  .mobile-nav-btn.is-active svg { stroke-width: 2.5px; }
</style>
