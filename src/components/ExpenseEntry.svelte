<script>
  import { onMount } from 'svelte';
  import { auth, ui } from '../lib/store.svelte.js';

  let items = $state([
    { description: '', amount: '', category: '', quantity: 1 }
  ]);
  let formDate = $state(todayStr());
  let formPayment = $state('Tunai');
  let formLoading = $state(false);

  let isScanning = $state(false);
  let scanProgress = $state(0);
  let selectedFileName = $state('');
  let ocrStatusText = $state('Menyiapkan engine OCR...');

  onMount(() => {
    // Check if there is an applied template from Dashboard
    const appliedTpl = sessionStorage.getItem('sakuku_applied_template');
    if (appliedTpl) {
      try {
        const tpl = JSON.parse(appliedTpl);
        applyTemplate(tpl);
        sessionStorage.removeItem('sakuku_applied_template');
      } catch (err) {
        console.error('Gagal memuat template:', err);
      }
    }
  });

  const templates = $derived(auth.templates);

  function todayStr() { return new Date().toISOString().split('T')[0]; }

  function formatRupiah(v) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
  }

  function getCategoryColor(catName) {
    const cat = auth.categories.find(c => c.name === catName);
    return cat ? cat.color : '#64748b';
  }

  const expenseCats = $derived(auth.categories.filter(c => c.type === 'expense'));

  const thisMonth = $derived.by(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const globalBudget = $derived.by(() => {
    const b = (auth.budgets || []).find(b => b.category === 'GLOBAL_MONTH');
    return b ? Number(b.amount) : 0;
  });

  const globalUsage = $derived.by(() => {
    return auth.transactions
      .filter(t => (t.type === 'expense' || !t.type) && t.date?.startsWith(thisMonth))
      .reduce((sum, t) => sum + Number(t.amount), 0);
  });

  const totalDraftAmount = $derived(items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));

  const todayExpenses = $derived(
    auth.transactions.filter(t => t.type === 'expense' && t.date === todayStr())
  );
  const todayTotalExpense = $derived(todayExpenses.reduce((sum, t) => sum + Number(t.amount), 0));

  function addItem() {
    items.push({ description: '', amount: '', category: '', quantity: 1 });
  }

  function removeItem(index) {
    if (items.length > 1) {
      items.splice(index, 1);
    }
  }

  function applyTemplate(tpl) {
    const catExists = expenseCats.some(c => c.name.toLowerCase() === tpl.category.toLowerCase());
    const finalCat = catExists
      ? expenseCats.find(c => c.name.toLowerCase() === tpl.category.toLowerCase()).name
      : (expenseCats.length > 0 ? expenseCats[0].name : '');

    items = [{
      description: tpl.desc,
      amount: tpl.amount,
      category: finalCat,
      quantity: tpl.qty
    }];
    formPayment = tpl.payment;
    ui.addNotification(`Template "${tpl.label}" diterapkan!`, 'success');
  }

  async function submitForm(e) {
    if (e) e.preventDefault();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description.trim()) {
        ui.addNotification(`Deskripsi pengeluaran #${i + 1} tidak boleh kosong!`, 'error');
        return;
      }
      if (!item.amount || Number(item.amount) <= 0) {
        ui.addNotification(`Nominal pengeluaran #${i + 1} tidak valid!`, 'error');
        return;
      }
      if (!item.category) {
        ui.addNotification(`Kategori pengeluaran #${i + 1} belum dipilih!`, 'error');
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
          quantity: Number(item.quantity) || 1,
          payment_method: formPayment
        });
      });
      await Promise.all(promises);

      ui.addNotification(`${items.length} item pengeluaran berhasil disimpan!`, 'success');
      items = [{ description: '', amount: '', category: '', quantity: 1 }];
      formDate = todayStr();
      selectedFileName = '';
    } catch (err) {
      ui.addNotification('Gagal menyimpan: ' + err.message, 'error');
    } finally {
      formLoading = false;
    }
  }

  function cancelForm() {
    items = [{ description: '', amount: '', category: '', quantity: 1 }];
    formDate = todayStr();
    formPayment = 'Tunai';
    selectedFileName = '';
    ui.addNotification('Formulir berhasil dikosongkan.', 'info');
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    selectedFileName = file.name;
    runOcr(file);
  }

  async function runOcr(file) {
    if (typeof window === 'undefined') return;
    isScanning = true;
    ocrStatusText = 'Menghubungkan ke Engine OCR...';
    scanProgress = 5;

    if (!window.Tesseract) {
      try {
        await loadTesseractScript();
      } catch (err) {
        ui.addNotification('Gagal memuat engine OCR: ' + err.message, 'error');
        isScanning = false;
        return;
      }
    }

    ocrStatusText = 'Menginisialisasi pemindaian...';
    scanProgress = 15;

    try {
      const imageUrl = URL.createObjectURL(file);
      const { data: { text } } = await window.Tesseract.recognize(imageUrl, 'ind', {
        logger: m => {
          if (m.status === 'recognizing text') {
            ocrStatusText = `Mengekstrak teks nota... ${Math.round(m.progress * 100)}%`;
            scanProgress = 15 + Math.round(m.progress * 85);
          } else {
            ocrStatusText = `${m.status === 'loading tesseract api' ? 'Memuat Engine OCR' : m.status}...`;
            scanProgress = Math.min(scanProgress + 1, 15);
          }
        }
      });
      parseOcrText(text, file.name);
      URL.revokeObjectURL(imageUrl);
    } catch (err) {
      console.error('OCR Error:', err);
      ui.addNotification('Gagal memindai nota: ' + err.message, 'error');
    } finally {
      isScanning = false;
    }
  }

  function loadTesseractScript() {
    return new Promise((resolve, reject) => {
      if (window.Tesseract) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Gagal mengunduh script Tesseract.js'));
      document.head.appendChild(script);
    });
  }

  function parseOcrText(text, fileName) {
    if (!text || text.trim().length === 0) {
      ui.addNotification('Teks tidak terbaca.', 'error');
      return;
    }

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    let detectedStore = '';
    for (let i = 0; i < Math.min(4, lines.length); i++) {
      const line = lines[i];
      const lineClean = line.replace(/[^a-zA-Z\s]/g, '').trim();
      if (lineClean.length > 3 && lineClean.length < 25 &&
          !['tanggal', 'nota', 'welcome', 'selamat', 'no.'].some(w => lineClean.toLowerCase().includes(w))) {
        detectedStore = lineClean;
        break;
      }
    }
    if (!detectedStore) detectedStore = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const cleanStore = detectedStore.replace(/^(welcome to|selamat datang di|kasir|outlet)\s+/i, '');

    const dateRegexes = [
      /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,
      /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/
    ];
    let dateFound = false;
    for (const r of dateRegexes) {
      const match = text.match(r);
      if (match) {
        formDate = match[3]?.length === 4 ? `${match[3]}-${match[2]}-${match[1]}` : match[0];
        dateFound = true;
        break;
      }
    }
    if (!dateFound) formDate = todayStr();

    const fullTextLower = text.toLowerCase();
    if (['qris', 'gopay', 'ovo', 'dana', 'linkaja', 'spay', 'shopeepay'].some(w => fullTextLower.includes(w))) {
      formPayment = 'QRIS';
    } else if (['debit', 'credit', 'transfer', 'bca', 'mandiri', 'bni', 'bri', 'card'].some(w => fullTextLower.includes(w))) {
      formPayment = 'Transfer Bank';
    } else {
      formPayment = 'Tunai';
    }

    const skipKeywords = ['total', 'grand', 'subtotal', 'pajak', 'tax', 'diskon', 'discount', 'kembalian', 'change', 'cash', 'tunai', 'bayar', 'kembali', 'telp', 'alamat', 'jl.', 'jalan', 'welcome', 'selamat', 'promo', 'member', 'kartu', 'merchant', 'npwp', 'operator', 'kasir'];
    let parsedItems = [];

    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (skipKeywords.some(kw => lower.includes(kw))) return;
      const cleanLine = line.replace(/(\d+)[.,](\d{3})/g, '$1$2');
      const numMatches = cleanLine.match(/\d+/g);
      if (numMatches && numMatches.length > 0) {
        const lastNumStr = numMatches[numMatches.length - 1];
        const price = parseInt(lastNumStr, 10);
        if (price >= 2000 && price <= 2000000) {
          const priceIdx = cleanLine.lastIndexOf(lastNumStr);
          const name = cleanLine.slice(0, priceIdx).replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
          if (name.length > 2 && name.length < 35) {
            let qty = 1;
            const qtyMatch = cleanLine.match(/(\d+)\s*(x|pcs|kg|pak|bks)/i);
            if (qtyMatch) qty = parseInt(qtyMatch[1], 10);
            let cat = 'Operasional';
            const foodKw = ['ayam', 'beras', 'cabai', 'bawang', 'minyak', 'telur', 'sayur', 'daging', 'bumbu', 'kecap', 'saus', 'gula', 'garam'];
            const packKw = ['cup', 'box', 'kemasan', 'plastik', 'mika', 'sendok', 'garpu', 'sedotan', 'sablon', 'paper bowl'];
            const lowerName = name.toLowerCase();
            if (foodKw.some(kw => lowerName.includes(kw))) cat = 'Bahan Baku';
            else if (packKw.some(kw => lowerName.includes(kw))) cat = 'Packaging';
            const exists = expenseCats.some(c => c.name.toLowerCase() === cat.toLowerCase());
            const finalCat = exists ? expenseCats.find(c => c.name.toLowerCase() === cat.toLowerCase()).name : '';
            parsedItems.push({ description: name, amount: price, category: finalCat, quantity: qty });
          }
        }
      }
    });

    if (parsedItems.length > 0) {
      items = parsedItems;
      ui.addNotification(`OCR Sukses! ${parsedItems.length} item berhasil dipetakan dari nota.`, 'success');
    } else {
      let totalAmount = 0;
      let maxNumberFound = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (['total', 'jumlah', 'grand', 'bayar'].some(w => line.includes(w))) {
          const amount = parseInt(line.replace(/[^0-9]/g, ''), 10);
          if (amount >= 1000 && amount <= 5000000) { totalAmount = amount; break; }
        }
      }
      if (totalAmount === 0) {
        lines.forEach(line => {
          const parsedLine = line.replace(/(\d+)[.,](\d{3})/g, '$1$2');
          const matches = parsedLine.match(/\b\d{4,7}\b/g);
          if (matches) {
            matches.forEach(m => {
              const val = parseInt(m, 10);
              if (val > maxNumberFound && val >= 1000 && val <= 5000000) maxNumberFound = val;
            });
          }
        });
        totalAmount = maxNumberFound;
      }
      const defaultCat = expenseCats.length > 0 ? expenseCats[0].name : '';
      items = [{ description: `Belanja di ${cleanStore}`, amount: totalAmount > 0 ? totalAmount : '', category: defaultCat, quantity: 1 }];
      ui.addNotification(`OCR Sukses! Total belanja dari ${cleanStore} berhasil dibaca.`, 'success');
    }
  }

  function deleteTx(id) {
    ui.askConfirmation({
      title: 'Hapus Transaksi',
      message: 'Apakah Anda yakin ingin menghapus catatan transaksi ini?',
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await auth.deleteTransaction(id);
          ui.addNotification('Transaksi dihapus!', 'success');
        } catch (err) {
          ui.addNotification('Gagal: ' + err.message, 'error');
        }
      }
    });
  }
