<script>
  import { auth, ui } from '../lib/store.svelte.js';

  // --- TAB ---
  let activeTab = $state('budget');

  // --- BUDGET ---
  let budgetCat = $state('');
  let budgetAmount = $state('');
  const expenseCats = $derived(auth.categories.filter(c => c.type === 'expense'));

  const currentMonthExpenses = $derived.by(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const expenses = {};
    auth.transactions
      .filter(t => t.type === 'expense' || !t.type)
      .forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() === month && d.getFullYear() === year) {
          expenses[t.category] = (expenses[t.category] || 0) + Number(t.amount);
        }
      });
    return expenses;
  });

  async function handleSaveBudget(e) {
    if (e) e.preventDefault();
    if (!budgetCat) { ui.addNotification('Pilih kategori terlebih dahulu', 'error'); return; }
    const amountNum = Number(budgetAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amountNum) || amountNum < 0) { ui.addNotification('Nominal tidak valid', 'error'); return; }
    try {
      await auth.saveBudget(budgetCat, amountNum);
      ui.addNotification('Anggaran berhasil disimpan', 'success');
      budgetCat = ''; budgetAmount = '';
    } catch (err) { ui.addNotification(err.message, 'error'); }
  }

  // --- SAVING GOALS ---
  let goalName = $state('');
  let goalTarget = $state('');
  let goalCurrent = $state('');
  let selectedGoal = $state(null);
  let progressAmount = $state('');

  async function handleAddSavingGoal(e) {
    if (e) e.preventDefault();
    if (!goalName.trim()) return;
    const targetNum = Number(goalTarget.replace(/[^0-9]/g, ''));
    const currentNum = Number(goalCurrent.replace(/[^0-9]/g, '')) || 0;
    if (targetNum <= 0) { ui.addNotification('Target tidak valid', 'error'); return; }
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    try {
      await auth.addSavingGoal(goalName, targetNum, currentNum, color);
      ui.addNotification('Target tabungan ditambahkan!', 'success');
      goalName = ''; goalTarget = ''; goalCurrent = '';
    } catch (err) { ui.addNotification(err.message, 'error'); }
  }

  async function handleAddProgress(e) {
    if (e) e.preventDefault();
    if (!selectedGoal) return;
    const amountNum = Number(progressAmount.replace(/[^0-9]/g, ''));
    if (amountNum <= 0) return;
    try {
      await auth.updateSavingGoalProgress(selectedGoal.id, amountNum);
      ui.addNotification('Tabungan berhasil ditambahkan!', 'success');
      selectedGoal = null; progressAmount = '';
    } catch (err) { ui.addNotification(err.message, 'error'); }
  }

  function handleDeleteGoal(id, name) {
    ui.askConfirmation({
      title: 'Hapus Tabungan',
      message: `Yakin ingin menghapus target tabungan "${name}"?`,
      confirmText: 'Hapus', type: 'danger',
      onConfirm: async () => {
        try { await auth.deleteSavingGoal(id); ui.addNotification('Tabungan dihapus', 'success'); }
        catch (err) { ui.addNotification(err.message, 'error'); }
      }
    });
  }

  // --- HELPERS ---
  function formatRupiah(v) {
    if (!v && v !== 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(v) || 0);
  }

  function getProgressColor(pct) {
    if (pct < 50) return '#10b981';
    if (pct < 80) return '#f59e0b';
    return '#ef4444';
  }
</script>

