<script>
  import { auth, ui } from '../lib/store.svelte.js';

  let items = $state([{ description: '', amount: '', category: '' }]);

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  let formDate = $state(todayStr());
  let formPayment = $state(auth.paymentMethods.length > 0 ? auth.paymentMethods[0].name : 'Tunai');
  let formLoading = $state(false);

  const incomeCats = $derived(auth.categories.filter(c => c.type === 'income'));

  function getCategoryColor(catName) {
    const cat = auth.categories.find(c => c.name === catName && c.type === 'income');
    return cat ? cat.color : '#64748b';
  }

  function addItem() {
    items.push({ description: '', amount: '', category: '' });
  }

  function removeItem(index) {
    if (items.length > 1) {
      items.splice(index, 1);
    }
  }

  function formatRupiah(v) {
    if (!v) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
  }

  async function submitForm(e) {
    if (e) e.preventDefault();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description.trim()) {
        ui.addNotification(`Keterangan pemasukan #${i + 1} belum diisi!`, 'error');
        return;
      }
      if (!item.amount || Number(item.amount) <= 0) {
        ui.addNotification(`Nominal pemasukan #${i + 1} tidak valid!`, 'error');
        return;
      }
      if (!item.category) {
        ui.addNotification(`Kategori pemasukan #${i + 1} belum dipilih!`, 'error');
        return;
      }
    }

    formLoading = true;
    try {
      const promises = items.map((item, idx) => {
        return auth.addTransaction({
          id: (Date.now() + idx).toString(),
          description: item.description.trim(),
          amount: Number(item.amount),
          category: item.category,
          date: formDate,
          quantity: 1,
          payment_method: formPayment,
          type: 'income'
        });
      });
      await Promise.all(promises);

      ui.addNotification(`${items.length} data pemasukan berhasil disimpan!`, 'success');
      items = [{ description: '', amount: '', category: '' }];
      formDate = todayStr();
    } catch (err) {
      ui.addNotification(err.message, 'error');
    } finally {
      formLoading = false;
    }
  }
</script>

