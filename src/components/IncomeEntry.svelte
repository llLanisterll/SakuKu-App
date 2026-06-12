<script>
  import { auth, ui } from '../lib/store.svelte.js';

  let items = $state([{ description: '', amount: '', category: '' }]);
  let formDate = $state(new Date().toISOString().split('T')[0]);
  let formPayment = $state(auth.paymentMethods.length > 0 ? auth.paymentMethods[0].name : 'Tunai');
  let formLoading = $state(false);

  const incomeCats = $derived(auth.categories.filter(c => c.type === 'income'));

  function formatRupiah(v) {
    if (!v) return '';
    const num = Number(v.toString().replace(/[^0-9]/g, ''));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  }

  function handleAmountInput(e, index) {
    let rawValue = e.target.value.replace(/[^0-9]/g, '');
    items[index].amount = rawValue;
  }

  function addItem() {
    items.push({ description: '', amount: '', category: '' });
  }

  function removeItem(index) {
    if (items.length > 1) {
      items.splice(index, 1);
    }
  }

  async function submitForm(e) {
    if (e) e.preventDefault();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description.trim()) {
        ui.addNotification(`Deskripsi pemasukan #${i + 1} tidak boleh kosong!`, 'error');
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

      ui.addNotification(`${items.length} item pemasukan berhasil disimpan!`, 'success');
      items = [{ description: '', amount: '', category: '' }];
    } catch (err) {
      ui.addNotification(err.message, 'error');
    } finally {
      formLoading = false;
    }
  }

  const grandTotal = $derived(items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
</script>

<div class="income-entry animate-fade-in pb-12">
  <div class="page-header text-center">
    <div class="icon-pulse mx-auto mb-4 bg-success-light text-success" style="width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 32px; height: 32px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h1 class="page-title text-success">Catat Pemasukan</h1>
    <p class="page-subtitle">Setiap pemasukan adalah langkah menuju kebebasan finansial.</p>
  </div>

  <div class="glass-card max-w-3xl mx-auto form-card">
    <form onsubmit={submitForm} class="transaction-form">
      
      <!-- HEADER INFO -->
      <div class="form-row-grid bg-base rounded-lg p-4 mb-6 border border-glass">
        <div class="form-group mb-0">
          <label for="date" class="flex items-center gap-2 text-sm text-muted font-medium mb-2">
            <svg class="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Tanggal Masuk
          </label>
          <input type="date" id="date" bind:value={formDate} required class="form-input bg-transparent border-b border-glass pb-1 px-0 focus:ring-0 rounded-none text-lg font-semibold" />
        </div>

        <div class="form-group mb-0">
          <label for="method" class="flex items-center gap-2 text-sm text-muted font-medium mb-2">
            <svg class="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            Metode Penerimaan
          </label>
          <div class="select-wrapper border-b border-glass pb-1">
            <select id="method" bind:value={formPayment} class="form-select bg-transparent px-0 focus:ring-0 rounded-none text-lg font-semibold w-full appearance-none">
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
      </div>

      <!-- ITEMS -->
      <div class="items-container">
        <div class="items-header flex justify-between items-end mb-4">
          <h3 class="font-bold text-lg flex items-center gap-2">
            <span class="badge-count bg-success text-white">{items.length}</span>
            Daftar Penerimaan
          </h3>
          <button type="button" class="btn btn-sm btn-ghost text-success hover:bg-success-light font-semibold" onclick={addItem}>
            + Tambah Baris
          </button>
        </div>

        <div class="items-list">
          {#each items as item, i}
            <div class="item-row relative glass-card p-5 mb-4 animate-scale-in" style="border-left: 4px solid var(--color-success)">
              {#if items.length > 1}
                <button type="button" class="absolute -top-3 -right-3 bg-danger text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:scale-110 transition-transform" onclick={() => removeItem(i)} title="Hapus baris">
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              {/if}

              <div class="form-group mb-4">
                <label for="desc-{i}">Sumber / Deskripsi Pemasukan</label>
                <input type="text" id="desc-{i}" bind:value={item.description} placeholder="Contoh: Gaji Bulan Juni, Jual Motor, dll" required class="form-input font-medium text-lg" />
              </div>

              <div class="form-row-grid">
                <div class="form-group mb-0">
                  <label for="cat-{i}">Kategori</label>
                  <select id="cat-{i}" bind:value={item.category} required class="form-select font-medium text-base">
                    <option value="" disabled selected>-- Pilih Kategori --</option>
                    {#each incomeCats as cat}
                      <option value={cat.name}>{cat.name}</option>
                    {/each}
                  </select>
                </div>
                <div class="form-group mb-0">
                  <label for="amt-{i}">Nominal Bersih (Rp)</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-success font-bold text-lg">Rp</span>
                    <input type="text" id="amt-{i}" value={formatRupiah(item.amount).replace('Rp', '').trim()} oninput={(e) => handleAmountInput(e, i)} placeholder="0" required class="form-input text-right font-bold text-success text-xl pl-10" />
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- FOOTER TOTAL -->
      <div class="total-summary mt-8 glass-card bg-success-light border-success p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-success uppercase tracking-wider mb-1">Total Pemasukan</p>
          <h2 class="text-3xl font-extrabold text-success m-0">{formatRupiah(grandTotal)}</h2>
        </div>
        
        <button type="submit" class="btn btn-primary bg-success hover:bg-green-600 text-white font-bold py-3 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto flex items-center justify-center gap-2" disabled={formLoading}>
          {#if formLoading}
            <div class="spinner border-white border-t-transparent w-5 h-5"></div>
            Menyimpan...
          {:else}
            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Simpan Pemasukan
          {/if}
        </button>
      </div>

    </form>
  </div>
</div>

<style>
  .form-row-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  @media (min-width: 640px) {
    .form-row-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  .bg-success-light {
    background-color: rgba(16, 185, 129, 0.1);
  }
  .text-success {
    color: #10b981;
  }
  .border-success {
    border-color: rgba(16, 185, 129, 0.3);
  }
  .bg-success {
    background-color: #10b981;
  }
</style>
