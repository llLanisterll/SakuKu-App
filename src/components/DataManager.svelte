<script>
  import { auth, ui, CATEGORY_COLORS } from '../lib/store.svelte.js';

  let activeTab = $state('expense_cat');

  // --- KATEGORI STATES ---
  let catName = $state('');
  let catColor = $state(CATEGORY_COLORS[0].hex);
  let errorMessage = $state('');

  // --- METODE PEMBAYARAN STATES ---
  let paymentMethodName = $state('');
  let pmErrorMessage = $state('');

  async function handleAddCategory(e) {
    e.preventDefault();
    errorMessage = '';

    const typeToSave = activeTab === 'expense_cat' ? 'expense' : 'income';

    try {
      await auth.addCategory(catName.trim(), typeToSave, catColor);
      ui.addNotification(`Kategori ${typeToSave === 'expense' ? 'pengeluaran' : 'pemasukan'} baru ditambahkan!`, 'success');
      catName = '';
    } catch (err) {
      errorMessage = err.message;
      ui.addNotification(err.message, 'error');
    }
  }

  function handleDeleteCategory(id, name) {
    ui.askConfirmation({
      title: 'Hapus Kategori',
      message: `Apakah Anda yakin ingin menghapus kategori "${name}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await auth.deleteCategory(id);
          ui.addNotification('Kategori dihapus', 'success');
        } catch(err) {
          ui.addNotification(err.message, 'error');
        }
      }
    });
  }

  // --- PAYMENT METHOD FUNCTIONS ---
  async function handleAddPaymentMethod(e) {
    e.preventDefault();
    pmErrorMessage = '';

    try {
      await auth.addPaymentMethod(paymentMethodName);
      ui.addNotification(`Metode "${paymentMethodName}" berhasil ditambahkan!`, 'success');
      paymentMethodName = '';
    } catch (err) {
      pmErrorMessage = err.message;
      ui.addNotification(err.message, 'error');
    }
  }

  function handleDeletePaymentMethod(id, name) {
    ui.askConfirmation({
      title: 'Hapus Metode Pembayaran',
      message: `Apakah Anda yakin ingin menghapus metode "${name}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await auth.deletePaymentMethod(id);
          ui.addNotification('Metode pembayaran dihapus', 'success');
        } catch(err) {
          ui.addNotification(err.message, 'error');
        }
      }
    });
  }

  // --- TEMPLATE STATES ---
  let tplLabel = $state('');
  let tplDesc = $state('');
  let tplCategory = $state('');
  let tplAmount = $state('');
  let tplPayment = $state('Tunai');
  let editingTplId = $state(null);

  const expenseCats = $derived(auth.categories.filter(c => c.type === 'expense'));

  async function handleSaveTemplate(e) {
    if (e) e.preventDefault();
    
    const tplData = {
      label: tplLabel,
      desc: tplDesc,
      category: tplCategory,
      amount: tplAmount,
      qty: 1,
      payment: tplPayment
    };

    try {
      if (editingTplId) {
        await auth.updateTemplate(editingTplId, tplData);
        ui.addNotification('Template diperbarui', 'success');
      } else {
        await auth.addTemplate(tplData);
        ui.addNotification('Template baru ditambahkan', 'success');
      }
      resetTplForm();
    } catch (err) {
      ui.addNotification(err.message, 'error');
    }
  }

  function editTpl(tpl) {
    editingTplId = tpl.id;
    tplLabel = tpl.label;
    tplDesc = tpl.desc;
    tplCategory = tpl.category;
    tplAmount = tpl.amount;
    tplPayment = tpl.payment;
  }

  function deleteTpl(id, label) {
    ui.askConfirmation({
      title: 'Hapus Template',
      message: `Apakah Anda yakin ingin menghapus template "${label}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        await auth.deleteTemplate(id);
        ui.addNotification('Template dihapus', 'success');
      }
    });
  }

  function resetTplForm() {
    editingTplId = null;
    tplLabel = '';
    tplDesc = '';
    tplCategory = '';
    tplAmount = '';
    tplPayment = 'Tunai';
  }

  function formatRupiah(v) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
  }
</script>

<div class="data-manager-page animate-fade-in pb-12">
  <div class="page-header">
    <h1 class="page-title">
      <span class="page-header-icon text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75z" />
        </svg>
      </span>
      Kelola Data Master
    </h1>
    <p class="page-subtitle">Atur kategori anggaran dan template cepat untuk kemudahan pencatatan.</p>
  </div>

  <!-- Tabs Navigation -->
  <div class="data-tabs">
    <button class="tab-btn {activeTab === 'expense_cat' ? 'active' : ''}" onclick={() => activeTab = 'expense_cat'}>
      Kategori Pengeluaran
    </button>
    <button class="tab-btn {activeTab === 'income_cat' ? 'active' : ''}" onclick={() => activeTab = 'income_cat'}>
      Kategori Pemasukan
    </button>
    <button class="tab-btn {activeTab === 'payment_method' ? 'active' : ''}" onclick={() => activeTab = 'payment_method'}>
      Metode Pembayaran
    </button>
    <button class="tab-btn {activeTab === 'template' ? 'active' : ''}" onclick={() => activeTab = 'template'}>
      Template Cepat
    </button>
  </div>

  <div class="tab-content">
    {#if activeTab === 'expense_cat' || activeTab === 'income_cat'}
      <div class="categories-layout animate-fade-in">
        <!-- KOLOM KIRI: FORM TAMBAH KATEGORI -->
        <div class="glass-card form-panel-card">
          <div class="panel-header">
            <h3>Tambah Kategori Baru</h3>
            <p class="panel-subtitle">Buat kategori anggaran kustom baru.</p>
          </div>

          <form onsubmit={handleAddCategory} class="category-form">
            <!-- Kategori selalu sesuai tab yang aktif (hidden di UI, diatur statis) -->
            <input type="hidden" id="cat-type" value={activeTab === 'expense_cat' ? 'expense' : 'income'} />

            <div class="form-group">
              <label for="cat-name">Nama Kategori</label>
              <input 
                type="text" 
                id="cat-name"
                bind:value={catName} 
                placeholder="Contoh: Pendidikan, Bonus, dll" 
                required 
                maxlength="20"
              />
            </div>

            <div class="form-group">
              <span class="form-label-txt">Warna Penanda</span>
              <div class="colors-grid">
                {#each CATEGORY_COLORS as color}
                  <button 
                    type="button" 
                    class="color-swatch-btn {catColor === color.hex ? 'is-selected' : ''}" 
                    style="background-color: {color.hex}" 
                    onclick={() => catColor = color.hex}
                    title={color.name}
                  >
                    {#if catColor === color.hex}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>

            {#if errorMessage}
              <div class="error-banner animate-fade-in">
                <span>{errorMessage}</span>
              </div>
            {/if}

            <button type="submit" class="btn btn-primary btn-add-cat mt-2">
              Tambah Kategori
            </button>
          </form>
        </div>

        <!-- KOLOM KANAN: DAFTAR KATEGORI AKTIF -->
        <div class="glass-card list-panel-card">
          <div class="panel-header">
            <h3>Daftar Kategori Aktif</h3>
            <p class="panel-subtitle">Kategori yang saat ini terdaftar di akun Anda.</p>
          </div>

          <div class="cat-items-list">
            {#each auth.categories.filter(c => c.type === (activeTab === 'expense_cat' ? 'expense' : 'income')) as cat (cat.id)}
              <div class="cat-item-row">
                <div class="cat-meta">
                  <span class="cat-color-dot" style="background-color: {cat.color}"></span>
                  <span class="cat-name-lbl">{cat.name}</span>
                </div>
                {#if cat.name.toLowerCase() !== 'lainnya'}
                  <button type="button" class="btn-delete-cat-icon" onclick={() => handleDeleteCategory(cat.id, cat.name)} title="Hapus">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-1.5 12a1.5 1.5 0 01-1.5 1.5H7.5A1.5 1.5 0 016 20.25l-1.5-12m16.5 0h-18m16.5 0a2.25 2.25 0 00-2.25-2.25H16.5m-9-2.25h9M9 5.25V3a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v2.25" />
                    </svg>
                  </button>
                {:else}
                  <span class="default-badge-text">Sistem</span>
                {/if}
              </div>
            {:else}
              <p class="empty-text">Belum ada kategori {activeTab === 'expense_cat' ? 'pengeluaran' : 'pemasukan'}.</p>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    {#if activeTab === 'template'}
      <div class="templates-layout animate-fade-in">
        <div class="glass-card settings-card">
          <div class="tpl-management">
            <!-- Form Template -->
            <form onsubmit={handleSaveTemplate} class="tpl-form glass-card">
              <h3 class="form-sub-title">{editingTplId ? 'Edit Template' : 'Tambah Template Baru'}</h3>
              
              <div class="grid-2">
                <div class="form-group">
                  <label for="tpl-label">Label (Judul Singkat)</label>
                  <input id="tpl-label" type="text" bind:value={tplLabel} placeholder="Contoh: Bensin Mingguan" required />
                </div>
                <div class="form-group">
                  <label for="tpl-desc">Deskripsi Lengkap</label>
                  <input id="tpl-desc" type="text" bind:value={tplDesc} placeholder="Contoh: Makan siang warteg" required />
                </div>
              </div>

              <div class="grid-3 mt-3">
                <div class="form-group">
                  <label for="tpl-cat">Kategori</label>
                  <select id="tpl-cat" bind:value={tplCategory} required>
                    <option value="" disabled selected>-- Pilih --</option>
                    {#each expenseCats as cat}
                      <option value={cat.name}>{cat.name}</option>
                    {/each}
                  </select>
                </div>
                <div class="form-group">
                  <label for="tpl-amt">Nominal (Rp)</label>
                  <input id="tpl-amt" type="number" bind:value={tplAmount} placeholder="0" required />
                </div>
                <div class="form-group">
                  <label for="tpl-pay">Pembayaran</label>
                  <select id="tpl-pay" bind:value={tplPayment} required>
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Kredit/Tempo">Kredit/Tempo</option>
                  </select>
                </div>
              </div>

              <div class="tpl-form-actions mt-4">
                {#if editingTplId}
                  <button type="button" class="btn btn-secondary btn-sm" onclick={resetTplForm}>Batal</button>
                {/if}
                <button type="submit" class="btn btn-primary btn-sm">
                  {editingTplId ? 'Update Template' : 'Simpan Template'}
                </button>
              </div>
            </form>

            <!-- List Template -->
            <div class="tpl-list-scroll mt-4">
              {#each auth.templates as tpl (tpl.id)}
                <div class="tpl-row animate-fade-in">
                  <div class="tpl-info">
                    <span class="tpl-name">{tpl.label}</span>
                    <span class="tpl-meta">{tpl.category} • {formatRupiah(tpl.amount)} • {tpl.payment}</span>
                  </div>
                  <div class="tpl-actions">
                    <button type="button" class="tpl-icon-btn edit" onclick={() => editTpl(tpl)} title="Edit">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                    </button>
                    <button type="button" class="tpl-icon-btn delete" onclick={() => deleteTpl(tpl.id, tpl.label)} title="Hapus">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.34 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                  </div>
                </div>
              {:else}
                <p class="empty-text">Belum ada template. Buat satu untuk mempercepat pencatatan.</p>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {:else if activeTab === 'payment_method'}
      <div class="categories-layout animate-fade-in">
        <!-- KOLOM KIRI: FORM TAMBAH PAYMENT METHOD -->
        <div class="glass-card form-panel-card">
          <div class="panel-header">
            <h3>Tambah Metode Baru</h3>
            <p class="panel-subtitle">Buat metode pembayaran baru.</p>
          </div>

          <form onsubmit={handleAddPaymentMethod} class="category-form">
            <div class="form-group">
              <label for="pm-name">Nama Metode</label>
              <input 
                type="text" 
                id="pm-name"
                bind:value={paymentMethodName} 
                placeholder="Contoh: ShopeePay, Kasbon, Cek" 
                required 
                maxlength="30"
              />
            </div>

            {#if pmErrorMessage}
              <div class="error-msg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {pmErrorMessage}
              </div>
            {/if}

            <button type="submit" class="btn btn-primary w-full submit-btn mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tambah Metode
            </button>
          </form>
        </div>

        <!-- KOLOM KANAN: DAFTAR PAYMENT METHOD -->
        <div class="glass-card list-panel-card">
          <div class="panel-header border-b">
            <h3>Metode Pembayaran Anda</h3>
            <div class="badge-count">{auth.paymentMethods.length} metode</div>
          </div>

          <div class="items-list-container">
            {#if auth.paymentMethods.length === 0}
              <div class="empty-state">
                <div class="empty-icon text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </div>
                <h4>Belum ada metode pembayaran kustom</h4>
                <p>Metode yang Anda buat di sini akan muncul sebagai pilihan saat Anda mencatat pengeluaran.</p>
              </div>
            {:else}
              <div class="categories-grid">
                {#each auth.paymentMethods as pm (pm.id)}
                  <div class="category-item-card animate-scale-in">
                    <div class="cat-info">
                      <div class="cat-color-dot" style="background-color: var(--color-primary)"></div>
                      <span class="cat-name">{pm.name}</span>
                    </div>
                    
                    <button class="action-btn delete" title="Hapus" onclick={() => handleDeletePaymentMethod(pm.id, pm.name)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .data-manager-page {
    max-width: 1024px;
    margin: 0 auto;
  }

  .data-tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0;
  }

  .tab-btn {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    color: var(--text-primary);
  }

  .tab-btn.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  /* ── Categories Layout ── */
  .categories-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  @media (min-width: 1024px) {
    .categories-layout {
      grid-template-columns: 1fr 1.3fr;
    }
  }

  .form-panel-card, .list-panel-card {
    padding: 1.25rem;
  }

  @media (min-width: 640px) {
    .form-panel-card, .list-panel-card {
      padding: 2rem;
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

  .category-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label, .form-group .form-label-txt {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-secondary);
    display: block;
  }

  .colors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  @media (min-width: 640px) {
    .colors-grid {
      grid-template-columns: repeat(5, 1fr);
    }
  }

  .color-swatch-btn {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 8px;
    border: 2px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    transition: transform 0.1s ease;
  }

  .color-swatch-btn:hover {
    transform: scale(1.08);
  }

  .color-swatch-btn.is-selected {
    border-color: #fff;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .color-swatch-btn svg {
    width: 14px;
    height: 14px;
  }

  .error-banner {
    padding: 0.75rem 1rem;
    background-color: var(--color-danger-bg);
    border: 1px solid var(--color-danger-border);
    border-radius: 12px;
    color: var(--color-danger);
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .btn-add-cat {
    padding: 0.875rem;
  }

  .cat-items-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .cat-item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background-color: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    font-size: 0.8125rem;
  }

  :root.light-theme .cat-item-row {
    background-color: rgba(0, 0, 0, 0.005);
  }

  .cat-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .cat-color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .cat-name-lbl {
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-delete-cat-icon {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    transition: all 0.15s ease;
  }

  .btn-delete-cat-icon:hover {
    color: var(--color-danger);
    background-color: var(--color-danger-bg);
  }

  .btn-delete-cat-icon svg {
    width: 14px;
    height: 14px;
  }

  .default-badge-text {
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--text-muted);
    background-color: rgba(255, 255, 255, 0.05);
    padding: 0.125rem 0.35rem;
    border-radius: 4px;
  }

  :root.light-theme .default-badge-text {
    background-color: rgba(0, 0, 0, 0.03);
  }

  /* ── Templates Layout ── */
  .settings-card {
    padding: 1.5rem;
  }

  @media (min-width: 640px) {
    .settings-card {
      padding: 2rem;
    }
  }

  .tpl-form {
    padding: 1.5rem;
    background: rgba(255,255,255,0.015);
    border: 1px solid var(--border-color);
  }
  :root.light-theme .tpl-form { background: rgba(0,0,0,0.015); }

  .form-sub-title {
    font-size: 0.9375rem;
    font-weight: 700;
    margin-bottom: 1.25rem;
    color: var(--text-primary);
  }

  .grid-2 { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  .grid-3 { display: grid; grid-template-columns: 1fr; gap: 1rem; }

  @media (min-width: 640px) {
    .grid-2 { grid-template-columns: 1fr 1.5fr; }
    .grid-3 { grid-template-columns: 1.2fr 1fr 1fr; }
  }

  .tpl-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .tpl-list-scroll {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tpl-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.25rem;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
  }

  :root.light-theme .tpl-row { background: rgba(0,0,0,0.015); }

  .tpl-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .tpl-name {
    font-weight: 700;
    font-size: 0.9375rem;
    color: var(--text-primary);
  }

  .tpl-meta {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .tpl-actions {
    display: flex;
    gap: 0.5rem;
  }

  .tpl-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .tpl-icon-btn svg { width: 16px; height: 16px; }
  .tpl-icon-btn.edit:hover { background: rgba(99,102,241,0.1); color: #8b5cf6; }
  .tpl-icon-btn.delete:hover { background: rgba(244,63,94,0.1); color: #f43f5e; }

  .empty-text {
    font-size: 0.8125rem;
    color: var(--text-muted);
    text-align: center;
    padding: 1.5rem 0;
  }

  .mt-2 { margin-top: 0.5rem; }
  .mt-3 { margin-top: 1rem; }
  .mt-4 { margin-top: 1.5rem; }
</style>
