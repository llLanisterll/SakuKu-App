<script>
  import { auth, ui } from '../lib/store.svelte.js';

  function formatRupiah(v) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
  }

  function formatDate(d) {
    if (!d) return '';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(d));
  }

  const thisMonthStr = $derived.by(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const thisMonthTransactions = $derived(
    auth.transactions.filter(t => t.date?.startsWith(thisMonthStr))
  );

  const totalExpense = $derived(
    thisMonthTransactions.filter(t => t.type === 'expense' || !t.type).reduce((sum, t) => sum + t.amount, 0)
  );

  const totalIncome = $derived(
    thisMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  );

  const netBalance = $derived(totalIncome - totalExpense);

  // Kategori Pengeluaran Bulan Ini
  const categorySummary = $derived.by(() => {
    const summary = {};
    const expenseCats = auth.categories.filter(c => c.type === 'expense');
    
    // Inisialisasi kategori kosong
    expenseCats.forEach(c => {
      summary[c.name] = { spent: 0, color: c.color, name: c.name };
    });

    // Hitung nominal dari transaksi bulan berjalan
    thisMonthTransactions
      .filter(t => t.type === 'expense' || !t.type)
      .forEach(t => {
        const catName = t.category || 'Lainnya';
        if (!summary[catName]) {
          const match = auth.categories.find(c => c.name === catName);
          summary[catName] = { spent: 0, color: match ? match.color : '#64748b', name: catName };
        }
        summary[catName].spent += t.amount;
      });

    return Object.values(summary).filter(item => item.spent > 0).sort((a, b) => b.spent - a.spent);
  });

  // Kalkulasi Donut Chart
  const pieSegments = $derived.by(() => {
    let accumulatedPercent = 0;
    const total = categorySummary.reduce((sum, item) => sum + item.spent, 0);
    
    if (total === 0) return [];

    return categorySummary.map(item => {
      const percent = item.spent / total;
      const strokeLength = percent * 314.159;
      // Offset disesuaikan agar dimulai dari arah jam 12 (atas)
      const strokeOffset = 314.159 - (accumulatedPercent * 314.159) + 78.539; 
      accumulatedPercent += percent;
      return {
        ...item,
        percent: Math.round(percent * 100),
        strokeLength,
        strokeOffset
      };
    });
  });

  const templates = $derived(auth.templates);

  function applyTemplate(tpl) {
    sessionStorage.setItem('sakuku_applied_template', JSON.stringify(tpl));
    ui.currentTab = 'input';
    ui.addNotification(`Template "${tpl.label}" siap digunakan!`, 'success');
  }

  const recentTransactions = $derived(
    [...auth.transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date) || Number(b.id) - Number(a.id))
      .slice(0, 4)
  );

  function getCategoryColor(catName) {
    const cat = auth.categories.find(c => c.name === catName);
    return cat ? cat.color : '#64748b';
  }
</script>