</script>

<div class="ee-page animate-fade-in pb-12">

  <!-- Page Header -->
  <div class="page-header">
    <h1 class="page-title">
      <span class="page-header-icon icon-danger">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" /></svg>
      </span>
      Catat Pengeluaran
    </h1>
    <p class="page-subtitle">Catat pengeluaran harian dengan mudah dan pantau anggaran per kategori secara real-time.</p>
  </div>

  <!-- Main Layout: Form left, Sidebar right -->
  <div class="ee-layout">

    <!-- ── KOLOM KIRI: FORM ── -->
    <div class="ee-form-col">
      <div class="glass-card ee-form-card">

        <!-- Card Header -->
        <div class="ee-card-head">
          <h2 class="ee-card-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            Formulir Pengeluaran
          </h2>
        </div>

        <form onsubmit={submitForm} class="ee-form-body">

          <!-- Total Draft Summary -->
          <div class="ee-draft-summary">
            <div>
              <span class="ee-draft-label">Total Pengeluaran Saat Ini</span>
              <span class="ee-draft-amount">{formatRupiah(totalDraftAmount)}</span>
            </div>
            <span class="ee-draft-count">{items.length} Item Pengeluaran</span>
          </div>

          <!-- Item Table Header (Desktop only) -->
          <div class="ee-table-head">
            <div class="ee-th ee-th-desc">Keterangan Pengeluaran</div>
            <div class="ee-th ee-th-price">Jumlah (Rp)</div>
            <div class="ee-th ee-th-cat">Kategori</div>
            <div class="ee-th ee-th-del"></div>
          </div>

          <!-- Item Rows -->
          <div class="ee-items-list">
            {#each items as item, idx}
              <div class="ee-item-row animate-fade-in">

                <!-- Mobile card header -->
                <div class="ee-item-mobile-head">
                  <span class="ee-item-num">Pengeluaran #{idx + 1}</span>
                  {#if items.length > 1}
                    <button type="button" onclick={() => removeItem(idx)} class="ee-btn-remove-mobile">Hapus</button>
                  {/if}
                </div>

                <!-- Description -->
                <div class="ee-field ee-field-desc">
                  <label class="ee-field-label-mobile" for="desc-{idx}">Keterangan</label>
                  <input
                    id="desc-{idx}"
                    type="text"
                    bind:value={item.description}
                    placeholder="Contoh: Makan siang, Bensin, Listrik"
                    required
                  />
                </div>

                <!-- Amount -->
                <div class="ee-field ee-field-price">
                  <label class="ee-field-label-mobile" for="amount-{idx}">Nominal (Rp)</label>
                  <div class="ee-input-prefix-wrap">
                    <span class="ee-input-prefix">Rp</span>
                    <input
                      id="amount-{idx}"
                      type="text" inputmode="numeric"
                      value={item.amount ? Number(String(item.amount).replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                      oninput={(e) => { item.amount = e.target.value.replace(/[^0-9]/g, ''); }}
                      min="1"
                      placeholder="0"
                      required
                      class="ee-input-with-prefix"
                    />
                  </div>
                </div>

                <!-- Category -->
                <div class="ee-field ee-field-cat">
                  <label class="ee-field-label-mobile" for="cat-{idx}">Kategori</label>
                  <select id="cat-{idx}" bind:value={item.category} required>
                    <option value="" disabled selected>-- Pilih Kategori --</option>
                    {#each expenseCats as cat}
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
          <button type="button" onclick={addItem} class="ee-btn-add-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Tambah Item Pengeluaran
          </button>

          <!-- Common Fields (Date & Payment) -->
          <div class="ee-common-fields">
            <div class="ee-form-group">
              <label for="date" class="ee-form-label">Tanggal Pengeluaran</label>
              <input id="date" type="date" bind:value={formDate} required />
            </div>
            <div class="ee-form-group">
              <label for="payment" class="ee-form-label">Metode Pembayaran</label>
              <select id="payment" bind:value={formPayment} required>
                <option value="Tunai">Tunai</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="Kredit/Tempo">Kredit/Tempo</option>
              </select>
            </div>
          </div>

          <!-- OCR Upload -->
          <div class="ee-form-group">
            <label class="ee-form-label" for="ocr-file-input">Lampiran Nota / Bukti Pembayaran (OCR Scanner)</label>
            <div class="ee-ocr-zone">
              <input
                id="ocr-file-input"
                type="file"
                accept="image/*"
                onchange={handleFileChange}
                class="ee-ocr-input"
                disabled={isScanning}
              />

              {#if isScanning}
                <div class="ee-ocr-laser"></div>
                <div class="ee-ocr-scanning">
                  <div class="ee-spinner"></div>
                  <span class="ee-ocr-status">{ocrStatusText}</span>
                  <p class="ee-ocr-progress">Progres: {scanProgress}%</p>
                </div>
              {:else if selectedFileName}
                <div class="ee-ocr-done">
                  <div class="ee-ocr-icon-success">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <span class="ee-ocr-filename">{selectedFileName}</span>
                  <p class="ee-ocr-hint">Data nota berhasil dipetakan. Seret berkas baru untuk memindai ulang.</p>
                </div>
              {:else}
                <div class="ee-ocr-idle">
                  <div class="ee-ocr-icon-idle">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                  </div>
                  <span class="ee-ocr-hint-title">Unggah foto nota / bukti pembayaran untuk dipindai otomatis</span>
                  <p class="ee-ocr-hint">Mendukung deteksi otomatis banyak item sekaligus.</p>
                </div>
              {/if}
            </div>
          </div>

          <!-- Actions -->
          <div class="ee-form-actions">
            <button
              type="button"
              class="ee-btn-cancel"
              onclick={cancelForm}
              disabled={formLoading || isScanning}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={formLoading || isScanning}
              class="ee-btn-submit"
            >
              {#if formLoading}
                <div class="ee-spinner ee-spinner-sm"></div>
                <span>Menyimpan Seluruh Pengeluaran...</span>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>Simpan Pengeluaran ({items.length} Item)</span>
              {/if}
            </button>
          </div>

        </form>
      </div>
    </div>

    <!-- ── KOLOM KANAN: SIDEBAR ── -->
    <div class="ee-sidebar-col">

      <!-- Panel 1: Status Anggaran -->
      <div class="glass-card ee-panel">
        <div class="ee-panel-head">
          <h2 class="ee-panel-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H4.5A2.25 2.25 0 002.25 12v6.75A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V12z" /></svg>
            Status Anggaran Bulanan
          </h2>
          <p class="ee-panel-subtitle">Sisa anggaran global untuk bulan ini.</p>
        </div>

        <div class="ee-budget-list">
          {#if globalBudget > 0}
            {@const spent = globalUsage}
            {@const draftAmt = totalDraftAmount}
            {@const simulated = spent + draftAmt}
            {@const remaining = globalBudget - simulated}
            {@const pct = Math.min(100, Math.max(0, (simulated / globalBudget) * 100))}
            {@const isOver = remaining < 0}
            {@const today = new Date()}
            {@const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()}
            {@const remainingDays = Math.max(1, daysInMonth - today.getDate() + 1)}
            {@const dailyLimit = Math.max(0, remaining / remainingDays)}

            <div class="ee-budget-card {draftAmt > 0 ? 'is-draft' : ''}">
              <div class="ee-budget-card-head">
                <div class="ee-budget-cat">
                  <span class="ee-cat-dot" style="background-color: var(--color-primary)"></span>
                  <span class="ee-cat-name">Total Pengeluaran Bulan Ini</span>
                </div>
                <div class="ee-budget-remaining" style="color: {isOver ? 'var(--color-danger)' : 'var(--color-primary)'};">
                  <span class="ee-sisa-lbl">Sisa Bulanan</span>
                  <strong>{isOver ? 'Habis' : formatRupiah(remaining)}</strong>
                </div>
              </div>
              <!-- Mini Progress Bar -->
              <div class="ee-mini-progress-bg">
                <div class="ee-mini-progress-bar" style="width: {pct}%; background-color: {isOver ? 'var(--color-danger)' : 'var(--color-primary)'};"></div>
              </div>
              
              <!-- Daily Budget Sub Tracker -->
              <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 0.8rem; color: var(--color-muted);">Sisa Jatah Harian Pintar:</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: {dailyLimit > 0 ? 'var(--color-primary)' : 'var(--color-danger)'};">
                  {formatRupiah(dailyLimit)} <span style="font-weight: 400; font-size: 0.7rem; color: var(--color-muted);">/ hari</span>
                </div>
              </div>

              {#if draftAmt > 0}
                <div class="ee-budget-hint" style="margin-top: 0.5rem;">Termasuk Rp {formatRupiahShort(draftAmt)} dari draft form ini.</div>
              {/if}
            </div>
          {:else}
            <div class="ee-empty-budget">
              <span class="ee-empty-emoji">📉</span>
              <p>Anggaran bulanan belum diatur.</p>
              <button class="btn-link-sm" onclick={() => ui.currentTab = 'planning'}>Atur Sekarang</button>
            </div>
          {/if}
        </div>
      </div>

      <!-- Panel 2: Quick Templates -->
      <div class="glass-card ee-panel">
        <div class="ee-panel-head">
          <h2 class="ee-panel-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
            Template Cepat
          </h2>
          <p class="ee-panel-subtitle">Isi instan pengeluaran yang sering dilakukan.</p>
        </div>

        <div class="ee-template-list">
          {#each templates as tpl}
            <button type="button" onclick={() => applyTemplate(tpl)} class="ee-template-btn">
              <div class="ee-tpl-info">
                <span class="ee-tpl-label">{tpl.label}</span>
                <span class="ee-tpl-desc">{tpl.desc}</span>
              </div>
              <div class="ee-tpl-meta">
                <span class="ee-tpl-amount">{formatRupiah(tpl.amount)}</span>
                <span class="ee-tpl-cat">{tpl.category}</span>
              </div>
            </button>
          {:else}
            <p class="ee-empty-text">Belum ada template kustom. Anda bisa menambahkannya di Pengaturan.</p>
          {/each}
        </div>
      </div>

      <!-- Panel 3: Today's Expenses -->
      <div class="glass-card ee-panel">
        <div class="ee-panel-head-row">
          <div>
            <h2 class="ee-panel-title">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Pengeluaran Hari Ini
            </h2>
            <p class="ee-panel-subtitle">Daftar pengeluaran yang tercatat hari ini.</p>
          </div>
          <span class="ee-today-total">{formatRupiah(todayTotalExpense)}</span>
        </div>

        <div class="ee-today-list">
          {#each todayExpenses as tx (tx.id)}
            <div class="ee-today-item animate-fade-in">
              <div class="ee-today-info">
                <span class="ee-today-desc">{tx.description}</span>
                <div class="ee-today-meta">
                  <span class="ee-today-cat" style="color: {getCategoryColor(tx.category)}; border-color: {getCategoryColor(tx.category)}">{tx.category || 'Lainnya'}</span>
                  <span class="ee-today-method">({tx.payment_method})</span>
                </div>
              </div>
              <div class="ee-today-actions">
                <span class="ee-today-amount">-{formatRupiah(tx.amount)}</span>
                <button onclick={() => deleteTx(tx.id)} type="button" class="ee-btn-del-tx" title="Hapus">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.34 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
              </div>
            </div>
          {:else}
            <div class="ee-empty-today">Belum ada pengeluaran dicatat hari ini.</div>
          {/each}
        </div>
      </div>

    </div>
  </div>
</div>

<style>
  /* ── Page Layout ── */
  .ee-page {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* ── Header – Unified ── */

  /* ── Main Two-Column Layout ── */
  .ee-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  @media (min-width: 1024px) {
    .ee-layout {
      grid-template-columns: 1fr 340px;
    }
  }

  @media (min-width: 1280px) {
    .ee-layout {
      grid-template-columns: 1fr 360px;
    }
  }

  /* ── Sidebar col stacks on tablet/mobile ── */
  .ee-sidebar-col {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* On tablet (md), show sidebar panels side by side */
  @media (min-width: 640px) and (max-width: 1023px) {
    .ee-sidebar-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    /* Third panel spans full width on tablet */
    .ee-sidebar-col > :last-child {
      grid-column: 1 / -1;
    }
  }

  /* ── Form Card ── */
  .ee-form-card {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .ee-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 1rem;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid var(--border-color);
  }

  .ee-card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-primary);
    margin: 0;
  }

  .ee-card-title svg { width: 15px; height: 15px; color: var(--color-primary); }



  /* ── Form Body ── */
  .ee-form-body {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* ── Draft Summary Banner ── */
  .ee-draft-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background: var(--color-danger-bg);
    border: 1px solid var(--color-danger-border);
    border-radius: var(--radius-lg);
    padding: 1rem 1.25rem;
    flex-wrap: wrap;
  }

  .ee-draft-label {
    display: block;
    font-size: 0.6875rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-danger);
    margin-bottom: 0.125rem;
  }

  .ee-draft-amount {
    display: block;
    font-family: var(--font-title);
    font-size: 1.75rem;
    font-weight: 900;
    color: var(--color-danger);
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  @media (min-width: 480px) {
    .ee-draft-amount { font-size: 2.15rem; }
  }

  .ee-draft-count {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-secondary);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-md);
    white-space: nowrap;
  }

  /* ── Item Table Header (Desktop) ── */
  .ee-table-head {
    display: none;
    gap: 0.75rem;
    align-items: center;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  @media (min-width: 900px) {
    .ee-table-head { display: flex; }
  }

  .ee-th {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .ee-th-desc  { flex: 3; }
  .ee-th-price { flex: 2; }
  .ee-th-cat   { flex: 2; }
  .ee-th-del   { width: 32px; }

  /* ── Items List ── */
  .ee-items-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* ── Single Item Row ── */
  .ee-item-row {
    /* Mobile: card style */
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
  }

  :root.light-theme .ee-item-row {
    background: rgba(0,0,0,0.02);
  }

  @media (min-width: 900px) {
    /* Desktop: row style */
    .ee-item-row {
      flex-direction: row;
      align-items: center;
      gap: 0.75rem;
      padding: 0;
      background: none;
      border: none;
      border-radius: 0;
    }
  }

  .ee-budget-card {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background-color: var(--bg-base);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    gap: 0.75rem;
    transition: all 0.2s;
  }
  .ee-budget-card.is-draft {
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
  }

  .ee-budget-card-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .ee-budget-cat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .ee-cat-dot {
    width: 0.625rem; height: 0.625rem; border-radius: 50%;
  }
  .ee-cat-name { font-size: 0.875rem; font-weight: 600; color: var(--text-foreground); }
  
  .ee-budget-remaining {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .ee-sisa-lbl {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
    margin-bottom: 0.1rem;
  }
  .ee-budget-remaining strong {
    font-size: 0.95rem;
    font-weight: 800;
  }

  .ee-mini-progress-bg {
    width: 100%;
    height: 6px;
    background-color: var(--border-color);
    border-radius: 10px;
    overflow: hidden;
  }
  .ee-mini-progress-bar {
    height: 100%;
    border-radius: 10px;
    transition: width 0.3s ease;
  }

  .ee-budget-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--color-muted);
    font-weight: 500;
  }

  /* Mobile-only header inside item card */
  .ee-item-mobile-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  @media (min-width: 900px) {
    .ee-item-mobile-head { display: none; }
  }

  .ee-item-num {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-primary);
  }

  .ee-btn-remove-mobile {
    background: none;
    border: none;
    color: var(--color-danger);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    transition: background 0.15s;
  }

  .ee-btn-remove-mobile:hover { background: var(--color-danger-bg); }

  /* ── Individual Fields ── */
  .ee-field { display: flex; flex-direction: column; gap: 0.25rem; }

  .ee-field-label-mobile {
    display: block;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }

  @media (min-width: 900px) {
    .ee-field-label-mobile { display: none; }

    .ee-field-desc  { flex: 3; }
    .ee-field-price { flex: 2; }
    .ee-field-cat   { flex: 2; }
  }

  /* Input with prefix */
  .ee-input-prefix-wrap {
    position: relative;
  }

  .ee-input-prefix {
    position: absolute;
    left: 0.875rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    pointer-events: none;
    z-index: 1;
  }

  .ee-input-with-prefix {
    padding-left: 2.25rem !important;
  }

  /* ── Desktop Delete Button ── */
  .ee-btn-remove-desktop {
    display: none;
    align-items: center;
    justify-content: center;
    width: 32px; height: 32px;
    background: none;
    border: none;
    color: var(--text-muted);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .ee-btn-remove-desktop:hover {
    color: var(--color-danger);
    background: var(--color-danger-bg);
  }

  .ee-btn-remove-desktop svg { width: 15px; height: 15px; }

  @media (min-width: 900px) {
    .ee-btn-remove-desktop { display: flex; }
  }

  .ee-btn-remove-placeholder {
    display: none;
    width: 32px;
    flex-shrink: 0;
  }

  @media (min-width: 900px) {
    .ee-btn-remove-placeholder { display: block; }
  }

  /* ── Add Row Button ── */
  .ee-btn-add-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 2px dashed var(--border-color-hover);
    background: none;
    color: var(--text-muted);
    border-radius: var(--radius-md);
    font-size: 0.8125rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
  }

  .ee-btn-add-row:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-glow);
  }

  .ee-btn-add-row svg { width: 15px; height: 15px; }

  /* ── Common Fields (Date & Payment) ── */
  .ee-common-fields {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  @media (min-width: 480px) {
    .ee-common-fields { grid-template-columns: 1fr 1fr; }
  }

  .ee-form-group { display: flex; flex-direction: column; gap: 0.375rem; }

  .ee-form-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  /* ── OCR Upload Zone ── */
  .ee-ocr-zone {
    position: relative;
    min-height: 130px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed var(--border-color-hover);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    transition: all 0.2s;
    overflow: hidden;
  }

  .ee-ocr-zone:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-glow);
  }

  .ee-ocr-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .ee-ocr-laser {
    position: absolute;
    inset-inline: 0;
    top: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
    box-shadow: 0 0 8px var(--color-primary);
    animation: scanLaser 2s ease-in-out infinite;
  }

  .ee-ocr-scanning,
  .ee-ocr-done,
  .ee-ocr-idle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
    z-index: 1;
  }

  .ee-ocr-status {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .ee-ocr-progress {
    font-size: 0.6875rem;
    color: var(--text-muted);
  }

  .ee-ocr-icon-success {
    width: 40px; height: 40px;
    background: var(--color-success-bg);
    border: 1px solid var(--color-success-border);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: var(--color-success);
  }

  .ee-ocr-icon-success svg { width: 20px; height: 20px; }

  .ee-ocr-filename {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--color-success);
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ee-ocr-icon-idle {
    width: 40px; height: 40px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-muted);
    transition: transform 0.2s;
  }

  .ee-ocr-zone:hover .ee-ocr-icon-idle { transform: scale(1.1); }

  .ee-ocr-icon-idle svg { width: 20px; height: 20px; }

  .ee-ocr-hint-title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .ee-ocr-hint {
    font-size: 0.6875rem;
    color: var(--text-muted);
  }

  /* ── Spinner ── */
  .ee-spinner {
    width: 36px; height: 36px;
    border: 3px solid var(--border-color);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
  }

  .ee-spinner-sm {
    width: 16px; height: 16px;
    border-width: 2px;
    border-color: rgba(255,255,255,0.3);
    border-top-color: #fff;
  }

  /* ── Form Actions & Buttons ── */
  .ee-form-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .ee-btn-cancel {
    padding: 0.875rem 1.5rem;
    border-radius: var(--radius-lg);
    font-weight: 700;
    font-size: 0.9375rem;
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .ee-btn-cancel:hover:not(:disabled) {
    background: var(--bg-card);
    border-color: var(--border-color-hover);
  }

  .ee-btn-cancel:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .ee-btn-submit {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border-radius: var(--radius-lg);
    font-weight: 700;
    font-size: 0.9375rem;
    color: #fff;
    background: linear-gradient(135deg, var(--color-primary), #7c3aed);
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(99,102,241,0.25);
    transition: all 0.2s;
  }

  .ee-btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99,102,241,0.35);
  }

  .ee-btn-submit:active:not(:disabled) { transform: translateY(0); }
  .ee-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .ee-btn-submit svg { width: 16px; height: 16px; }

  /* ── Sidebar Panels ── */
  .ee-panel {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .ee-panel-head { display: flex; flex-direction: column; gap: 0.125rem; }

  .ee-panel-head-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .ee-panel-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-primary);
    margin: 0;
  }

  .ee-panel-title svg { width: 13px; height: 13px; color: var(--color-primary); flex-shrink: 0; }

  .ee-panel-subtitle {
    font-size: 0.6875rem;
    color: var(--text-muted);
    line-height: 1.4;
    margin-top: 0.125rem;
  }

  /* ── Budget List ── */
  .ee-budget-list { display: flex; flex-direction: column; gap: 0.375rem; }

  .ee-budget-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.625rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-color);
    background: rgba(255,255,255,0.02);
    transition: all 0.15s;
  }

  .ee-budget-row.is-draft {
    border-color: rgba(99, 102, 241, 0.3);
    background: var(--color-primary-glow);
  }

  :root.light-theme .ee-budget-row { background: rgba(0,0,0,0.02); }
  :root.light-theme .ee-budget-row.is-draft { background: rgba(99, 102, 241, 0.06); }

  .ee-budget-cat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .ee-cat-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .ee-cat-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ee-budget-amount {
    font-size: 0.8125rem;
    font-weight: 800;
    color: var(--text-primary);
    flex-shrink: 0;
  }

  /* ── Templates ── */
  .ee-template-list { display: flex; flex-direction: column; gap: 0.375rem; }

  .ee-template-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.625rem 0.75rem;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    width: 100%;
  }

  :root.light-theme .ee-template-btn { background: rgba(0,0,0,0.02); }

  .ee-template-btn:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-glow);
  }

  .ee-template-btn:active { transform: scale(0.99); }

  .ee-tpl-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .ee-tpl-label {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ee-tpl-desc {
    font-size: 0.6875rem;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ee-tpl-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.125rem;
    flex-shrink: 0;
  }

  .ee-tpl-amount {
    font-size: 0.8125rem;
    font-weight: 800;
    color: var(--color-primary);
    white-space: nowrap;
  }

  .ee-tpl-cat {
    font-size: 0.5625rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-muted);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 0.05rem 0.3rem;
    background: var(--bg-card);
  }

  /* ── Today's List ── */
  .ee-today-total {
    font-size: 0.875rem;
    font-weight: 800;
    color: var(--color-danger);
    background: var(--color-danger-bg);
    border: 1px solid var(--color-danger-border);
    padding: 0.25rem 0.625rem;
    border-radius: 8px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .ee-today-list {
    max-height: 240px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .ee-today-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.625rem 0;
    border-bottom: 1px solid var(--border-color);
  }

  .ee-today-item:last-child { border-bottom: none; }

  .ee-today-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .ee-today-desc {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ee-today-meta {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .ee-today-cat {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    border: 1px solid;
    border-radius: 4px;
    padding: 0.05rem 0.3rem;
  }

  .ee-today-method {
    font-size: 0.6875rem;
    color: var(--text-muted);
  }

  .ee-today-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .ee-today-amount {
    font-size: 0.8125rem;
    font-weight: 800;
    color: var(--color-danger);
    white-space: nowrap;
  }

  .ee-btn-del-tx {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 6px;
    transition: all 0.15s;
    opacity: 0;
  }

  .ee-today-item:hover .ee-btn-del-tx { opacity: 1; }

  /* always show delete on mobile/touch */
  @media (max-width: 767px) {
    .ee-btn-del-tx { opacity: 1; }
  }

  .ee-btn-del-tx:hover {
    color: var(--color-danger);
    background: var(--color-danger-bg);
  }

  .ee-btn-del-tx svg { width: 14px; height: 14px; }

  /* ── Misc ── */
  .ee-empty-text {
    font-size: 0.8125rem;
    color: var(--text-muted);
    text-align: center;
    padding: 1rem 0;
  }

  .ee-empty-today {
    font-size: 0.8125rem;
    color: var(--text-muted);
    text-align: center;
    padding: 2rem 0;
  }
</style>