<!-- ──────────────── PAGE ──────────────── -->
<div class="fp-page animate-fade-in pb-12">

  <!-- Header -->
  <div class="page-header">
    <h1 class="page-title">
      <span class="page-header-icon text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
      </span>
      Rencana Keuangan
    </h1>
    <p class="page-subtitle">Atur batasan pengeluaran dan pantau impian finansial Anda.</p>
  </div>

  <!-- Tabs -->
  <div class="fp-tabs">
    <button
      class="fp-tab-btn {activeTab === 'budget' ? 'fp-tab-active' : ''}"
      onclick={() => activeTab = 'budget'}
    >
      <span class="fp-tab-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
      </span>
      Anggaran Bulanan
    </button>
    <button
      class="fp-tab-btn {activeTab === 'saving' ? 'fp-tab-active' : ''}"
      onclick={() => activeTab = 'saving'}
    >
      <span class="fp-tab-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
      </span>
      Tujuan Tabungan
    </button>
  </div>

  <!-- ─── TAB: BUDGET ─── -->
  {#if activeTab === 'budget'}
    <div class="fp-layout">

      <!-- Form -->
      <div class="glass-card fp-form-card">
        <div class="fp-card-header">
          <h3 class="fp-card-title">Atur Anggaran</h3>
          <p class="fp-card-subtitle">Batas maksimal pengeluaran per kategori setiap bulan.</p>
        </div>

        <form onsubmit={handleSaveBudget} class="fp-form">
          <div class="fp-field">
            <label class="fp-label" for="b-cat">Pilih Kategori</label>
            <select id="b-cat" bind:value={budgetCat} required class="fp-select">
              <option value="" disabled selected>-- Pilih Kategori --</option>
              {#each expenseCats as cat}
                <option value={cat.name}>{cat.name}</option>
              {/each}
            </select>
          </div>

          <div class="fp-field">
            <label class="fp-label" for="b-amt">Batas Maksimal (Rp)</label>
            <div class="fp-input-wrap">
              <span class="fp-input-prefix">Rp</span>
              <input
                type="number" id="b-amt" min="0"
                bind:value={budgetAmount}
                placeholder="0"
                required class="fp-input fp-input-right"
              />
            </div>
          </div>

          <button type="submit" class="btn btn-primary fp-submit-btn">Simpan Anggaran</button>
        </form>
      </div>

      <!-- List -->
      <div class="glass-card fp-list-card">
        <div class="fp-card-header">
          <h3 class="fp-card-title">Pantauan Bulan Ini</h3>
          <p class="fp-card-subtitle">Progress pengeluaran vs anggaran yang telah Anda tetapkan.</p>
        </div>

        {#if auth.budgets.length === 0}
          <div class="fp-empty">
            <span class="fp-empty-icon">📋</span>
            <p>Belum ada anggaran yang diatur.</p>
            <p class="fp-empty-sub">Gunakan form di sebelah kiri untuk memulai.</p>
          </div>
        {:else}
          <div class="fp-budget-list">
            {#each auth.budgets as budget}
              {@const spent = currentMonthExpenses[budget.category] || 0}
              {@const limit = Number(budget.amount)}
              {@const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0}
              {@const isOver = spent > limit}

              <div class="fp-budget-item" style="border-left: 4px solid {getProgressColor(pct)};">
                <div class="fp-budget-top">
                  <div>
                    <h4 class="fp-budget-cat">{budget.category}</h4>
                    <p class="fp-budget-spent">Terpakai: <strong>{formatRupiah(spent)}</strong></p>
                  </div>
                  <div class="fp-budget-limit-box">
                    <span class="fp-budget-limit-lbl">Anggaran</span>
                    <strong class="fp-budget-limit-val" style="color: {isOver ? '#ef4444' : 'var(--color-primary)'};">{formatRupiah(limit)}</strong>
                  </div>
                </div>

                <div class="fp-progress-track">
                  <div class="fp-progress-fill" style="width: {pct}%; background-color: {getProgressColor(pct)};"></div>
                </div>

                <div class="fp-budget-foot">
                  <span style="color: {isOver ? '#ef4444' : 'var(--color-muted)'}; font-weight: 600; font-size: 0.75rem;">
                    {isOver ? '⚠ Melebihi Anggaran!' : `${Math.round(pct)}% Terpakai`}
                  </span>
                  <span class="fp-budget-sisa">
                    Sisa: {isOver ? 'Habis' : formatRupiah(limit - spent)}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    </div>

  <!-- ─── TAB: SAVING ─── -->
  {:else if activeTab === 'saving'}
    <div class="fp-layout">

      <!-- Form -->
      <div class="glass-card fp-form-card">
        <div class="fp-card-header">
          <h3 class="fp-card-title">Tambah Impian</h3>
          <p class="fp-card-subtitle">Buat target tabungan untuk diwujudkan satu per satu.</p>
        </div>

        <form onsubmit={handleAddSavingGoal} class="fp-form">
          <div class="fp-field">
            <label class="fp-label" for="s-name">Nama Target</label>
            <input type="text" id="s-name" bind:value={goalName} placeholder="Contoh: Beli Laptop, Liburan" required class="fp-input" />
          </div>

          <div class="fp-field">
            <label class="fp-label" for="s-target">Nominal Target (Rp)</label>
            <div class="fp-input-wrap">
              <span class="fp-input-prefix">Rp</span>
              <input type="number" id="s-target" min="1" bind:value={goalTarget} placeholder="0" required class="fp-input fp-input-right" />
            </div>
          </div>

          <div class="fp-field">
            <label class="fp-label" for="s-current">Sudah Terkumpul (Opsional)</label>
            <div class="fp-input-wrap">
              <span class="fp-input-prefix">Rp</span>
              <input type="number" id="s-current" min="0" bind:value={goalCurrent} placeholder="0" class="fp-input fp-input-right" />
            </div>
          </div>

          <button type="submit" class="btn btn-primary fp-submit-btn">Buat Target</button>
        </form>
      </div>

      <!-- List Goals -->
      <div class="glass-card fp-list-card">
        <div class="fp-card-header">
          <h3 class="fp-card-title">Impian Anda</h3>
          <p class="fp-card-subtitle">Pantau progres setiap target tabungan.</p>
        </div>

        {#if auth.savingGoals.length === 0}
          <div class="fp-empty">
            <span class="fp-empty-icon">🎯</span>
            <p>Belum ada target tabungan.</p>
            <p class="fp-empty-sub">Buat target pertama Anda di form sebelah kiri.</p>
          </div>
        {:else}
          <div class="fp-goals-grid">
            {#each auth.savingGoals as goal}
              {@const pct = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100)}
              {@const isDone = pct >= 100}

              <div class="fp-goal-card">
                <!-- Header goal -->
                <div class="fp-goal-header">
                  <div class="fp-goal-icon" style="background-color: {goal.color}20; color: {goal.color};">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  </div>
                  <div class="fp-goal-meta">
                    <h4 class="fp-goal-name">{goal.name}</h4>
                    <span class="fp-goal-pct" style="color: {goal.color};">{Math.round(pct)}% terkumpul</span>
                  </div>
                  <button
                    type="button"
                    class="fp-goal-delete"
                    title="Hapus target {goal.name}"
                    onclick={() => handleDeleteGoal(goal.id, goal.name)}
                    aria-label="Hapus"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-1.5 12a1.5 1.5 0 01-1.5 1.5H7.5A1.5 1.5 0 016 20.25l-1.5-12m16.5 0h-18m16.5 0a2.25 2.25 0 00-2.25-2.25H16.5m-9-2.25h9M9 5.25V3a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v2.25" /></svg>
                  </button>
                </div>

                <!-- Progress bar -->
                <div class="fp-goal-amounts">
                  <span class="fp-goal-amt">{formatRupiah(goal.current_amount)}</span>
                  <span class="fp-goal-amt-lbl">dari {formatRupiah(goal.target_amount)}</span>
                </div>
                <div class="fp-progress-track">
                  <div class="fp-progress-fill" style="width: {pct}%; background-color: {goal.color};"></div>
                </div>

                <!-- CTA -->
                {#if !isDone}
                  <button
                    type="button"
                    class="fp-goal-add-btn"
                    style="color: {goal.color}; border-color: {goal.color}40; background: {goal.color}10;"
                    onclick={() => { selectedGoal = goal; progressAmount = ''; }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Tambah Saldo
                  </button>
                {:else}
                  <div class="fp-goal-done">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Target Tercapai!
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>

    </div>
  {/if}

</div>

<!-- ─── MODAL TAMBAH SALDO ─── -->
{#if selectedGoal}
  <div class="fp-modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) selectedGoal = null; }}>
    <div class="fp-modal">
      <button class="fp-modal-close" onclick={() => selectedGoal = null} aria-label="Tutup">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div class="fp-modal-icon" style="background-color: {selectedGoal.color};">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
      </div>
      <h3 class="fp-modal-title">Menabung untuk {selectedGoal.name}</h3>
      <p class="fp-modal-sub">Sisa target: {formatRupiah(Number(selectedGoal.target_amount) - Number(selectedGoal.current_amount))}</p>

      <form onsubmit={handleAddProgress} class="fp-modal-form">
        <div class="fp-field">
          <label class="fp-label" for="p-amt">Nominal yang ditabung</label>
          <div class="fp-input-wrap">
            <span class="fp-input-prefix" style="font-size:1.1rem; color: {selectedGoal.color};">Rp</span>
            <input
              type="number" id="p-amt" min="1"
              bind:value={progressAmount}
              placeholder="0"
              required
              class="fp-input fp-input-right fp-modal-input"
              style="color: {selectedGoal.color}; font-size: 1.5rem; font-weight: 800;"
            />
          </div>
        </div>
        <button type="submit" class="fp-modal-submit" style="background-color: {selectedGoal.color};">
          Simpan Tabungan
        </button>
      </form>
    </div>
  </div>
{/if}

<style>
  /* ─── PAGE ─── */
  .fp-page { width: 100%; }

  /* ─── SEGMENTED TAB CONTROL ─── */
  .fp-tabs {
    display: inline-flex;
    align-items: center;
    background: var(--bg-glass);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    padding: 0.3rem;
    gap: 0.25rem;
    margin-top: 0.25rem;
    width: 100%;
    max-width: 480px;
  }

  .fp-tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: transparent;
    border: none;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-muted);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .fp-tab-btn:hover:not(.fp-tab-active) {
    color: var(--text-foreground);
    background: rgba(255,255,255,0.04);
  }

  .fp-tab-active {
    background: var(--color-primary) !important;
    color: white !important;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
  }

  .fp-tab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .fp-tab-icon svg { width: 16px; height: 16px; }

  /* ─── LAYOUT 2-COL ─── */
  .fp-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    align-items: start;
    margin-top: 1.5rem;
  }
  @media (min-width: 1024px) {
    .fp-layout { grid-template-columns: 1fr 1.6fr; }
  }

  /* ─── CARDS ─── */
  .fp-form-card, .fp-list-card { padding: 1.5rem; }
  @media (min-width: 640px) {
    .fp-form-card, .fp-list-card { padding: 2rem; }
  }

  .fp-card-header { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
  .fp-card-title { font-size: 1.05rem; font-weight: 700; color: var(--text-foreground); margin: 0; }
  .fp-card-subtitle { font-size: 0.8rem; color: var(--color-muted); margin: 0.25rem 0 0; }

  /* ─── FORM ─── */
  .fp-form { display: flex; flex-direction: column; gap: 1.25rem; }

  .fp-field { display: flex; flex-direction: column; gap: 0.4rem; }

  .fp-label {
    font-size: 0.8125rem; font-weight: 600;
    color: var(--text-foreground);
  }

  .fp-input, .fp-select {
    width: 100%;
    padding: 0.625rem 0.875rem;
    background: var(--bg-base);
    border: 1px solid var(--border-color);
    border-radius: 0.625rem;
    color: var(--text-foreground);
    font-size: 0.9375rem;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .fp-input:focus, .fp-select:focus {
    outline: none;
    border-color: var(--color-primary);
  }
  .fp-input-right { text-align: right; }

  .fp-input-wrap { position: relative; display: flex; align-items: center; }
  .fp-input-prefix {
    position: absolute; left: 0.875rem;
    font-weight: 700; color: var(--color-muted);
    pointer-events: none; z-index: 1;
  }
  .fp-input-wrap .fp-input { padding-left: 2.5rem; }

  .fp-submit-btn { padding: 0.75rem 1.5rem; width: 100%; margin-top: 0.25rem; }

  /* ─── BUDGET LIST ─── */
  .fp-budget-list { display: flex; flex-direction: column; gap: 1rem; }

  .fp-budget-item {
    background: var(--bg-base);
    border: 1px solid var(--border-color);
    border-radius: 0.875rem;
    padding: 1rem 1.25rem;
    transition: box-shadow 0.2s;
  }
  .fp-budget-item:hover { box-shadow: var(--shadow-md); }

  .fp-budget-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.875rem; }
  .fp-budget-cat { font-size: 1rem; font-weight: 700; color: var(--text-foreground); margin: 0; }
  .fp-budget-spent { font-size: 0.8rem; color: var(--color-muted); margin: 0.25rem 0 0; }
  .fp-budget-limit-box { text-align: right; flex-shrink: 0; }
  .fp-budget-limit-lbl { display: block; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-muted); margin-bottom: 0.2rem; }
  .fp-budget-limit-val { font-size: 0.9rem; font-weight: 800; }

  .fp-progress-track { height: 10px; background: var(--bg-glass); border-radius: 100px; overflow: hidden; }
  .fp-progress-fill { height: 100%; border-radius: 100px; transition: width 0.8s ease; }

  .fp-budget-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; }
  .fp-budget-sisa { font-size: 0.75rem; font-weight: 600; color: var(--color-muted); }

  /* ─── GOALS GRID ─── */
  .fp-goals-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  @media (min-width: 640px) { .fp-goals-grid { grid-template-columns: 1fr 1fr; } }

  .fp-goal-card {
    background: var(--bg-base);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    padding: 1.25rem;
    display: flex; flex-direction: column; gap: 0.75rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .fp-goal-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-md); }

  .fp-goal-header { display: flex; align-items: center; gap: 0.75rem; }
  .fp-goal-icon {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .fp-goal-icon svg { width: 20px; height: 20px; }
  .fp-goal-meta { flex: 1; min-width: 0; }
  .fp-goal-name { font-size: 0.9375rem; font-weight: 700; color: var(--text-foreground); margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .fp-goal-pct { font-size: 0.75rem; font-weight: 700; }

  .fp-goal-delete {
    background: none; border: none; cursor: pointer;
    color: var(--color-muted);
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0;
  }
  .fp-goal-delete:hover { background: rgba(239,68,68,0.1); color: #ef4444; }
  .fp-goal-delete svg { width: 16px; height: 16px; }

  .fp-goal-amounts { display: flex; justify-content: space-between; align-items: baseline; }
  .fp-goal-amt { font-size: 0.875rem; font-weight: 800; color: var(--text-foreground); }
  .fp-goal-amt-lbl { font-size: 0.7rem; color: var(--color-muted); }

  .fp-goal-add-btn {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    width: 100%; padding: 0.625rem 1rem;
    background: none; border: 1px solid; border-radius: 0.625rem;
    font-size: 0.875rem; font-weight: 700; cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
  }
  .fp-goal-add-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .fp-goal-add-btn svg { width: 16px; height: 16px; }

  .fp-goal-done {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    background: rgba(16,185,129,0.1);
    color: #10b981;
    font-size: 0.875rem; font-weight: 700;
    padding: 0.625rem 1rem; border-radius: 0.625rem;
  }
  .fp-goal-done svg { width: 18px; height: 18px; }

  /* ─── EMPTY ─── */
  .fp-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 3rem 1rem; text-align: center;
    color: var(--color-muted); font-size: 0.875rem;
  }
  .fp-empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .fp-empty-sub { font-size: 0.75rem; margin-top: 0.25rem; opacity: 0.7; }

  /* ─── MODAL ─── */
  .fp-modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 100;
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
  }

  .fp-modal {
    background: var(--bg-base);
    border: 1px solid var(--border-color);
    border-radius: 1.5rem;
    padding: 2rem;
    width: 100%; max-width: 400px;
    position: relative;
    box-shadow: 0 25px 60px rgba(0,0,0,0.4);
    display: flex; flex-direction: column; gap: 0.5rem;
  }

  .fp-modal-close {
    position: absolute; top: 1rem; right: 1rem;
    background: var(--bg-glass); border: 1px solid var(--border-color);
    border-radius: 8px; width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--color-muted); transition: all 0.15s;
  }
  .fp-modal-close:hover { color: var(--text-foreground); background: var(--bg-base); }
  .fp-modal-close svg { width: 16px; height: 16px; }

  .fp-modal-icon {
    width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 0.75rem;
    display: flex; align-items: center; justify-content: center;
    color: white;
  }
  .fp-modal-icon svg { width: 28px; height: 28px; }

  .fp-modal-title { font-size: 1.125rem; font-weight: 800; color: var(--text-foreground); text-align: center; margin: 0; }
  .fp-modal-sub { font-size: 0.8rem; color: var(--color-muted); text-align: center; margin: 0 0 0.75rem; }

  .fp-modal-form { display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem; }
  .fp-modal-input { height: 3.25rem; }

  .fp-modal-submit {
    width: 100%; padding: 0.875rem;
    border: none; border-radius: 0.875rem;
    color: white; font-size: 1rem; font-weight: 800;
    cursor: pointer; transition: opacity 0.15s, transform 0.15s;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
  }
  .fp-modal-submit:hover { opacity: 0.9; transform: translateY(-2px); }
</style>