<div class="space-y-6 animate-fade-in pb-12">
  <!-- Header Dasbor -->
  <div class="page-header">
    <h1 class="page-title">
      <span class="page-header-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
      </span>
      Ringkasan Keuangan
    </h1>
    <p class="page-subtitle">
      Halo <span class="username-highlight" style="font-weight: 700; color: var(--color-primary);">{auth.currentUser.username}</span>, pantau kondisi pengeluaran Anda hari ini.
    </p>
  </div>

  <!-- Cards Grid Utama (3 Kolom) -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Card Pemasukan -->
    <div class="glass-card interactive-card metric-card border-l-4" style="border-left-color: var(--color-success)">
      <div class="card-icon-wrapper bg-success-light text-success">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <div class="metric-info">
        <span class="metric-label">Pemasukan Bulan Ini</span>
        <h2 class="metric-value text-success">{formatRupiah(totalIncome)}</h2>
      </div>
    </div>

    <!-- Card Pengeluaran -->
    <div class="glass-card interactive-card metric-card border-l-4" style="border-left-color: var(--color-danger)">
      <div class="card-icon-wrapper expense-icon bg-danger-light text-danger">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
        </svg>
      </div>
      <div class="metric-info">
        <span class="metric-label">Pengeluaran Bulan Ini</span>
        <h2 class="metric-value text-danger">{formatRupiah(totalExpense)}</h2>
      </div>
    </div>

    <!-- Card Saldo -->
    <div class="glass-card interactive-card metric-card border-l-4" style="border-left-color: var(--color-primary)">
      <div class="card-icon-wrapper text-primary" style="background-color: rgba(var(--color-primary-rgb), 0.1);">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>
      </div>
      <div class="metric-info">
        <span class="metric-label">Sisa Saldo Kas</span>
        <h2 class="metric-value {netBalance < 0 ? 'text-danger' : 'text-primary'}">{formatRupiah(netBalance)}</h2>
      </div>
    </div>
  </div>

  <!-- Layout Visual: Grafik Kiri, Presets Kanan -->
  <div class="dashboard-body-grid">
    <!-- Panel Kiri: Grafik Donut Kategori -->
    <div class="glass-card chart-panel">
      <div class="panel-header">
        <h3>Alokasi Pengeluaran</h3>
        <p class="panel-subtitle">Persentase pengeluaran bulan ini berdasarkan kategori anggaran.</p>
      </div>

      {#if totalExpense > 0}
        <div class="chart-content">
          <!-- Donut SVG -->
          <div class="donut-chart-wrapper">
            <svg class="donut-svg" viewBox="0 0 120 120">
              <circle class="donut-track" cx="60" cy="60" r="50" fill="none" stroke-width="12"></circle>
              {#each pieSegments as segment}
                <circle 
                  class="donut-segment" 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  fill="none" 
                  stroke={segment.color} 
                  stroke-width="12" 
                  stroke-dasharray="{segment.strokeLength} 314.159"
                  stroke-dashoffset={segment.strokeOffset}
                >
                  <title>{segment.name}: {segment.percent}%</title>
                </circle>
              {/each}
            </svg>
            <div class="donut-inner-text">
              <span class="inner-total-val">{formatRupiah(totalExpense)}</span>
              <span class="inner-total-lbl">Pengeluaran</span>
            </div>
          </div>

          <!-- Legenda Kategori -->
          <div class="chart-legend">
            {#each categorySummary as item}
              <div class="legend-row">
                <span class="color-dot" style="background-color: {item.color}"></span>
                <span class="legend-name">{item.name}</span>
                <span class="legend-percent">{Math.round((item.spent / totalExpense) * 100)}%</span>
                <span class="legend-amount">{formatRupiah(item.spent)}</span>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="empty-state py-12">
          <div class="empty-icon">📊</div>
          <p class="empty-text">Belum ada transaksi pengeluaran bulan ini.</p>
          <button class="btn btn-primary btn-sm mt-3" onclick={() => ui.currentTab = 'input'}>Catat Sekarang</button>
        </div>
      {/if}
    </div>

    <!-- Panel Kanan: Template & Transaksi Terbaru -->
    <div class="space-y-6">
      <!-- Template Cepat -->
      <div class="glass-card template-panel">
        <div class="panel-header">
          <h3>Template Cepat</h3>
          <p class="panel-subtitle">Isi cepat pengeluaran rutin Anda dengan satu ketukan.</p>
        </div>
        <div class="template-list">
          {#each templates as tpl}
            <button class="template-item-btn" onclick={() => applyTemplate(tpl)}>
              <div class="template-meta">
                <span class="template-label">{tpl.label}</span>
                <span class="template-desc">{tpl.desc}</span>
              </div>
              <div class="template-amount-badge">
                <span class="tpl-amt">{formatRupiah(tpl.amount)}</span>
                <span class="tpl-cat" style="color: {getCategoryColor(tpl.category)}">{tpl.category}</span>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Transaksi Terbaru -->
      <div class="glass-card recent-panel">
        <div class="panel-header flex-header">
          <div>
            <h3>Catatan Terbaru</h3>
            <p class="panel-subtitle">Log aktivitas keuangan paling akhir.</p>
          </div>
          <button class="btn-link" onclick={() => ui.currentTab = 'history'}>Lihat Semua</button>
        </div>

        <div class="recent-list">
          {#each recentTransactions as tx (tx.id)}
            <div class="recent-item">
              <div class="recent-item-meta">
                <span class="recent-desc">{tx.description}</span>
                <div class="recent-sub">
                  <span class="recent-date">{formatDate(tx.date)}</span>
                </div>
              </div>
              <span class="recent-amount text-danger">
                -{formatRupiah(tx.amount)}
              </span>
            </div>
          {:else}
            <p class="empty-recent-text">Belum ada transaksi tercatat.</p>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* ── Page Header Styles Unified ── */
  
  /* Metric Card Custom Hover Glows */
  .expense-card:hover {
    border-color: rgba(244, 63, 94, 0.35) !important;
    box-shadow: var(--shadow-lg), 0 0 20px rgba(244, 63, 94, 0.15) !important;
  }

  .metric-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
  }

  @media (min-width: 640px) {
    .metric-card {
      gap: 1.25rem;
      padding: 1.5rem;
    }
  }

  .card-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    flex-shrink: 0;
  }

  .card-icon-wrapper svg {
    width: 24px;
    height: 24px;
  }

  .expense-icon {
    background-color: var(--color-danger-bg);
    color: var(--color-danger);
  }

  .metric-info {
    display: flex;
    flex-direction: column;
  }

  .metric-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .metric-value {
    font-family: var(--font-title);
    font-size: 1.2rem;
    font-weight: 800;
    margin-top: 0.125rem;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  @media (min-width: 640px) {
    .metric-value {
      font-size: 1.5rem;
    }
  }



  .text-danger {
    color: var(--color-danger);
  }

  /* Body Layout Grid */
  .dashboard-body-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  @media (min-width: 1024px) {
    .dashboard-body-grid {
      grid-template-columns: 1.4fr 1fr;
    }
  }

  .panel-header {
    margin-bottom: 1.5rem;
  }

  .panel-header h3 {
    font-size: 1.125rem;
    font-weight: 700;
  }

  .panel-subtitle {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    margin-top: 0.125rem;
  }

  .flex-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .btn-link {
    background: none;
    border: none;
    color: var(--color-primary);
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .btn-link:hover {
    text-decoration: underline;
  }

  /* Chart Styles */
  .chart-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  @media (min-width: 640px) {
    .chart-content {
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
    }
  }

  .donut-chart-wrapper {
    position: relative;
    width: 140px;
    height: 140px;
    flex-shrink: 0;
  }

  @media (min-width: 640px) {
    .donut-chart-wrapper {
      width: 160px;
      height: 160px;
    }
  }

  .donut-svg {
    transform: rotate(-90deg);
  }

  .donut-track {
    stroke: rgba(255, 255, 255, 0.04);
  }

  :root.light-theme .donut-track {
    stroke: rgba(0, 0, 0, 0.04);
  }

  .donut-segment {
    transition: stroke-dashoffset 0.5s ease;
  }

  .donut-inner-text {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .inner-total-val {
    font-family: var(--font-title);
    font-size: 0.95rem;
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1.1;
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .inner-total-lbl {
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-top: 0.25rem;
  }

  .chart-legend {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    max-width: 320px;
  }

  .legend-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
    padding-bottom: 0.5rem;
  }

  :root.light-theme .legend-row {
    border-bottom-color: rgba(0, 0, 0, 0.05);
  }

  .color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .legend-name {
    font-weight: 600;
    color: var(--text-primary);
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .legend-percent {
    color: var(--text-muted);
    font-weight: 600;
    margin-right: 0.5rem;
  }

  .legend-amount {
    font-weight: 700;
    color: var(--text-primary);
    text-align: right;
  }

  /* Template Panel */
  .template-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .template-item-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1rem;
    background-color: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
  }

  :root.light-theme .template-item-btn {
    background-color: rgba(0, 0, 0, 0.01);
  }

  .template-item-btn:hover {
    border-color: var(--color-primary);
    background-color: rgba(99, 102, 241, 0.05);
    transform: translateX(3px);
  }

  .template-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding-right: 0.5rem;
  }

  .template-label {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .template-desc {
    font-size: 0.6875rem;
    color: var(--text-muted);
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 0.125rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  @media (min-width: 640px) {
    .template-desc {
      white-space: nowrap;
      display: block;
      -webkit-line-clamp: unset;
      line-clamp: unset;
    }
  }

  .template-amount-badge {
    text-align: right;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .tpl-amt {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .tpl-cat {
    font-size: 0.625rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.125rem;
  }

  /* Recent Panel */
  .recent-list {
    display: flex;
    flex-direction: column;
  }

  .recent-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 0;
    border-bottom: 1px solid var(--border-color);
  }

  .recent-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .recent-item-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding-right: 0.5rem;
  }

  .recent-desc {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .recent-sub {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .recent-date {
    font-size: 0.6875rem;
    color: var(--text-muted);
  }

  .recent-amount {
    font-size: 0.8125rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .empty-state, .empty-recent-text {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.8125rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .empty-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .space-y-6 > * + * {
    margin-top: 1.5rem;
  }

  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    border-radius: 8px;
  }

  .mt-3 {
    margin-top: 0.75rem;
  }
</style>
