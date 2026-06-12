<script>
  import { auth, ui } from '../lib/store.svelte.js';

  // State Filter
  let searchQuery = $state('');
  let filterType = $state('all'); // 'all' | 'expense' | 'income'
  let filterPeriod = $state('all'); // 'all' | 'today' | 'weekly' | 'monthly' | 'yearly'
  let filterCategory = $state('all');
  let filterPayment = $state('all');
  let filterMonth = $state('all'); // 'YYYY-MM' or 'all'

  function formatRupiah(v) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
  }

  function formatDate(d) {
    if (!d) return '';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));
  }

  function getDayName(d) {
    if (!d) return '';
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date(d));
  }

  function formatMonthName(mStr) {
    if (!mStr || mStr === 'all') return 'Semua Bulan';
    const [year, month] = mStr.split('-');
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1));
  }

  // Get unique months from transactions for the dropdown
  const availableMonths = $derived.by(() => {
    const months = new Set();
    auth.transactions.forEach(t => {
      if (t.date) {
        months.add(t.date.substring(0, 7)); // 'YYYY-MM'
      }
    });
    return Array.from(months).sort().reverse();
  });

  // Helper to check date ranges
  function isInPeriod(txDate, period) {
    if (period === 'all') return true;
    const now = new Date();
    const d = new Date(txDate);
    
    // Normalize today to start of day
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const txStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    if (period === 'today') {
      return txStart.getTime() === todayStart.getTime();
    }
    
    if (period === 'weekly') {
      const lastWeek = new Date(todayStart);
      lastWeek.setDate(todayStart.getDate() - 7);
      return txStart >= lastWeek && txStart <= todayStart;
    }
    
    if (period === 'monthly') {
      return txStart.getMonth() === todayStart.getMonth() && txStart.getFullYear() === todayStart.getFullYear();
    }
    
    if (period === 'yearly') {
      return txStart.getFullYear() === todayStart.getFullYear();
    }
    
    return true;
  }

  // Transaksi Terfilter (Derived State)
  const filteredTransactions = $derived.by(() => {
    return auth.transactions
      .filter(t => {
        if (filterType === 'expense' && t.type === 'income') return false;
        if (filterType === 'income' && t.type !== 'income') return false;
        if (searchQuery.trim() && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        if (!isInPeriod(t.date, filterPeriod)) {
          return false;
        }
        if (filterMonth !== 'all' && !t.date.startsWith(filterMonth)) {
          return false;
        }
        if (filterCategory !== 'all' && t.category !== filterCategory) {
          return false;
        }
        if (filterPayment !== 'all' && t.payment_method !== filterPayment) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date) || Number(b.id) - Number(a.id));
  });

  // Grouping transactions by date
  const groupedTransactions = $derived.by(() => {
    const groups = {};
    filteredTransactions.forEach(tx => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  });

  const filteredExpenseTotal = $derived(
    filteredTransactions.filter(t => t.type !== 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  );
  const filteredIncomeTotal = $derived(
    filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  );
  const filteredNetBalance = $derived(filteredIncomeTotal - filteredExpenseTotal);

  function getCategoryColor(catName) {
    const cat = auth.categories.find(c => c.name === catName);
    return cat ? cat.color : '#64748b';
  }

  function handleDeleteTx(id, desc) {
    ui.askConfirmation({
      title: 'Hapus Transaksi',
      message: `Apakah Anda yakin ingin menghapus catatan transaksi "${desc}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        await auth.deleteTransaction(id);
        ui.addNotification('Transaksi berhasil dihapus!', 'success');
      }
    });
  }

  function handleResetFilters() {
    searchQuery = '';
    filterType = 'all';
    filterPeriod = 'all';
    filterCategory = 'all';
    filterPayment = 'all';
    filterMonth = 'all';
  }
</script>

<div class="history-page-wrapper animate-fade-in pb-12">
  
  <!-- Page Header -->
  <div class="page-header">
    <h1 class="page-title">
      <span class="page-header-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
      </span>
      Riwayat Transaksi
    </h1>
    <p class="page-subtitle">Kelola dan pantau seluruh catatan keuangan — pengeluaran maupun pemasukan.</p>
  </div>

  <!-- Top Summary Bar -->
  <div class="summary-top-bar glass-card">
    <div class="summary-grid">
      <div class="summary-stat">
        <span class="summary-stat-lbl">Pemasukan</span>
        <strong class="summary-stat-val" style="color:#10b981;">+{formatRupiah(filteredIncomeTotal)}</strong>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-stat">
        <span class="summary-stat-lbl">Pengeluaran</span>
        <strong class="summary-stat-val" style="color:#ef4444;">-{formatRupiah(filteredExpenseTotal)}</strong>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-stat">
        <span class="summary-stat-lbl">Selisih</span>
        <strong class="summary-stat-val" style="color:{filteredNetBalance >= 0 ? 'var(--color-primary)' : '#ef4444'};">{filteredNetBalance >= 0 ? '+' : ''}{formatRupiah(filteredNetBalance)}</strong>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-stat">
        <span class="summary-stat-lbl">Total Catatan</span>
        <strong class="summary-stat-val">{filteredTransactions.length}</strong>
      </div>
    </div>
  </div>

  <!-- Controls Panel -->
  <div class="controls-panel glass-card">
    
    <!-- Row 0: Type Tabs -->
    <div class="row-type-tabs">
      <button class="type-tab {filterType === 'all' ? 'type-active' : ''}" onclick={() => { filterType = 'all'; filterCategory = 'all'; }}>
        Semua Transaksi
      </button>
      <button class="type-tab {filterType === 'income' ? 'type-active income-active' : ''}" onclick={() => { filterType = 'income'; filterCategory = 'all'; }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Pemasukan
      </button>
      <button class="type-tab {filterType === 'expense' ? 'type-active expense-active' : ''}" onclick={() => { filterType = 'expense'; filterCategory = 'all'; }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" /></svg>
        Pengeluaran
      </button>
    </div>

    <!-- Row 1: Search & Reset -->
    <div class="row-search-reset">
      <div class="search-input-inner">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          placeholder="Cari deskripsi transaksi..." 
          bind:value={searchQuery}
        />
      </div>
      <button class="btn-reset-pill" onclick={handleResetFilters}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Reset
      </button>
    </div>

    <!-- Row 2: Period Tabs -->
    <div class="row-period-tabs">
      <span class="filter-label">Periode:</span>
      <div class="tabs-list">
        <button class="tab-btn {filterPeriod === 'all' ? 'active' : ''}" onclick={() => filterPeriod = 'all'}>Semua</button>
        <button class="tab-btn {filterPeriod === 'today' ? 'active' : ''}" onclick={() => filterPeriod = 'today'}>Harian</button>
        <button class="tab-btn {filterPeriod === 'weekly' ? 'active' : ''}" onclick={() => filterPeriod = 'weekly'}>Mingguan</button>
        <button class="tab-btn {filterPeriod === 'monthly' ? 'active' : ''}" onclick={() => filterPeriod = 'monthly'}>Bulanan</button>
        <button class="tab-btn {filterPeriod === 'yearly' ? 'active' : ''}" onclick={() => filterPeriod = 'yearly'}>Tahunan</button>
      </div>
    </div>

    <!-- Row 3: Advanced Selectors -->
    <div class="row-advanced-filters">
      <div class="adv-col">
        <label for="adv-month">Pilih Bulan</label>
        <select id="adv-month" bind:value={filterMonth}>
          <option value="all">Semua Bulan</option>
          {#each availableMonths as m}
            <option value={m}>{formatMonthName(m)}</option>
          {/each}
        </select>
      </div>
      <div class="adv-col">
        <label for="adv-cat">Kategori</label>
        <select id="adv-cat" bind:value={filterCategory}>
          <option value="all">Semua Kategori</option>
          {#each auth.categories as cat}
            <option value={cat.name}>{cat.name}</option>
          {/each}
        </select>
      </div>
      <div class="adv-col">
        <label for="adv-pay">Metode</label>
        <select id="adv-pay" bind:value={filterPayment}>
          <option value="all">Semua Metode</option>
          <option value="Tunai">Tunai</option>
          <option value="Transfer Bank">Transfer Bank</option>
          <option value="QRIS">QRIS</option>
          <option value="Kredit/Tempo">Kredit/Tempo</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Transactions List Grouped by Date -->
  <div class="history-list-area">
    {#each groupedTransactions as [date, transactions]}
      <div class="date-group">
        <div class="date-header">
          <div class="date-info">
            <span class="day-name">{getDayName(date)}</span>
            <span class="date-full">{formatDate(date)}</span>
          </div>
          <div class="date-sum">
            {formatRupiah(transactions.reduce((s, t) => s + t.amount, 0))}
          </div>
        </div>

        <div class="transactions-stack">
          {#each transactions as tx (tx.id)}
            {@const isIncome = tx.type === 'income'}
            {@const txColor = isIncome ? '#10b981' : getCategoryColor(tx.category)}
            <div class="transaction-item-card">
              <div class="tx-main-info">
                <div class="tx-icon-box" style="background-color: {txColor}20; color: {txColor}">
                  {#if isIncome}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75-3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5h15a2.25 2.25 0 002.25-2.25V14.25" />
                    </svg>
                  {/if}
                </div>
                <div class="tx-details">
                  <h4 class="tx-desc">{tx.description}</h4>
                  <div class="tx-meta-row">
                    <span class="tx-type-badge" style="background:{txColor}18; color:{txColor}">{isIncome ? '↑ Masuk' : '↓ Keluar'}</span>
                    <span class="tx-cat-tag" style="color: {txColor}">{tx.category}</span>
                    <span class="tx-meta-dot"></span>
                    <span class="tx-method">{tx.payment_method}</span>
                    {#if tx.quantity > 1}
                      <span class="tx-meta-dot"></span>
                      <span class="tx-qty">Qty: {tx.quantity}</span>
                    {/if}
                  </div>
                </div>
              </div>
              <div class="tx-action-side">
                <div class="tx-amount" style="color:{isIncome ? '#10b981' : '#ef4444'}">{isIncome ? '+' : '-'}{formatRupiah(tx.amount)}</div>
                <button class="btn-delete-tx" onclick={() => handleDeleteTx(tx.id, tx.description)} title="Hapus">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="empty-state-card glass-card">
        <div class="empty-icon">📂</div>
        <h3>Tidak Ada Riwayat</h3>
        <p>Belum ada transaksi yang sesuai dengan kriteria filter Anda.</p>
        <button class="btn btn-primary btn-sm mt-3" onclick={handleResetFilters}>Bersihkan Filter</button>
      </div>
    {/each}
  </div>
</div>

<style>
  .history-page-wrapper {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* Summary Top Bar */
  .summary-top-bar {
    padding: 1rem 1.5rem;
  }
  .summary-grid {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  .summary-stat {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 0.5rem 1.25rem;
    min-width: 0;
  }
  .summary-stat:first-child { padding-left: 0; }
  .summary-stat-lbl {
    font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--color-muted);
  }
  .summary-stat-val {
    font-size: 1rem; font-weight: 800; margin-top: 0.2rem; white-space: nowrap;
  }
  .summary-divider {
    width: 1px; height: 40px; background: var(--border-color); flex-shrink: 0;
  }

  /* Type Filter Tabs */
  .row-type-tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .type-tab {
    display: flex; align-items: center; gap: 0.375rem;
    padding: 0.5rem 1.25rem;
    background: var(--bg-base);
    border: 1px solid var(--border-color);
    border-radius: 100px;
    font-size: 0.875rem; font-weight: 600;
    color: var(--color-muted);
    cursor: pointer; transition: all 0.2s;
  }
  .type-tab svg { width: 14px; height: 14px; }
  .type-tab:hover { color: var(--text-foreground); border-color: var(--color-primary); }
  .type-active { color: var(--color-primary) !important; border-color: var(--color-primary) !important; background: rgba(99,102,241,0.08) !important; }
  .income-active { color: #10b981 !important; border-color: #10b981 !important; background: rgba(16,185,129,0.08) !important; }
  .expense-active { color: #ef4444 !important; border-color: #ef4444 !important; background: rgba(239,68,68,0.08) !important; }

  /* tx type badge */
  .tx-type-badge {
    font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.05em; padding: 0.1rem 0.4rem;
    border-radius: 100px; flex-shrink: 0;
  }

  .summary-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .summary-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .summary-value {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--color-primary);
    font-family: var(--font-title);
    text-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
  }

  .count-badge {
    background: var(--color-primary-glow);
    color: var(--color-primary);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.35rem 0.75rem;
    border-radius: 99px;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }

  /* Controls Panel */
  .controls-panel {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
  }

  /* Row 1: Search & Reset */
  .row-search-reset {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .search-input-inner {
    position: relative;
    flex-grow: 1;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input-inner input {
    padding-left: 2.75rem;
    font-size: 0.9375rem;
    height: 44px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.05);
  }

  :root.light-theme .search-input-inner input {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.08);
  }

  .btn-reset-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 44px;
    padding: 0 1.25rem;
    border-radius: 12px;
    background: var(--color-primary-glow);
    color: var(--color-primary);
    border: 1px solid rgba(99, 102, 241, 0.15);
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-reset-pill:hover {
    background: var(--color-primary);
    color: #fff;
  }

  .btn-reset-pill svg { width: 16px; height: 16px; }

  /* Row 2: Period Tabs */
  .row-period-tabs {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .filter-label {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .tabs-list {
    display: flex;
    background: rgba(0, 0, 0, 0.15);
    padding: 0.25rem;
    border-radius: 12px;
    gap: 0.15rem;
  }

  :root.light-theme .tabs-list {
    background: rgba(0, 0, 0, 0.05);
  }

  .tab-btn {
    padding: 0.45rem 1rem;
    border-radius: 99px;
    border: none;
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-muted);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    color: var(--text-primary);
  }

  .tab-btn.active {
    background: var(--color-primary);
    color: #fff;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }

  /* Row 3: Advanced Selectors */
  .row-advanced-filters {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .adv-col {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .adv-col label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .adv-col select {
    height: 38px;
    font-size: 0.8125rem;
    border-radius: 10px;
    padding: 0 0.65rem;
  }

  /* History List */
  .history-list-area {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .date-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .date-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0 0.5rem;
  }

  .date-info {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .day-name {
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .date-full {
    font-size: 0.8125rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .date-sum {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .transactions-stack {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .transaction-item-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    transition: all 0.2s ease;
  }

  .transaction-item-card:hover {
    transform: translateX(4px);
    border-color: var(--border-color-hover);
    background: var(--bg-card-hover);
  }

  .tx-main-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
  }

  .tx-icon-box {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tx-icon-box svg {
    width: 20px;
    height: 20px;
  }

  .tx-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .tx-desc {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tx-meta-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.125rem;
  }

  .tx-cat-tag {
    font-size: 0.75rem;
    font-weight: 700;
  }

  .tx-meta-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--text-muted);
    opacity: 0.5;
  }

  .tx-method, .tx-qty {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .tx-action-side {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
  }

  .tx-amount {
    font-size: 1rem;
    font-weight: 800;
    font-family: var(--font-title);
  }

  .btn-delete-tx {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s;
    opacity: 0;
  }

  .transaction-item-card:hover .btn-delete-tx {
    opacity: 1;
  }

  .btn-delete-tx:hover {
    color: var(--color-danger);
    background: var(--color-danger-bg);
  }

  .btn-delete-tx svg {
    width: 18px;
    height: 18px;
  }

  /* Empty State */
  .empty-state-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    gap: 0.5rem;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
  }

  .empty-state-card h3 {
    font-size: 1.125rem;
    color: var(--text-primary);
  }

  .empty-state-card p {
    font-size: 0.875rem;
    color: var(--text-muted);
    max-width: 300px;
  }

  @media (max-width: 640px) {
    .controls-panel {
      padding: 1rem;
    }
    
    .transaction-item-card {
      padding: 0.875rem 1rem;
    }

    .tx-action-side {
      gap: 0.5rem;
    }

    .btn-delete-tx {
      opacity: 1;
    }

    .tx-amount {
      font-size: 0.9375rem;
    }

    .row-search-reset {
      flex-direction: column;
      align-items: stretch;
    }

    .btn-reset-pill {
      justify-content: center;
    }

    .tabs-list {
      width: 100%;
      overflow-x: auto;
    }

    .tab-btn {
      flex: 1;
      padding: 0.45rem 0.5rem;
      font-size: 0.75rem;
    }

    .row-advanced-filters {
      grid-template-columns: 1fr;
    }
  }
</style>