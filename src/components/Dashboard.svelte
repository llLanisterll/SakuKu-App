<script>
  import { auth, ui } from '../lib/store.svelte.js';

  function formatRupiah(v) {
    if (!v && v !== 0) return 'Rp 0';
    const num = Number(v);
    if (isNaN(num)) return 'Rp 0';
    if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}M`;
    if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}Jt`;
    if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)}Rb`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  }

  function formatRupiahFull(v) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);
  }

  function formatDate(d) {
    if (!d) return '';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(d));
  }

  // ── Time helpers ──
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth(); // 0-indexed
  const thisMonthStr = `${thisYear}-${String(thisMonth + 1).padStart(2, '0')}`;

  // Current week: Monday to Sunday
  function getWeekRange() {
    const day = now.getDay(); // 0=Sunday
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  }

  const weekRange = getWeekRange();

  // ── Derived stats ──
  const thisMonthTransactions = $derived(
    auth.transactions.filter(t => t.date?.startsWith(thisMonthStr))
  );

  const totalMonthExpense = $derived(
    thisMonthTransactions.filter(t => t.type === 'expense' || !t.type).reduce((s, t) => s + Number(t.amount), 0)
  );

  const totalMonthIncome = $derived(
    thisMonthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  );

  const netBalance = $derived(totalMonthIncome - totalMonthExpense);

  const totalWeekExpense = $derived(
    auth.transactions
      .filter(t => (t.type === 'expense' || !t.type) && t.date)
      .filter(t => {
        const d = new Date(t.date);
        return d >= weekRange.start && d <= weekRange.end;
      })
      .reduce((s, t) => s + Number(t.amount), 0)
  );

  const totalWeekIncome = $derived(
    auth.transactions
      .filter(t => t.type === 'income' && t.date)
      .filter(t => {
        const d = new Date(t.date);
        return d >= weekRange.start && d <= weekRange.end;
      })
      .reduce((s, t) => s + Number(t.amount), 0)
  );

  const totalYearExpense = $derived(
    auth.transactions
      .filter(t => (t.type === 'expense' || !t.type) && t.date?.startsWith(String(thisYear)))
      .reduce((s, t) => s + Number(t.amount), 0)
  );

  const totalYearIncome = $derived(
    auth.transactions
      .filter(t => t.type === 'income' && t.date?.startsWith(String(thisYear)))
      .reduce((s, t) => s + Number(t.amount), 0)
  );

  // ── Category summary for donut ──
  const categorySummary = $derived.by(() => {
    const summary = {};
    auth.categories.filter(c => c.type === 'expense').forEach(c => {
      summary[c.name] = { spent: 0, color: c.color, name: c.name };
    });
    thisMonthTransactions.filter(t => t.type === 'expense' || !t.type).forEach(t => {
      const catName = t.category || 'Lainnya';
      if (!summary[catName]) {
        const match = auth.categories.find(c => c.name === catName);
        summary[catName] = { spent: 0, color: match?.color || '#64748b', name: catName };
      }
      summary[catName].spent += Number(t.amount);
    });
    return Object.values(summary).filter(i => i.spent > 0).sort((a, b) => b.spent - a.spent);
  });

  const pieSegments = $derived.by(() => {
    let accumulated = 0;
    const total = categorySummary.reduce((s, i) => s + i.spent, 0);
    if (total === 0) return [];
    return categorySummary.map(item => {
      const pct = item.spent / total;
      const strokeLen = pct * 314.159;
      const strokeOff = 314.159 - (accumulated * 314.159) + 78.539;
      accumulated += pct;
      return { ...item, percent: Math.round(pct * 100), strokeLen, strokeOff };
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
      .slice(0, 5)
  );

  function getCategoryColor(catName) {
    const cat = auth.categories.find(c => c.name === catName);
    return cat ? cat.color : '#64748b';
  }

  // Month name for display
  const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const currentMonthName = monthNames[thisMonth];
</script>

<div class="dashboard animate-fade-in pb-12">

  <!-- ── GREETING ── -->
  <div class="greeting-bar">
    <div>
      <h1 class="greeting-title">Halo, <span class="accent">{auth.currentUser.username}</span> 👋</h1>
      <p class="greeting-sub">Pantau kondisi keuangan Anda hari ini.</p>
    </div>
    <div class="greeting-date">
      <span class="date-day">{now.getDate()}</span>
      <span class="date-info">{currentMonthName} {thisYear}</span>
    </div>
  </div>

  <!-- ── STAT CARDS GRID ── -->
  <!-- Row 1: 3 main monthly cards -->
  <div class="stat-grid-3">
    <!-- Pemasukan Bulan Ini -->
    <div class="stat-card income-card">
      <div class="stat-icon-box" style="background: rgba(16,185,129,0.15);">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
      </div>
      <div class="stat-body">
        <span class="stat-period">Pemasukan · {currentMonthName}</span>
        <strong class="stat-value income-val">{formatRupiah(totalMonthIncome)}</strong>
        <span class="stat-full">{formatRupiahFull(totalMonthIncome)}</span>
      </div>
      <button class="stat-action" onclick={() => ui.currentTab = 'income'} title="Catat Pemasukan">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
      </button>
    </div>

    <!-- Pengeluaran Bulan Ini -->
    <div class="stat-card expense-card">
      <div class="stat-icon-box" style="background: rgba(239,68,68,0.15);">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" /></svg>
      </div>
      <div class="stat-body">
        <span class="stat-period">Pengeluaran · {currentMonthName}</span>
        <strong class="stat-value expense-val">{formatRupiah(totalMonthExpense)}</strong>
        <span class="stat-full">{formatRupiahFull(totalMonthExpense)}</span>
      </div>
      <button class="stat-action" onclick={() => ui.currentTab = 'input'} title="Catat Pengeluaran">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
      </button>
    </div>

    <!-- Saldo Bersih Bulan Ini -->
    <div class="stat-card balance-card">
      <div class="stat-icon-box" style="background: rgba(99,102,241,0.15);">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" /></svg>
      </div>
      <div class="stat-body">
        <span class="stat-period">Saldo · {currentMonthName}</span>
        <strong class="stat-value" style="color: {netBalance < 0 ? 'var(--color-danger)' : 'var(--color-primary)'};">{formatRupiah(netBalance)}</strong>
        <span class="stat-full" style="color: {netBalance < 0 ? 'var(--color-danger)' : 'var(--color-muted)'};">{netBalance < 0 ? '⚠ Defisit!' : 'Surplus bulan ini'}</span>
      </div>
      <button class="stat-action" onclick={() => ui.currentTab = 'planning'} title="Rencana Keuangan">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
      </button>
    </div>
  </div>

  <!-- Row 2: 3 period cards (week / month / year expense) -->
  <div class="stat-grid-3 mt-4">
    <!-- Minggu ini -->
    <div class="stat-card period-card">
      <div class="period-card-header">
        <span class="period-badge week-badge">Minggu Ini</span>
      </div>
      <div class="period-row">
        <div class="period-item">
          <span class="period-lbl">Keluar</span>
          <strong class="period-val expense-val">{formatRupiah(totalWeekExpense)}</strong>
        </div>
        <div class="period-divider"></div>
        <div class="period-item">
          <span class="period-lbl">Masuk</span>
          <strong class="period-val income-val">{formatRupiah(totalWeekIncome)}</strong>
        </div>
      </div>
    </div>

    <!-- Bulan ini -->
    <div class="stat-card period-card">
      <div class="period-card-header">
        <span class="period-badge month-badge">{currentMonthName} {thisYear}</span>
      </div>
      <div class="period-row">
        <div class="period-item">
          <span class="period-lbl">Keluar</span>
          <strong class="period-val expense-val">{formatRupiah(totalMonthExpense)}</strong>
        </div>
        <div class="period-divider"></div>
        <div class="period-item">
          <span class="period-lbl">Masuk</span>
          <strong class="period-val income-val">{formatRupiah(totalMonthIncome)}</strong>
        </div>
      </div>
    </div>

    <!-- Tahun ini -->
    <div class="stat-card period-card">
      <div class="period-card-header">
        <span class="period-badge year-badge">Tahun {thisYear}</span>
      </div>
      <div class="period-row">
        <div class="period-item">
          <span class="period-lbl">Keluar</span>
          <strong class="period-val expense-val">{formatRupiah(totalYearExpense)}</strong>
        </div>
        <div class="period-divider"></div>
        <div class="period-item">
          <span class="period-lbl">Masuk</span>
          <strong class="period-val income-val">{formatRupiah(totalYearIncome)}</strong>
        </div>
      </div>
    </div>
  </div>

  <!-- ── BODY GRID ── -->
  <div class="dashboard-body-grid mt-6">

    <!-- LEFT: Donut Chart -->
    <div class="glass-card chart-panel">
      <div class="panel-header">
        <h3 class="panel-title">Alokasi Pengeluaran</h3>
        <p class="panel-subtitle">Persentase berdasarkan kategori bulan {currentMonthName}.</p>
      </div>

      {#if totalMonthExpense > 0}
        <div class="chart-content">
          <div class="donut-wrapper">
            <svg class="donut-svg" viewBox="0 0 120 120">
              <circle class="donut-track" cx="60" cy="60" r="50" fill="none" stroke-width="12"></circle>
              {#each pieSegments as seg}
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={seg.color}
                  stroke-width="12"
                  stroke-dasharray="{seg.strokeLen} 314.159"
                  stroke-dashoffset={seg.strokeOff}
                >
                  <title>{seg.name}: {seg.percent}%</title>
                </circle>
              {/each}
            </svg>
            <div class="donut-center">
              <span class="donut-val">{formatRupiah(totalMonthExpense)}</span>
              <span class="donut-lbl">Total</span>
            </div>
          </div>

          <div class="chart-legend">
            {#each categorySummary as item}
              <div class="legend-row">
                <span class="legend-dot" style="background:{item.color}"></span>
                <span class="legend-name">{item.name}</span>
                <span class="legend-pct">{Math.round((item.spent / totalMonthExpense) * 100)}%</span>
                <span class="legend-amt">{formatRupiah(item.spent)}</span>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <p class="empty-text">Belum ada pengeluaran bulan ini.</p>
          <button class="btn btn-primary btn-sm" onclick={() => ui.currentTab = 'input'}>Catat Sekarang</button>
        </div>
      {/if}
    </div>

    <!-- RIGHT: Templates + Recents -->
    <div class="right-col">

      <!-- Template Cepat -->
      {#if templates.length > 0}
        <div class="glass-card template-panel">
          <div class="panel-header">
            <h3 class="panel-title">Template Cepat</h3>
            <p class="panel-subtitle">Catat pengeluaran rutin dengan satu ketukan.</p>
          </div>
          <div class="template-list">
            {#each templates as tpl}
              <button class="tpl-btn" onclick={() => applyTemplate(tpl)}>
                <div class="tpl-meta">
                  <span class="tpl-label">{tpl.label}</span>
                  <span class="tpl-desc">{tpl.desc}</span>
                </div>
                <div class="tpl-badge">
                  <span class="tpl-amt">{formatRupiah(tpl.amount)}</span>
                  <span class="tpl-cat" style="color:{getCategoryColor(tpl.category)}">{tpl.category}</span>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Transaksi Terbaru -->
      <div class="glass-card recent-panel">
        <div class="panel-header flex-header">
          <div>
            <h3 class="panel-title">Catatan Terbaru</h3>
            <p class="panel-subtitle">Log aktivitas keuangan paling akhir.</p>
          </div>
          <button class="btn-link" onclick={() => ui.currentTab = 'history'}>Lihat Semua →</button>
        </div>

        <div class="recent-list">
          {#each recentTransactions as tx (tx.id)}
            <div class="recent-item">
              <div class="recent-icon-wrap" style="background: {tx.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}">
                {#if tx.type === 'income'}
                  <svg style="width:14px;height:14px;color:#10b981;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                {:else}
                  <svg style="width:14px;height:14px;color:#ef4444;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" /></svg>
                {/if}
              </div>
              <div class="recent-meta">
                <span class="recent-desc">{tx.description}</span>
                <div class="recent-sub">
                  <span class="recent-cat" style="background: {getCategoryColor(tx.category)}22; color: {getCategoryColor(tx.category)};">{tx.category || 'Lainnya'}</span>
                  <span class="recent-date">{formatDate(tx.date)}</span>
                </div>
              </div>
              <span class="recent-amount" style="color:{tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'};">
                {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
              </span>
            </div>
          {:else}
            <p class="empty-text">Belum ada transaksi tercatat.</p>
          {/each}
        </div>
      </div>

    </div>
  </div>

  <!-- ── FINANCIAL PLAN STATUS ── -->
  {#if auth.budgets.length > 0 || auth.savingGoals.length > 0}
    <div class="glass-card fp-summary-panel mt-6">
      <div class="panel-header" style="margin-bottom: 1.25rem;">
        <h3 class="panel-title">Status Rencana Keuangan</h3>
        <p class="panel-subtitle">Pantau anggaran bulanan dan target tabungan Anda.</p>
      </div>
      <div class="fp-summary-grid">
        <!-- Budgets -->
        <div class="fp-summary-col">
          <h4 class="fp-summary-col-title">Anggaran Bulanan</h4>
          {#if !auth.budgets.find(b => b.category === 'GLOBAL_MONTH')}
            <p class="empty-text">Belum ada anggaran terdaftar.</p>
          {:else}
            {@const budget = auth.budgets.find(b => b.category === 'GLOBAL_MONTH')}
            {@const spent = totalMonthExpense}
            {@const limit = Number(budget.amount)}
            {@const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0}
            <div class="fp-summary-list">
              <div class="fp-mini-item">
                <div class="fp-mini-top">
                  <span class="fp-mini-name">Total Pengeluaran</span>
                  <span class="fp-mini-val" style="color: {spent > limit ? 'var(--color-danger)' : 'var(--text-foreground)'}">{formatRupiah(spent)} / {formatRupiah(limit)}</span>
                </div>
                <div class="fp-mini-track">
                  <div class="fp-mini-fill" style="width: {pct}%; background: {pct >= 100 ? 'var(--color-danger)' : pct > 80 ? 'var(--color-warning)' : 'var(--color-primary)'}"></div>
                </div>
              </div>
              <button class="btn-link" style="align-self: flex-start; margin-top:0.5rem;" onclick={() => ui.currentTab = 'planning'}>Kelola Anggaran →</button>
            </div>
          {/if}
        </div>

        <!-- Saving Goals -->
        <div class="fp-summary-col">
          <h4 class="fp-summary-col-title">Target Tabungan</h4>
          {#if auth.savingGoals.length === 0}
            <p class="empty-text">Belum ada target tabungan.</p>
          {:else}
            <div class="fp-summary-list">
              {#each auth.savingGoals.slice(0, 3) as goal}
                {@const pct = Math.min((goal.current / goal.target) * 100, 100)}
                <div class="fp-mini-item">
                  <div class="fp-mini-top">
                    <span class="fp-mini-name">{goal.name}</span>
                    <span class="fp-mini-val" style="color: {pct >= 100 ? 'var(--color-success)' : 'var(--text-foreground)'}">{formatRupiah(goal.current)} / {formatRupiah(goal.target)}</span>
                  </div>
                  <div class="fp-mini-track">
                    <div class="fp-mini-fill" style="width: {pct}%; background: {pct >= 100 ? 'var(--color-success)' : 'var(--color-primary)'}"></div>
                  </div>
                </div>
              {/each}
              {#if auth.savingGoals.length > 3}
                <button class="btn-link" style="align-self: flex-start; margin-top:0.5rem;" onclick={() => ui.currentTab = 'planning'}>Lihat {auth.savingGoals.length - 3} lainnya →</button>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

</div>

<style>
  .dashboard { width: 100%; }

  /* ── GREETING ── */
  .greeting-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }
  .greeting-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-foreground);
    margin: 0;
  }
  .greeting-title .accent { color: var(--color-primary); }
  .greeting-sub {
    font-size: 0.875rem;
    color: var(--color-muted);
    margin: 0.25rem 0 0;
  }
  .greeting-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--bg-glass);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 0.75rem 1.25rem;
    flex-shrink: 0;
  }
  .date-day {
    font-size: 1.75rem;
    font-weight: 900;
    color: var(--color-primary);
    line-height: 1;
  }
  .date-info {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    margin-top: 0.125rem;
    white-space: nowrap;
  }

  /* ── STAT GRID ── */
  .stat-grid-3 {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  @media (min-width: 640px) {
    .stat-grid-3 { grid-template-columns: repeat(3, 1fr); }
  }

  .mt-4 { margin-top: 1rem; }
  .mt-6 { margin-top: 1.5rem; }

  /* ── STAT CARD (Square style) ── */
  .stat-card {
    background: var(--bg-glass);
    border: 1px solid var(--border-color);
    border-radius: 1.25rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    min-height: 160px;
  }
  .stat-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
  }
  .stat-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 1.25rem;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }

  .income-card { border-top: 3px solid #10b981; }
  .expense-card { border-top: 3px solid #ef4444; }
  .balance-card { border-top: 3px solid var(--color-primary); }

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
  .income-card .stat-icon-box svg { color: #10b981; }
  .expense-card .stat-icon-box svg { color: #ef4444; }
  .balance-card .stat-icon-box svg { color: var(--color-primary); }

  .stat-body {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    flex: 1;
  }
  .stat-period {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
  }
  .stat-value {
    font-size: 1.375rem;
    font-weight: 900;
    line-height: 1.2;
    color: var(--text-foreground);
    margin-top: 0.25rem;
  }
  .stat-full {
    font-size: 0.7rem;
    color: var(--color-muted);
    margin-top: 0.125rem;
  }

  .income-val { color: #10b981 !important; }
  .expense-val { color: #ef4444 !important; }

  .stat-action {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: var(--bg-base);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--color-muted);
    transition: all 0.15s;
  }
  .stat-action:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    transform: translateX(2px);
  }
  .stat-action svg { width: 14px; height: 14px; }

  /* ── PERIOD CARDS ── */
  .period-card {
    border-top: none;
    border-left: 3px solid var(--border-color);
    min-height: 120px;
    justify-content: space-between;
  }
  .period-card-header { margin-bottom: 0.5rem; }
  .period-badge {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.2rem 0.6rem;
    border-radius: 100px;
  }
  .week-badge { background: rgba(251,191,36,0.15); color: #f59e0b; }
  .month-badge { background: rgba(99,102,241,0.15); color: var(--color-primary); }
  .year-badge { background: rgba(168,85,247,0.15); color: #a855f7; }

  .period-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .period-item {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.25rem;
  }
  .period-lbl {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-muted);
  }
  .period-val {
    font-size: 1rem;
    font-weight: 800;
  }
  .period-divider {
    width: 1px;
    height: 40px;
    background: var(--border-color);
    flex-shrink: 0;
  }

  /* ── BODY GRID ── */
  .dashboard-body-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    align-items: start;
  }
  @media (min-width: 1024px) {
    .dashboard-body-grid { grid-template-columns: 1.4fr 1fr; }
  }

  /* Panel commons */
  .panel-header { margin-bottom: 1.25rem; }
  .panel-title { font-size: 1rem; font-weight: 700; color: var(--text-foreground); margin: 0; }
  .panel-subtitle { font-size: 0.8rem; color: var(--color-muted); margin: 0.25rem 0 0; }
  .flex-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .btn-link {
    background: none; border: none; color: var(--color-primary);
    font-weight: 600; font-size: 0.8rem; cursor: pointer; padding: 0; flex-shrink: 0;
  }
  .btn-link:hover { text-decoration: underline; }

  /* ── DONUT CHART ── */
  .chart-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }
  @media (min-width: 640px) {
    .chart-content { flex-direction: row; justify-content: space-around; }
  }

  .donut-wrapper {
    position: relative;
    width: 150px; height: 150px;
    flex-shrink: 0;
  }
  .donut-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
  .donut-track { stroke: rgba(255,255,255,0.05); }
  :root.light-theme .donut-track { stroke: rgba(0,0,0,0.06); }
  .donut-center {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
  }
  .donut-val {
    font-size: 0.875rem; font-weight: 900;
    color: var(--text-foreground);
    max-width: 110px; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap;
  }
  .donut-lbl { font-size: 0.625rem; font-weight: 700; color: var(--color-muted); text-transform: uppercase; margin-top: 2px; }

  .chart-legend { display: flex; flex-direction: column; gap: 0.625rem; width: 100%; max-width: 280px; }
  .legend-row {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.8rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }
  .legend-row:last-child { border-bottom: none; padding-bottom: 0; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .legend-name { font-weight: 600; color: var(--text-foreground); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .legend-pct { color: var(--color-muted); font-weight: 600; font-size: 0.75rem; }
  .legend-amt { font-weight: 700; color: var(--text-foreground); font-size: 0.75rem; }

  /* ── FINANCIAL PLAN STATUS ── */
  .fp-summary-panel { padding: 1.5rem; }
  .fp-summary-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  @media (min-width: 768px) {
    .fp-summary-grid { grid-template-columns: 1fr 1fr; gap: 2rem; }
  }
  .fp-summary-col {
    display: flex; flex-direction: column; gap: 1rem;
  }
  .fp-summary-col-title {
    font-size: 0.9rem; font-weight: 700; color: var(--color-muted);
    text-transform: uppercase; letter-spacing: 0.05em; margin: 0;
  }
  .fp-summary-list {
    display: flex; flex-direction: column; gap: 0.875rem;
  }
  .fp-mini-item { display: flex; flex-direction: column; gap: 0.4rem; }
  .fp-mini-top { display: flex; justify-content: space-between; align-items: center; }
  .fp-mini-name { font-size: 0.9rem; font-weight: 600; color: var(--text-foreground); }
  .fp-mini-val { font-size: 0.8rem; font-weight: 700; }
  .fp-mini-track {
    width: 100%; height: 6px;
    background: var(--bg-glass);
    border-radius: 100px; overflow: hidden;
  }
  .fp-mini-fill { height: 100%; border-radius: 100px; transition: width 0.4s ease; }

  /* ── TEMPLATES ── */
  .right-col { display: flex; flex-direction: column; gap: 1.5rem; }

  .template-list { display: flex; flex-direction: column; gap: 0.625rem; }
  .tpl-btn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.75rem 0.875rem;
    background: var(--bg-base);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    cursor: pointer; text-align: left;
    transition: all 0.15s;
  }
  .tpl-btn:hover {
    border-color: var(--color-primary);
    background: rgba(99,102,241,0.05);
    transform: translateX(3px);
  }
  .tpl-meta { display: flex; flex-direction: column; min-width: 0; padding-right: 0.5rem; }
  .tpl-label { font-size: 0.8rem; font-weight: 700; color: var(--text-foreground); }
  .tpl-desc { font-size: 0.7rem; color: var(--color-muted); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tpl-badge { text-align: right; display: flex; flex-direction: column; flex-shrink: 0; }
  .tpl-amt { font-size: 0.8rem; font-weight: 700; color: var(--text-foreground); }
  .tpl-cat { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

  /* ── RECENT LIST ── */
  .recent-list { display: flex; flex-direction: column; gap: 0; }
  .recent-item {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color);
  }
  .recent-item:last-child { border-bottom: none; padding-bottom: 0; }
  .recent-icon-wrap {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .recent-meta { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .recent-desc { font-size: 0.8rem; font-weight: 600; color: var(--text-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .recent-sub { display: flex; align-items: center; gap: 0.375rem; margin-top: 3px; }
  .recent-cat {
    font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
    padding: 0.1rem 0.4rem; border-radius: 100px;
  }
  .recent-date { font-size: 0.7rem; color: var(--color-muted); }
  .recent-amount { font-size: 0.8rem; font-weight: 800; flex-shrink: 0; }

  /* ── EMPTY ── */
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 3rem 1rem; text-align: center;
  }
  .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .empty-text { font-size: 0.875rem; color: var(--color-muted); }
  .btn-sm { padding: 0.5rem 1.25rem; font-size: 0.8rem; border-radius: 8px; margin-top: 0.75rem; }
</style>
