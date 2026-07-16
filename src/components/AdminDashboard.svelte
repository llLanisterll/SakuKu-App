<script>
  import { auth } from '../lib/store.svelte.js';

  let usersData = $state([]);
  
  $effect(() => {
    auth.getAllUsersData().then(data => {
      usersData = data;
    });
  });

  const totalUsers = $derived(usersData.length);
  const totalTransactions = $derived(usersData.reduce((s, u) => s + Number(u.transactionCount || 0), 0));
</script>

<div class="admin-page animate-fade-in pb-12">
  <!-- Header -->
  <div class="page-header">
    <h1 class="page-title">
      <span class="page-header-icon admin-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </span>
      Dashboard Admin
    </h1>
    <p class="page-subtitle">Ringkasan aktivitas seluruh pengguna dalam aplikasi SakuKu.</p>
  </div>

  <!-- Summary Stats -->
  <div class="admin-stats-grid">
    <div class="admin-stat-card glass-card">
      <div class="stat-icon-box stat-users">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-label">Total Pengguna</span>
        <span class="stat-value">{totalUsers}</span>
        <span class="stat-sub">akun terdaftar</span>
      </div>
    </div>

    <div class="admin-stat-card glass-card">
      <div class="stat-icon-box stat-tx">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-label">Total Transaksi</span>
        <span class="stat-value">{totalTransactions.toLocaleString('id-ID')}</span>
        <span class="stat-sub">dari semua pengguna</span>
      </div>
    </div>

  </div>

  <!-- Admin Info Card -->
  <div class="glass-card admin-info-card mt-4">
    <div class="admin-info-icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    </div>
    <div class="admin-info-text">
      <strong>Anda masuk sebagai Superadmin</strong>
      <span>Akun ini memiliki akses penuh untuk melihat dan mengelola semua pengguna. Data pengguna disimpan secara lokal di browser ini.</span>
    </div>
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

  .admin-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  @media (min-width: 768px) {
    .admin-stats-grid { grid-template-columns: repeat(2, 1fr); }
  }

  .admin-stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
  }

  .stat-icon-box {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-icon-box svg { width: 22px; height: 22px; }

  .stat-users { background: rgba(99,102,241,0.12); color: #6366f1; }
  .stat-tx    { background: rgba(16,185,129,0.12); color: #10b981; }
  .stat-expense { background: rgba(244,63,94,0.12); color: #f43f5e; }
  .stat-month { background: rgba(245,158,11,0.12); color: #f59e0b; }

  .stat-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .stat-label {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 0.125rem;
  }

  .stat-value {
    font-family: var(--font-title);
    font-size: 1.75rem;
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1.1;
    letter-spacing: -0.03em;
  }

  .stat-value-sm {
    font-family: var(--font-title);
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stat-sub {
    font-size: 0.6875rem;
    color: var(--text-muted);
    margin-top: 0.15rem;
  }

  .admin-info-card {
    display: flex;
    align-items: flex-start;
    gap: 0.875rem;
    padding: 1rem 1.25rem;
    border-color: rgba(245,158,11,0.2);
    background: rgba(245,158,11,0.04);
  }

  .mt-4 { margin-top: 1rem; }

  .admin-info-icon {
    color: #f59e0b;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .admin-info-icon svg { width: 18px; height: 18px; }

  .admin-info-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8125rem;
  }

  .admin-info-text strong {
    color: var(--text-primary);
    font-weight: 700;
  }

  .admin-info-text span {
    color: var(--text-muted);
    line-height: 1.5;
  }
</style>
