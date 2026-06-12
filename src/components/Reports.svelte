<script>
  import { auth } from '../lib/store.svelte.js';

  let reportPeriod = $state(6); // 3, 6, or 12 months

  function formatRupiah(v) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
  }

  function formatRupiahShort(v) {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}jt`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
    return v.toString();
  }

  function formatMonthShort(mStr) {
    const [year, month] = mStr.split('-');
    return new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(new Date(year, month - 1));
  }

  // Generate last N months (from oldest to newest)
  const monthsList = $derived.by(() => {
    const months = [];
    const now = new Date();
    for (let i = reportPeriod - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, date: d });
    }
    return months;
  });

  // Monthly spending data
  const monthlyData = $derived.by(() => {
    return monthsList.map(m => {
      const total = auth.transactions
        .filter(t => t.date?.startsWith(m.key))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { key: m.key, label: formatMonthShort(m.key), total };
    });
  });

  const maxMonthly = $derived(Math.max(...monthlyData.map(m => m.total), 1));

  // Period range for filtering
  const periodStart = $derived(monthsList[0]?.key || '');

  // All transactions in selected period
  const periodTxs = $derived(
    auth.transactions.filter(t => t.date >= periodStart && t.date)
  );

  const totalPeriod = $derived(
    periodTxs.filter(t => t.type !== 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  );

  const totalIncomePeriod = $derived(
    periodTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  );

  const netPeriod = $derived(totalIncomePeriod - totalPeriod);

  // Category breakdown
  const categoryBreakdown = $derived.by(() => {
    const catMap = {};
    periodTxs.forEach(t => {
      const cat = t.category || 'Lainnya';
      catMap[cat] = (catMap[cat] || 0) + Number(t.amount);
    });
    const total = Object.values(catMap).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(catMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: Math.round((amount / total) * 100),
        color: getCategoryColor(name)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 7);
  });

  // Day of week analysis
  const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayOfWeekData = $derived.by(() => {
    const dayMap = Array(7).fill(0);
    periodTxs.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      dayMap[d.getDay()] += Number(t.amount);
    });
    const max = Math.max(...dayMap, 1);
    return DAY_NAMES.map((name, i) => ({
      name,
      total: dayMap[i],
      percent: Math.round((dayMap[i] / max) * 100),
      shortName: name.substring(0, 3)
    }));
  });

  const busiestDay = $derived(
    dayOfWeekData.reduce((max, d) => d.total > max.total ? d : max, dayOfWeekData[0])
  );

  // Top 5 biggest transactions
  const topTransactions = $derived(
    [...periodTxs]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5)
  );

  // Summary stats
  const avgPerDay = $derived(totalPeriod > 0 ? totalPeriod / (reportPeriod * 30) : 0);
  const avgPerMonth = $derived(totalPeriod > 0 ? totalPeriod / reportPeriod : 0);
  const avgIncomePerMonth = $derived(totalIncomePeriod > 0 ? totalIncomePeriod / reportPeriod : 0);

  function getCategoryColor(name) {
    const cat = auth.categories.find(c => c.name === name);
    return cat?.color || '#64748b';
  }

  // Chart constants
  const CHART_HEIGHT = 160;
  const CHART_PAD_BOTTOM = 28; // space for month labels

  function barHeight(total) {
    return Math.max((total / maxMonthly) * CHART_HEIGHT, total > 0 ? 4 : 0);
  }

  function formatDateShort(d) {
    if (!d) return '';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(d));
  }
</script>

<div class="reports-page animate-fade-in pb-12">

  <!-- Header -->
  <div class="page-header">
    <h1 class="page-title">
      <span class="page-header-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </span>
      Laporan & Analitik
    </h1>
    <p class="page-subtitle">Pantau tren pengeluaran dan temukan pola keuangan pribadi Anda.</p>
  </div>

  <!-- Period Selector -->
  <div class="period-selector-row">
    <span class="period-label">Tampilkan data:</span>
    <div class="period-tabs">
      <button class="period-tab {reportPeriod === 3 ? 'active' : ''}" onclick={() => reportPeriod = 3}>3 Bulan</button>
      <button class="period-tab {reportPeriod === 6 ? 'active' : ''}" onclick={() => reportPeriod = 6}>6 Bulan</button>
      <button class="period-tab {reportPeriod === 12 ? 'active' : ''}" onclick={() => reportPeriod = 12}>1 Tahun</button>
    </div>
  </div>

  <!-- Summary Stats Row -->
  <div class="summary-row">
    <div class="sum-card glass-card">
      <div class="sum-icon" style="background:rgba(16,185,129,0.12); color:#10b981;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
      </div>
      <div class="sum-info">
        <span class="sum-label">Pemasukan {reportPeriod} Bulan</span>
        <span class="sum-val" style="color:#10b981;">{formatRupiah(totalIncomePeriod)}</span>
      </div>
    </div>

    <div class="sum-card glass-card">
      <div class="sum-icon sum-total">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      </div>
      <div class="sum-info">
        <span class="sum-label">Pengeluaran {reportPeriod} Bulan</span>
        <span class="sum-val danger">{formatRupiah(totalPeriod)}</span>
      </div>
    </div>

    <div class="sum-card glass-card">
      <div class="sum-icon" style="background: rgba(99,102,241,0.12); color:var(--color-primary);">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" /></svg>
      </div>
      <div class="sum-info">
        <span class="sum-label">Saldo Bersih {reportPeriod} Bulan</span>
        <span class="sum-val" style="color:{netPeriod >= 0 ? 'var(--color-primary)' : '#ef4444'}">{netPeriod >= 0 ? '+' : ''}{formatRupiah(netPeriod)}</span>
      </div>
    </div>

    <div class="sum-card glass-card">
      <div class="sum-icon sum-avg">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </div>
      <div class="sum-info">
        <span class="sum-label">Rata-rata Keluar/Bulan</span>
        <span class="sum-val primary">{formatRupiah(avgPerMonth)}</span>
      </div>
    </div>

    <div class="sum-card glass-card">
      <div class="sum-icon sum-day">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="sum-info">
        <span class="sum-label">Rata-rata per Hari</span>
        <span class="sum-val warning">{formatRupiah(avgPerDay)}</span>
      </div>
    </div>

    <div class="sum-card glass-card">
      <div class="sum-icon sum-count">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      </div>
      <div class="sum-info">
        <span class="sum-label">Jumlah Transaksi</span>
        <span class="sum-val success">{periodTxs.length} Catatan</span>
      </div>
    </div>
  </div>


  {#if periodTxs.length === 0}
    <!-- Empty State -->
    <div class="glass-card empty-reports">
      <div class="er-icon">📊</div>
      <h3>Belum Ada Data</h3>
      <p>Mulai catat pengeluaran Anda untuk melihat laporan dan analitik di sini.</p>
    </div>
  {:else}

    <!-- Monthly Trend Bar Chart -->
    <div class="glass-card chart-card">
      <div class="chart-card-header">
        <div>
          <h3 class="chart-title">Tren Pengeluaran Bulanan</h3>
          <p class="chart-subtitle">Perbandingan total pengeluaran per bulan dalam {reportPeriod} bulan terakhir</p>
        </div>
        <span class="chart-total-badge">{formatRupiah(totalPeriod)}</span>
      </div>

      <div class="bar-chart-wrapper">
        <div class="bar-chart">
          {#each monthlyData as month, i}
            <div class="bar-col">
              <div class="bar-label-top">{month.total > 0 ? formatRupiahShort(month.total) : ''}</div>
              <div class="bar-outer">
                <div
                  class="bar-inner {month.key === monthlyData[monthlyData.length - 1].key ? 'bar-current' : ''}"
                  style="height: {barHeight(month.total)}px; --bar-color: {month.key === monthlyData[monthlyData.length - 1].key ? 'var(--color-primary)' : 'rgba(99,102,241,0.45)'}"
                ></div>
              </div>
              <div class="bar-month-label">{month.label}</div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Category & Top Tx -->
    <div class="bottom-grid">

      <!-- Category Breakdown -->
      <div class="glass-card">
        <h3 class="section-title">Distribusi Kategori</h3>
        <p class="section-sub">Komposisi pengeluaran berdasarkan kategori dalam {reportPeriod} bulan terakhir</p>

        <div class="cat-bars">
          {#each categoryBreakdown as cat}
            <div class="cat-bar-row">
              <div class="cat-bar-meta">
                <span class="cat-dot" style="background: {cat.color}"></span>
                <span class="cat-bar-name">{cat.name}</span>
                <span class="cat-bar-pct">{cat.percent}%</span>
              </div>
              <div class="cat-bar-track">
                <div
                  class="cat-bar-fill"
                  style="width: {cat.percent}%; background: {cat.color}"
                ></div>
              </div>
              <span class="cat-bar-amt">{formatRupiah(cat.amount)}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Top Transactions -->
      <div class="glass-card">
        <h3 class="section-title">Pengeluaran Terbesar</h3>
        <p class="section-sub">5 transaksi dengan nominal paling tinggi dalam periode ini</p>

        <div class="top-tx-list">
          {#each topTransactions as tx, i}
            <div class="top-tx-item">
              <div class="top-tx-rank rank-{i + 1}">{i + 1}</div>
              <div class="top-tx-info">
                <span class="top-tx-desc">{tx.description}</span>
                <div class="top-tx-meta">
                  <span class="top-tx-cat" style="color: {getCategoryColor(tx.category)}">{tx.category}</span>
                  <span class="top-tx-date">• {formatDateShort(tx.date)}</span>
                </div>
              </div>
              <span class="top-tx-amount">{formatRupiah(Number(tx.amount))}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Day of Week Pattern -->
    <div class="glass-card dow-card">
      <div class="chart-card-header">
        <div>
          <h3 class="chart-title">Pola Pengeluaran per Hari</h3>
          <p class="chart-subtitle">
            Hari paling boros:
            <strong style="color: var(--color-primary)">
              {busiestDay?.name || '-'}
            </strong>
            ({formatRupiah(busiestDay?.total || 0)})
          </p>
        </div>
      </div>

      <div class="dow-bars">
        {#each dayOfWeekData as day}
          <div class="dow-col">
            <div class="dow-amt">{day.total > 0 ? formatRupiahShort(day.total) : ''}</div>
            <div class="dow-bar-outer">
              <div
                class="dow-bar-inner {day.name === busiestDay?.name ? 'dow-peak' : ''}"
                style="height: {Math.max(day.percent, day.total > 0 ? 6 : 0)}%"
              ></div>
            </div>
            <div class="dow-label">{day.shortName}</div>
          </div>
        {/each}
      </div>
    </div>

  {/if}
</div>

<style>
  .reports-page {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Period selector */
  .period-selector-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .period-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .period-tabs {
    display: flex;
    background: rgba(0,0,0,0.15);
    border-radius: 12px;
    padding: 0.2rem;
    gap: 0.1rem;
  }

  :root.light-theme .period-tabs { background: rgba(0,0,0,0.06); }

  .period-tab {
    padding: 0.45rem 1.25rem;
    border-radius: 9px;
    border: none;
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-muted);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
  }

  .period-tab:hover { color: var(--text-primary); }

  .period-tab.active {
    background: var(--color-primary);
    color: #fff;
    box-shadow: 0 2px 10px rgba(99,102,241,0.3);
  }

  /* Summary Row */
  .summary-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  @media (min-width: 768px) {
    .summary-row { grid-template-columns: repeat(4, 1fr); }
  }

  .sum-card {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 1.125rem;
  }

  .sum-icon {
    width: 40px;
    height: 40px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .sum-icon svg { width: 20px; height: 20px; }

  .sum-total   { background: rgba(244,63,94,0.12); color: #f43f5e; }
  .sum-avg     { background: rgba(99,102,241,0.12); color: #6366f1; }
  .sum-day     { background: rgba(245,158,11,0.12); color: #f59e0b; }
  .sum-count   { background: rgba(16,185,129,0.12); color: #10b981; }

  .sum-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .sum-label {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .sum-val {
    font-family: var(--font-title);
    font-size: 0.9375rem;
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 0.1rem;
  }

  .sum-val.danger  { color: var(--color-danger); }
  .sum-val.primary { color: var(--color-primary); }
  .sum-val.warning { color: var(--color-warning); }
  .sum-val.success { color: var(--color-success); }

  /* Bar Chart */
  .chart-card { padding: 1.5rem; }

  @media (min-width: 640px) { .chart-card { padding: 2rem; } }

  .chart-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .chart-title {
    font-size: 1.0625rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .chart-subtitle {
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  .chart-total-badge {
    font-family: var(--font-title);
    font-size: 0.875rem;
    font-weight: 800;
    color: var(--color-danger);
    background: var(--color-danger-bg);
    border: 1px solid var(--color-danger-border);
    padding: 0.35rem 0.875rem;
    border-radius: 99px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .bar-chart-wrapper {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    min-width: max-content;
    padding: 0 0.25rem;
  }

  .bar-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    min-width: 42px;
    flex: 1;
  }

  .bar-label-top {
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
    min-height: 1em;
    white-space: nowrap;
  }

  .bar-outer {
    width: 100%;
    height: 160px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    position: relative;
  }

  .bar-inner {
    width: 80%;
    max-width: 36px;
    border-radius: 6px 6px 3px 3px;
    background: var(--bar-color, rgba(99,102,241,0.45));
    transition: height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    min-height: 0;
    position: relative;
    overflow: hidden;
  }

  .bar-inner::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 35%;
    background: rgba(255,255,255,0.12);
    border-radius: 6px 6px 0 0;
  }

  .bar-inner.bar-current {
    box-shadow: 0 4px 16px rgba(99,102,241,0.35);
  }

  .bar-month-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-top: 0.5rem;
    text-align: center;
    white-space: nowrap;
  }

  /* Bottom Grid */
  .bottom-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 900px) {
    .bottom-grid { grid-template-columns: 1.1fr 1fr; }
  }

  .section-title {
    font-size: 1.0625rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .section-sub {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin-bottom: 1.5rem;
  }

  /* Category Bars */
  .cat-bars {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .cat-bar-row {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .cat-bar-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cat-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .cat-bar-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-primary);
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cat-bar-pct {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .cat-bar-track {
    height: 6px;
    background: rgba(255,255,255,0.05);
    border-radius: 99px;
    overflow: hidden;
  }

  :root.light-theme .cat-bar-track { background: rgba(0,0,0,0.06); }

  .cat-bar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    opacity: 0.85;
  }

  .cat-bar-amt {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    text-align: right;
  }

  /* Top Transactions */
  .top-tx-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .top-tx-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0;
    border-bottom: 1px solid var(--border-color);
  }

  .top-tx-item:last-child { border-bottom: none; padding-bottom: 0; }

  .top-tx-rank {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 900;
    flex-shrink: 0;
    font-family: var(--font-title);
  }

  .rank-1 { background: rgba(245,158,11,0.15); color: #f59e0b; }
  .rank-2 { background: rgba(99,102,241,0.12); color: #6366f1; }
  .rank-3 { background: rgba(16,185,129,0.12); color: #10b981; }
  .rank-4, .rank-5 { background: rgba(255,255,255,0.05); color: var(--text-muted); }

  :root.light-theme .rank-4, :root.light-theme .rank-5 { background: rgba(0,0,0,0.04); }

  .top-tx-info {
    flex-grow: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .top-tx-desc {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .top-tx-meta {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.1rem;
  }

  .top-tx-cat {
    font-size: 0.6875rem;
    font-weight: 700;
  }

  .top-tx-date {
    font-size: 0.6875rem;
    color: var(--text-muted);
  }

  .top-tx-amount {
    font-family: var(--font-title);
    font-size: 0.875rem;
    font-weight: 800;
    color: var(--color-danger);
    flex-shrink: 0;
    white-space: nowrap;
  }

  /* Day of Week Chart */
  .dow-card { padding: 1.5rem; }

  @media (min-width: 640px) { .dow-card { padding: 2rem; } }

  .dow-bars {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    height: 130px;
    margin-top: 1.5rem;
  }

  .dow-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
    gap: 0;
  }

  .dow-amt {
    font-size: 0.5625rem;
    font-weight: 700;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
    min-height: 0.875rem;
    white-space: nowrap;
    text-align: center;
  }

  .dow-bar-outer {
    width: 100%;
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    min-height: 4px;
  }

  .dow-bar-inner {
    width: 65%;
    max-width: 28px;
    border-radius: 5px 5px 3px 3px;
    background: rgba(99,102,241,0.35);
    transition: height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    min-height: 0;
  }

  .dow-bar-inner.dow-peak {
    background: var(--color-primary);
    box-shadow: 0 4px 12px rgba(99,102,241,0.4);
  }

  .dow-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-top: 0.5rem;
    text-align: center;
  }

  /* Empty State */
  .empty-reports {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    text-align: center;
    gap: 0.5rem;
  }

  .er-icon { font-size: 3.5rem; margin-bottom: 0.5rem; opacity: 0.45; }

  .empty-reports h3 { font-size: 1.25rem; color: var(--text-primary); }
  .empty-reports p  { font-size: 0.875rem; color: var(--text-muted); max-width: 280px; }
</style>