<div class="expense-entry-page animate-fade-in pb-12">
  <div class="page-header">
    <h1 class="page-title">
      <span class="page-header-icon" style="color: var(--color-success); background: rgba(16, 185, 129, 0.1);">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </span>
      Catat Pemasukan
    </h1>
    <p class="page-subtitle">Setiap pemasukan adalah langkah menuju kebebasan finansial.</p>
  </div>

  <div class="ee-main-layout">
    <!-- ── KOLOM KIRI: FORM UTAMA ── -->
    <div class="ee-form-col">
      <div class="glass-card ee-form-card">
        <form onsubmit={submitForm} class="ee-form">
          <div class="ee-items-wrapper">
            {#each items as item, idx}
              <div class="ee-item-row animate-scale-in" style="border-left: 4px solid var(--color-success)">
                <!-- Mobile Header for Row -->
                <div class="ee-item-mobile-header">
                  <span class="ee-item-num">Pemasukan #{idx + 1}</span>
                  {#if items.length > 1}
                    <button type="button" onclick={() => removeItem(idx)} class="ee-btn-remove-mobile">Hapus</button>
                  {/if}
                </div>

                <!-- Description -->
                <div class="ee-field ee-field-desc">
                  <label class="ee-field-label-mobile" for="desc-{idx}">Sumber / Keterangan</label>
                  <input
                    id="desc-{idx}"
                    type="text"
                    bind:value={item.description}
                    placeholder="Contoh: Gaji bulanan, Jual barang"
                    required
                  />
                </div>

                <!-- Amount -->
                <div class="ee-field ee-field-price">
                  <label class="ee-field-label-mobile" for="amount-{idx}">Nominal Bersih (Rp)</label>
                  <div class="ee-input-prefix-wrap">
                    <span class="ee-input-prefix" style="color: var(--color-success);">Rp</span>
                    <input
                      id="amount-{idx}"
                      type="text" inputmode="numeric"
                      value={item.amount ? Number(String(item.amount).replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                      oninput={(e) => { item.amount = e.target.value.replace(/[^0-9]/g, ''); }}
                      min="1"
                      placeholder="0"
                      required
                      class="ee-input-with-prefix"
                      style="color: var(--color-success); font-weight: bold;"
                    />
                  </div>
                </div>

                <!-- Category -->
                <div class="ee-field ee-field-cat">
                  <label class="ee-field-label-mobile" for="cat-{idx}">Kategori</label>
                  <select id="cat-{idx}" bind:value={item.category} required>
                    <option value="" disabled selected>-- Pilih Kategori --</option>
                    {#each incomeCats as cat}
                      <option value={cat.name}>{cat.name}</option>
                    {/each}
                  </select>
                </div>

                <!-- Delete button (desktop) -->
                {#if items.length > 1}
                  <button
                    type="button"
                    onclick={() => removeItem(idx)}
                    class="ee-btn-remove-desktop"
                    title="Hapus Baris"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                {:else}
                  <div class="ee-btn-remove-placeholder"></div>
                {/if}

              </div>
            {/each}
          </div>

          <!-- Add Row Button -->
          <button type="button" onclick={addItem} class="ee-btn-add-row" style="color: var(--color-success); border-color: rgba(16, 185, 129, 0.3); background-color: rgba(16, 185, 129, 0.05);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Tambah Item Pemasukan
          </button>

          <!-- Common Fields (Date & Payment) -->
          <div class="ee-common-fields">
            <div class="ee-form-group">
              <label for="date" class="ee-form-label">Tanggal Masuk</label>
              <input id="date" type="date" bind:value={formDate} required />
            </div>
            <div class="ee-form-group">
              <label for="payment" class="ee-form-label">Metode Penerimaan</label>
              <select id="payment" bind:value={formPayment} required>
                {#if auth.paymentMethods.length === 0}
                  <option value="Tunai">Tunai</option>
                {:else}
                  {#each auth.paymentMethods as pm}
                    <option value={pm.name}>{pm.name}</option>
                  {/each}
                {/if}
              </select>
            </div>
          </div>

          <!-- Actions -->
          <div class="ee-form-actions">
            <button
              type="submit"
              disabled={formLoading}
              class="ee-btn-submit"
              style="background-color: var(--color-success); width: 100%; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);"
            >
              {#if formLoading}
                <div class="ee-spinner ee-spinner-sm"></div>
                <span>Menyimpan Pemasukan...</span>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                <span>Simpan Pemasukan ({items.length} Item)</span>
              {/if}
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
</div>

<style>
  /* Menggunakan styling struktur layout dari ExpenseEntry */
  .expense-entry-page {
    width: 100%;
  }

  .ee-main-layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  @media (min-width: 1024px) {
    .ee-main-layout {
      flex-direction: row;
      align-items: flex-start;
    }
    .ee-form-col {
      flex: 1;
      min-width: 0; /* Prevent flex blowout */
    }
  }

  .ee-form-card {
    padding: 1.25rem;
  }
  @media (min-width: 640px) {
    .ee-form-card { padding: 2rem; }
  }

  .ee-items-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .ee-item-row {
    background-color: var(--bg-base);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    transition: all 0.2s;
  }
  
  .ee-item-row:hover {
    border-color: rgba(16, 185, 129, 0.5);
  }

  @media (min-width: 768px) {
    .ee-item-row {
      flex-direction: row;
      align-items: flex-end;
      padding: 1rem 1.25rem;
      gap: 1rem;
    }
  }

  .ee-item-mobile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
  }
  @media (min-width: 768px) {
    .ee-item-mobile-header { display: none; }
  }

  .ee-item-num {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ee-field {
    display: flex;
    flex-direction: column;
  }

  .ee-field-label-mobile {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-foreground);
    margin-bottom: 0.375rem;
  }
  @media (min-width: 768px) {
    .ee-field-label-mobile {
      font-size: 0.75rem;
      color: var(--color-muted);
      margin-bottom: 0.25rem;
    }
  }

  .ee-field input, .ee-field select {
    background-color: var(--bg-glass);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 0.625rem 0.875rem;
    color: var(--text-foreground);
    font-size: 0.95rem;
    transition: all 0.2s;
    width: 100%;
  }

  .ee-field input:focus, .ee-field select:focus {
    outline: none;
    border-color: var(--color-success);
    background-color: var(--bg-base);
  }

  .ee-field-desc { flex: 2; }
  .ee-field-price { flex: 1.5; }
  .ee-field-cat { flex: 1.5; }

  .ee-input-prefix-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .ee-input-prefix {
    position: absolute;
    left: 0.875rem;
    font-weight: 700;
  }

  .ee-input-with-prefix {
    padding-left: 2.5rem !important;
  }

  .ee-btn-remove-mobile {
    background: none; border: none;
    color: var(--color-danger);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }
  .ee-btn-remove-mobile:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }

  .ee-btn-remove-desktop {
    display: none;
    background: none; border: none;
    color: var(--color-muted);
    cursor: pointer;
    padding: 0.625rem;
    border-radius: 0.5rem;
    transition: all 0.2s;
    margin-bottom: 2px;
  }
  @media (min-width: 768px) {
    .ee-btn-remove-desktop { display: flex; align-items: center; justify-content: center; }
  }
  .ee-btn-remove-desktop:hover {
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--color-danger);
  }
  .ee-btn-remove-desktop svg {
    width: 1.25rem; height: 1.25rem;
  }

  .ee-btn-remove-placeholder {
    display: none;
    width: 2.5rem;
  }
  @media (min-width: 768px) {
    .ee-btn-remove-placeholder { display: block; }
  }

  .ee-btn-add-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem;
    background: none;
    border: 2px dashed;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 2rem;
  }
  .ee-btn-add-row:hover {
    background-color: rgba(16, 185, 129, 0.1) !important;
  }
  .ee-btn-add-row svg {
    width: 1.25rem; height: 1.25rem;
  }

  .ee-common-fields {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    background-color: var(--bg-glass);
    padding: 1.25rem;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
  }
  @media (min-width: 640px) {
    .ee-common-fields {
      grid-template-columns: 1fr 1fr;
    }
  }

  .ee-form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ee-form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-foreground);
  }

  .ee-form-group input, .ee-form-group select {
    background-color: var(--bg-base);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 0.625rem 0.875rem;
    color: var(--text-foreground);
    font-size: 0.95rem;
    transition: all 0.2s;
    width: 100%;
  }

  .ee-form-group input:focus, .ee-form-group select:focus {
    outline: none;
    border-color: var(--color-success);
  }

  .ee-form-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  @media (min-width: 640px) {
    .ee-form-actions {
      flex-direction: row;
      justify-content: flex-end;
    }
  }

  .ee-btn-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 0.75rem;
    color: white;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ee-btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
  }
  .ee-btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .ee-btn-submit svg {
    width: 1.25rem; height: 1.25rem;
  }

  .ee-spinner {
    width: 1.5rem; height: 1.5rem;
    border: 3px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: ee-spin 1s ease-in-out infinite;
  }
  .ee-spinner-sm {
    width: 1.25rem; height: 1.25rem;
    border-width: 2px;
  }

  @keyframes ee-spin {
    to { transform: rotate(360deg); }
  }

</style>
