<script>
  import { auth, ui } from '../lib/store.svelte.js';

  let usersData = $state([]);
  let isDeleting = $state(false);

  async function loadUsers() {
    usersData = await auth.getAllUsersData();
  }

  $effect(() => {
    loadUsers();
  });

  const totalUsers = $derived(usersData.length);

  function handleDeleteUser(userId, username) {
    // Jangan izinkan hapus akun sendiri
    if (userId === auth.currentUser?.id) {
      ui.addNotification('Anda tidak dapat menghapus akun Anda sendiri.', 'warning');
      return;
    }
    ui.askConfirmation({
      title: 'Hapus Pengguna',
      message: `Apakah Anda yakin ingin menghapus akun "${username}" beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Permanen',
      type: 'danger',
      onConfirm: async () => {
        isDeleting = true;
        try {
          await auth.deleteUser(userId);
          ui.addNotification(`Akun "${username}" berhasil dihapus.`, 'success');
          await loadUsers();
        } catch (e) {
          ui.addNotification(e.message || 'Gagal menghapus akun.', 'error');
        } finally {
          isDeleting = false;
        }
      }
    });
  }

  function getInitial(name) {
    return name ? name[0].toUpperCase() : '?';
  }

  const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #f43f5e, #ec4899)',
    'linear-gradient(135deg, #f97316, #f59e0b)',
    'linear-gradient(135deg, #10b981, #14b8a6)',
    'linear-gradient(135deg, #3b82f6, #6366f1)',
    'linear-gradient(135deg, #a855f7, #ec4899)',
  ];

  function getAvatarGradient(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
  }
</script>

<div class="admin-page animate-fade-in pb-12">
  <div class="page-header">
    <h1 class="page-title">
      <span class="page-header-icon admin-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      </span>
      Manajemen Pengguna
    </h1>
    <p class="page-subtitle">Kelola dan pantau daftar akun pengguna yang terdaftar di SakuKu.</p>
  </div>

  <div class="glass-card users-panel">
    <div class="users-panel-header">
      <div>
        <h2 class="users-panel-title">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          Daftar Pengguna Terdaftar
        </h2>
        <p class="users-panel-sub">{totalUsers} akun aktif dalam sistem</p>
      </div>
      <span class="users-count-badge">{totalUsers} Users</span>
    </div>

    {#if usersData.length === 0}
      <div class="empty-users">
        <div class="empty-users-icon">👥</div>
        <h3>Belum Ada Pengguna</h3>
        <p>Belum ada akun pengguna yang terdaftar di sistem ini.</p>
      </div>
    {:else}
      <div class="users-grid">
        {#each usersData as user}
          <div class="user-card animate-fade-in" class:is-self={user.id === auth.currentUser?.id}>
            <div class="user-card-header">
              <div class="user-avatar-lg" style="background: {getAvatarGradient(user.username)}">
                {getInitial(user.username)}
              </div>
              <div class="user-card-info">
                <span class="user-card-name">
                  {user.username}
                  {#if user.id === auth.currentUser?.id}
                    <span class="self-badge">Anda</span>
                  {/if}
                </span>
                <span class="user-card-role">{user.isSuperAdmin ? 'Superadmin' : 'Pengguna'}</span>
              </div>
              {#if user.id !== auth.currentUser?.id && !user.isSuperAdmin}
                <button
                  class="btn-delete-user"
                  onclick={() => handleDeleteUser(user.id, user.username)}
                  title="Hapus Akun"
                  disabled={isDeleting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.34 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              {/if}
            </div>

            <div class="user-stats-row">
              <div class="user-stat">
                <span class="ustat-val">{user.transactionCount}</span>
                <span class="ustat-lbl">Transaksi</span>
              </div>
              <div class="user-stat">
                <span class="ustat-val">{user.categoryCount}</span>
                <span class="ustat-lbl">Kategori</span>
              </div>
              <div class="user-stat">
                <span class="ustat-val">{user.templateCount}</span>
                <span class="ustat-lbl">Template</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .admin-page {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .admin-icon {
    background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,179,8,0.1));
    border-color: rgba(245,158,11,0.3);
    color: #f59e0b;
    box-shadow: 0 4px 12px rgba(245,158,11,0.15);
  }

  .users-panel { padding: 1.5rem; }

  @media (min-width: 640px) { .users-panel { padding: 2rem; } }

  .users-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.75rem;
  }

  .users-panel-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.125rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .users-panel-title svg { width: 18px; height: 18px; color: var(--color-primary); flex-shrink: 0; }

  .users-panel-sub { font-size: 0.8125rem; color: var(--text-muted); }

  .users-count-badge {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-primary);
    background: var(--color-primary-glow);
    border: 1px solid rgba(99,102,241,0.2);
    padding: 0.35rem 0.875rem;
    border-radius: 99px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .users-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  @media (min-width: 640px) { .users-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .users-grid { grid-template-columns: repeat(3, 1fr); } }

  .user-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all 0.2s ease;
  }

  :root.light-theme .user-card { background: rgba(0,0,0,0.015); }

  .user-card:hover {
    border-color: var(--border-color-hover);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }

  .user-card-header { display: flex; align-items: center; gap: 0.75rem; }

  .user-avatar-lg {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font-family: var(--font-title);
    font-size: 1.125rem;
    font-weight: 900;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  .user-card-info { flex-grow: 1; min-width: 0; display: flex; flex-direction: column; }

  .user-card-name {
    font-size: 0.9375rem; font-weight: 700; color: var(--text-primary);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .user-card-role { font-size: 0.6875rem; color: var(--text-muted); font-weight: 500; }

  .btn-delete-user {
    background: none; border: none;
    color: var(--text-muted); cursor: pointer;
    padding: 0.375rem; border-radius: 8px;
    transition: all 0.15s; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  }

  .btn-delete-user svg { width: 16px; height: 16px; }

  .btn-delete-user:hover:not(:disabled) { color: var(--color-danger); background: var(--color-danger-bg); }
  .btn-delete-user:disabled { opacity: 0.4; cursor: not-allowed; }

  .user-card.is-self {
    border-color: rgba(99,102,241,0.35);
    background: rgba(99,102,241,0.05);
  }

  .self-badge {
    display: inline-block;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-primary);
    background: var(--color-primary-glow);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 4px;
    padding: 0.1rem 0.35rem;
    margin-left: 0.35rem;
    vertical-align: middle;
  }

  .user-stats-row {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;
    padding: 0.75rem; background: rgba(255,255,255,0.03);
    border-radius: var(--radius-md); border: 1px solid var(--border-color);
  }

  :root.light-theme .user-stats-row { background: rgba(0,0,0,0.02); }

  .user-stat { display: flex; flex-direction: column; align-items: center; text-align: center; }

  .ustat-val {
    font-size: 1.125rem; font-weight: 800; font-family: var(--font-title); color: var(--text-primary);
  }

  .ustat-lbl {
    font-size: 0.625rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;
    letter-spacing: 0.04em; margin-top: 0.1rem;
  }

  .empty-users {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 4rem 2rem; text-align: center; gap: 0.5rem;
  }

  .empty-users-icon { font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.5; }
  .empty-users h3 { font-size: 1.125rem; color: var(--text-primary); }
  .empty-users p { font-size: 0.875rem; color: var(--text-muted); }
</style>
