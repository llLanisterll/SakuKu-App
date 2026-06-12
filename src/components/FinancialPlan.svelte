<script>
  import { auth, ui } from '../lib/store.svelte.js';

  // --- TAB STATES ---
  let activeTab = $state('budget'); // 'budget' or 'saving'

  // --- BUDGET STATES ---
  let budgetCat = $state('');
  let budgetAmount = $state('');
  
  const expenseCats = $derived(auth.categories.filter(c => c.type === 'expense'));

  // Calculate current month expenses per category
  const currentMonthExpenses = $derived(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const expenses = {};
    
    auth.transactions
      .filter(t => t.type === 'expense')
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
    if (!budgetCat) {
      ui.addNotification('Pilih kategori terlebih dahulu', 'error');
      return;
    }
    const amountNum = Number(budgetAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amountNum) || amountNum < 0) {
      ui.addNotification('Nominal tidak valid', 'error');
      return;
    }

    try {
      await auth.saveBudget(budgetCat, amountNum);
      ui.addNotification('Anggaran berhasil disimpan', 'success');
      budgetCat = '';
      budgetAmount = '';
    } catch (err) {
      ui.addNotification(err.message, 'error');
    }
  }

  function handleBudgetAmountInput(e) {
    let rawValue = e.target.value.replace(/[^0-9]/g, '');
    budgetAmount = rawValue;
  }

  function formatRupiah(v) {
    if (!v) return 'Rp 0';
    const num = Number(v.toString().replace(/[^0-9]/g, ''));
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  }

  function getBudgetProgress(spent, limit) {
    if (!limit || limit === 0) return 0;
    const progress = (spent / limit) * 100;
    return Math.min(progress, 100);
  }

  function getProgressColor(progress) {
    if (progress < 50) return 'var(--color-success)';
    if (progress < 80) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  // --- SAVING GOALS STATES ---
  let goalName = $state('');
  let goalTarget = $state('');
  let goalCurrent = $state('');
  
  // Progress modal
  let selectedGoal = $state(null);
  let progressAmount = $state('');

  async function handleAddSavingGoal(e) {
    if (e) e.preventDefault();
    if (!goalName.trim()) return;
    
    const targetNum = Number(goalTarget.replace(/[^0-9]/g, ''));
    const currentNum = Number(goalCurrent.replace(/[^0-9]/g, '')) || 0;

    if (targetNum <= 0) {
      ui.addNotification('Target tabungan tidak valid', 'error');
      return;
    }

    // Random bright color for goal
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    try {
      await auth.addSavingGoal(goalName, targetNum, currentNum, color);
      ui.addNotification('Tujuan tabungan berhasil ditambahkan', 'success');
      goalName = '';
      goalTarget = '';
      goalCurrent = '';
    } catch (err) {
      ui.addNotification(err.message, 'error');
    }
  }

  async function handleAddProgress(e) {
    if (e) e.preventDefault();
    if (!selectedGoal) return;
    
    const amountNum = Number(progressAmount.replace(/[^0-9]/g, ''));
    if (amountNum <= 0) return;

    try {
      await auth.updateSavingGoalProgress(selectedGoal.id, amountNum);
      ui.addNotification('Tabungan berhasil ditambahkan!', 'success');
      selectedGoal = null;
      progressAmount = '';
    } catch (err) {
      ui.addNotification(err.message, 'error');
    }
  }

  function handleDeleteGoal(id, name) {
    ui.askConfirmation({
      title: 'Hapus Tabungan',
      message: `Yakin ingin menghapus target tabungan "${name}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await auth.deleteSavingGoal(id);
          ui.addNotification('Tabungan dihapus', 'success');
        } catch (err) {
          ui.addNotification(err.message, 'error');
        }
      }
    });
  }

</script>

<div class="financial-plan animate-fade-in pb-12">
  <div class="page-header">
    <h1 class="page-title">
      <span class="page-header-icon text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </span>
      Rencana Keuangan
    </h1>
    <p class="page-subtitle">Atur batasan pengeluaran dan pantau impian finansial Anda.</p>
  </div>

  <div class="data-tabs">
    <button class="tab-btn {activeTab === 'budget' ? 'active' : ''}" onclick={() => activeTab = 'budget'}>
      Anggaran Bulanan
    </button>
    <button class="tab-btn {activeTab === 'saving' ? 'active' : ''}" onclick={() => activeTab = 'saving'}>
      Tujuan Tabungan
    </button>
  </div>

  <div class="tab-content mt-6">
    
    {#if activeTab === 'budget'}
      <div class="budget-layout grid-3">
        <!-- FORM ANGGARAN -->
        <div class="glass-card form-panel-card" style="grid-column: span 1;">
          <div class="panel-header border-b border-glass pb-4 mb-4">
            <h3 class="font-bold text-lg">Atur Anggaran</h3>
            <p class="text-sm text-muted">Batas maksimal per kategori (Isi 0 untuk menghapus).</p>
          </div>

          <form onsubmit={handleSaveBudget} class="budget-form space-y-4">
            <div class="form-group mb-0">
              <label for="b-cat">Pilih Kategori</label>
              <select id="b-cat" bind:value={budgetCat} required class="form-select w-full">
                <option value="" disabled selected>-- Pilih --</option>
                {#each expenseCats as cat}
                  <option value={cat.name}>{cat.name}</option>
                {/each}
              </select>
            </div>
            
            <div class="form-group mb-0">
              <label for="b-amt">Batas Maksimal Bulanan</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold">Rp</span>
                <input type="text" id="b-amt" value={budgetAmount ? formatRupiah(budgetAmount).replace('Rp', '').trim() : ''} oninput={handleBudgetAmountInput} placeholder="0" required class="form-input text-right pl-10 w-full" />
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-full mt-2">Simpan Anggaran</button>
          </form>
        </div>

        <!-- LIST ANGGARAN -->
        <div class="glass-card list-panel-card" style="grid-column: span 2;">
          <div class="panel-header border-b border-glass pb-4 mb-4 flex justify-between items-center">
            <h3 class="font-bold text-lg">Pantauan Anggaran Bulan Ini</h3>
          </div>

          <div class="budgets-list space-y-4">
            {#if auth.budgets.length === 0}
              <div class="empty-state text-center py-8">
                <p class="text-muted">Anda belum mengatur anggaran apapun.</p>
              </div>
            {:else}
              {#each auth.budgets as budget}
                {@const spent = currentMonthExpenses()[budget.category] || 0}
                {@const limit = budget.amount}
                {@const progress = getBudgetProgress(spent, limit)}
                {@const isOver = spent > limit}
                
                <div class="budget-item bg-base rounded-xl p-4 border border-glass relative overflow-hidden group">
                  <div class="flex justify-between items-end mb-2">
                    <div>
                      <h4 class="font-bold text-lg m-0">{budget.category}</h4>
                      <p class="text-sm text-muted m-0 mt-1">
                        Terpakai: <span class="font-semibold text-foreground">{formatRupiah(spent)}</span>
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Anggaran</p>
                      <p class="font-bold m-0 {isOver ? 'text-danger' : 'text-primary'}">
                        {formatRupiah(limit)}
                      </p>
                    </div>
                  </div>
                  
                  <div class="progress-bar-bg h-3 w-full bg-glass rounded-full overflow-hidden relative mt-3">
                    <div class="progress-bar-fill h-full rounded-full transition-all duration-1000 ease-out" 
                         style="width: {progress}%; background-color: {getProgressColor(progress)};"></div>
                  </div>
                  
                  <div class="flex justify-between items-center mt-2 text-xs font-semibold">
                    <span class="{isOver ? 'text-danger' : 'text-muted'}">
                      {isOver ? 'Melebihi Anggaran!' : `${Math.round(progress)}% Terpakai`}
                    </span>
                    <span class="text-muted">
                      Sisa: {isOver ? 'Rp 0' : formatRupiah(limit - spent)}
                    </span>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    
    {:else if activeTab === 'saving'}
      
      <div class="saving-layout grid-3">
        <!-- FORM SAVING -->
        <div class="glass-card form-panel-card" style="grid-column: span 1;">
          <div class="panel-header border-b border-glass pb-4 mb-4">
            <h3 class="font-bold text-lg">Impian Baru</h3>
            <p class="text-sm text-muted">Buat target tabungan untuk diwujudkan.</p>
          </div>

          <form onsubmit={handleAddSavingGoal} class="saving-form space-y-4">
            <div class="form-group mb-0">
              <label for="s-name">Nama Target</label>
              <input type="text" id="s-name" bind:value={goalName} placeholder="Contoh: Beli Laptop, Liburan" required class="form-input w-full" />
            </div>
            
            <div class="form-group mb-0">
              <label for="s-target">Nominal Target</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold">Rp</span>
                <input type="text" id="s-target" value={goalTarget ? formatRupiah(goalTarget).replace('Rp', '').trim() : ''} oninput={(e) => goalTarget = e.target.value.replace(/[^0-9]/g, '')} placeholder="0" required class="form-input text-right pl-10 w-full" />
              </div>
            </div>

            <div class="form-group mb-0">
              <label for="s-current">Sudah Terkumpul (Opsional)</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold">Rp</span>
                <input type="text" id="s-current" value={goalCurrent ? formatRupiah(goalCurrent).replace('Rp', '').trim() : ''} oninput={(e) => goalCurrent = e.target.value.replace(/[^0-9]/g, '')} placeholder="0" class="form-input text-right pl-10 w-full" />
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-full mt-2">Buat Target</button>
          </form>
        </div>

        <!-- LIST SAVING GOALS -->
        <div class="glass-card list-panel-card" style="grid-column: span 2;">
          <div class="panel-header border-b border-glass pb-4 mb-4 flex justify-between items-center">
            <h3 class="font-bold text-lg">Progres Impian Anda</h3>
          </div>

          <div class="goals-grid grid-2">
            {#if auth.savingGoals.length === 0}
              <div class="empty-state md:col-span-2 text-center py-8">
                <p class="text-muted">Anda belum memiliki target tabungan.</p>
              </div>
            {:else}
              {#each auth.savingGoals as goal}
                {@const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100)}
                {@const isComplete = progress >= 100}

                <div class="goal-card bg-base border border-glass rounded-2xl p-5 relative group transition-all hover:border-primary">
                  <!-- Delete button (shows on hover) -->
                  <button type="button" class="absolute top-3 right-3 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity" onclick={() => handleDeleteGoal(goal.id, goal.name)}>
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>

                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style="background-color: {goal.color}">
                      <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 class="font-bold m-0">{goal.name}</h4>
                      <p class="text-xs font-semibold text-muted m-0">{Math.round(progress)}% Terkumpul</p>
                    </div>
                  </div>

                  <div class="mb-4">
                    <div class="flex justify-between text-xs font-semibold text-muted mb-1">
                      <span>{formatRupiah(goal.current_amount)}</span>
                      <span>{formatRupiah(goal.target_amount)}</span>
                    </div>
                    <div class="h-2 w-full bg-glass rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-1000" style="width: {progress}%; background-color: {goal.color}"></div>
                    </div>
                  </div>

                  {#if !isComplete}
                    <button type="button" class="btn btn-sm w-full font-bold flex justify-center gap-2" style="background-color: {goal.color}20; color: {goal.color};" onclick={() => { selectedGoal = goal; progressAmount = ''; }}>
                      <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      Tambah Saldo
                    </button>
                  {:else}
                    <div class="text-center text-sm font-bold text-success flex justify-center items-center gap-1 bg-success-light py-2 rounded-lg">
                      <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Target Tercapai!
                    </div>
                  {/if}

                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
      
    {/if}
  </div>
</div>

<!-- Modal Tambah Saldo -->
{#if selectedGoal}
  <div class="modal-backdrop fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
    <div class="modal-card bg-base w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-scale-in border border-glass relative">
      <button class="absolute top-4 right-4 text-muted hover:text-foreground transition-colors" onclick={() => selectedGoal = null}>
        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div class="text-center mb-6">
        <div class="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white mb-3 shadow-lg" style="background-color: {selectedGoal.color}">
          <svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </div>
        <h3 class="font-bold text-xl m-0">Menabung untuk {selectedGoal.name}</h3>
        <p class="text-sm text-muted mt-1">Sisa target: {formatRupiah(selectedGoal.target_amount - selectedGoal.current_amount)}</p>
      </div>

      <form onsubmit={handleAddProgress}>
        <div class="form-group mb-6">
          <label for="p-amt">Nominal yang ditabung</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold text-xl">Rp</span>
            <input type="text" id="p-amt" value={progressAmount ? formatRupiah(progressAmount).replace('Rp', '').trim() : ''} oninput={(e) => progressAmount = e.target.value.replace(/[^0-9]/g, '')} placeholder="0" required class="form-input text-right text-2xl font-bold pl-12 h-14" style="color: {selectedGoal.color}" />
          </div>
        </div>

        <button type="submit" class="btn w-full h-12 text-white font-bold text-lg shadow-lg" style="background-color: {selectedGoal.color}">Simpan Tabungan</button>
      </form>
    </div>
  </div>
{/if}

<style>
  .budget-item:hover {
    border-color: var(--color-primary);
  }
  .bg-success-light {
    background-color: rgba(16, 185, 129, 0.1);
  }
  .text-success {
    color: #10b981;
  }
  
  @media (max-width: 1024px) {
    .budget-layout > div, .saving-layout > div {
      grid-column: span 3 !important;
    }
  }
  @media (max-width: 768px) {
    .goals-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
