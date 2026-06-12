import re

with open("/Users/sarhamsan/Documents/SARHAM/Expense/src/components/ExpenseEntry.svelte", "r") as f:
    old_content = f.read()

# Extract HTML and CSS
html_css = old_content.split("</script>")[1]

# Migrate Svelte 4 to Svelte 5 HTML
html_css = html_css.replace("on:click", "onclick")
html_css = html_css.replace("on:change", "onchange")
html_css = html_css.replace("on:submit", "onsubmit")
html_css = html_css.replace("$categories", "auth.categories")
html_css = html_css.replace("$transactions", "auth.transactions")

script_block = """<script>
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

  const templates = [
    { label: 'Bahan Baku Harian', desc: 'Belanja bahan baku ayam & bumbu', category: 'Bahan Baku', amount: 150000, qty: 1, payment: 'Tunai' },
    { label: 'Paper Bowl Sablon', desc: 'Paper bowl sablon logo 500 pcs', category: 'Packaging', amount: 600000, qty: 500, payment: 'Transfer Bank' },
    { label: 'Listrik & Air Toko', desc: 'Listrik & air operasional bulanan', category: 'Operasional', amount: 350000, qty: 1, payment: 'Transfer Bank' },
    { label: 'Gas LPG Operasional', desc: 'Refill gas melon LPG 3kg', category: 'Operasional', amount: 22000, qty: 1, payment: 'Tunai' }
  ];

  function todayStr() { return new Date().toISOString().split('T')[0]; }
  
  function formatRupiah(v) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
  }
  
  function formatDate(d) {
    if (!d) return '';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
  }
  
  function getCategoryStyle(catName, cats) {
    const cat = cats.find(c => c.name === catName);
    return cat ? `color: ${cat.color}; border-color: ${cat.color}` : 'color: #64748b; border-color: #64748b';
  }

  function getCategoryHex(catName, cats) {
    const cat = cats.find(c => c.name === catName);
    return cat ? cat.color : '#64748b';
  }

  const expenseCats = $derived(auth.categories.filter(c => c.type === 'expense'));

  const thisMonth = $derived.by(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const categoryUsage = $derived.by(() => {
    const usage = {};
    auth.transactions
      .filter(t => t.type === 'expense' && t.date?.startsWith(thisMonth))
      .forEach(t => {
        const cat = t.category || 'Lainnya';
        usage[cat] = (usage[cat] || 0) + Number(t.amount);
      });
    return usage;
  });

  const draftUsage = $derived.by(() => {
    const draft = {};
    items.forEach(item => {
      if (item.category && item.amount) {
        draft[item.category] = (draft[item.category] || 0) + Number(item.amount);
      }
    });
    return draft;
  });

  const totalDraftAmount = $derived(items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));

  const todayExpenses = $derived(auth.transactions.filter(t => t.type === 'expense' && t.date === todayStr()));
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
    items = [{
      description: tpl.desc,
      amount: tpl.amount,
      category: tpl.category,
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
        ui.addNotification(`Deskripsi barang #${i + 1} tidak boleh kosong!`, 'error');
        return;
      }
      if (!item.amount || Number(item.amount) <= 0) {
        ui.addNotification(`Nominal barang #${i + 1} tidak valid!`, 'error');
        return;
      }
      if (!item.category) {
        ui.addNotification(`Kategori barang #${i + 1} belum dipilih!`, 'error');
        return;
      }
    }

    formLoading = true;
    try {
      items.forEach((item, idx) => {
        auth.addTransaction({
          id: (Date.now() + idx).toString(),
          description: item.description.trim(),
          amount: Number(item.amount),
          category: item.category || 'Operasional',
          date: formDate,
          quantity: Number(item.quantity) || 1,
          payment_method: formPayment
        });
      });

      ui.addNotification(`${items.length} item pengeluaran berhasil disimpan!`, 'success');
      
      items = [{ description: '', amount: '', category: '', quantity: 1 }];
      formDate = todayStr();
      selectedFileName = '';
    } catch(e) {
      ui.addNotification('Gagal menyimpan: ' + e.message, 'error');
    } finally {
      formLoading = false;
    }
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
        ui.addNotification("Gagal memuat engine OCR Tesseract: " + err.message, "error");
        isScanning = false;
        return;
      }
    }
    
    ocrStatusText = 'Menginisialisasi pemindaian...';
    scanProgress = 15;
    
    try {
      const imageUrl = URL.createObjectURL(file);
      
      const { data: { text } } = await window.Tesseract.recognize(
        imageUrl,
        'ind',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              ocrStatusText = `Mengekstrak teks struk... ${Math.round(m.progress * 100)}%`;
              scanProgress = 15 + Math.round(m.progress * 85);
            } else {
              ocrStatusText = `${m.status === 'loading tesseract api' ? 'Memuat Engine OCR' : m.status}...`;
              scanProgress = Math.min(scanProgress + 1, 15);
            }
          }
        }
      );
      
      parseOcrText(text, file.name);
      URL.revokeObjectURL(imageUrl);
    } catch (err) {
      console.error("OCR Error:", err);
      ui.addNotification("Gagal memindai struk: " + err.message, "error");
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
      script.onerror = () => reject(new Error("Gagal mengunduh script Tesseract.js"));
      document.head.appendChild(script);
    });
  }

  function parseOcrText(text, fileName) {
    if (!text || text.trim().length === 0) {
      ui.addNotification("Teks tidak terbaca.", "error");
      return;
    }

    const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
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
    if (!detectedStore) detectedStore = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    const cleanStore = detectedStore.replace(/^(welcome to|selamat datang di|kasir|outlet)\s+/i, '');

    const dateRegexes = [
      /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,
      /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/
    ];
    let dateFound = false;
    for (const r of dateRegexes) {
      const match = text.match(r);
      if (match) {
        if (match[3].length === 4) {
          formDate = `${match[3]}-${match[2]}-${match[1]}`;
        } else {
          formDate = match[0];
        }
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

    const skipKeywords = ['total', 'grand', 'subtotal', 'sub', 'pajak', 'tax', 'diskon', 'discount', 'kembalian', 'change', 'cash', 'tunai', 'bayar', 'kembali', 'telp', 'alamat', 'jl.', 'jalan', 'welcome', 'selamat', 'promo', 'member', 'kartu', 'merchant', 'npwp', 'operator', 'kasir'];
    
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
            const foodKeywords = ['ayam', 'beras', 'cabai', 'bawang', 'minyak', 'telur', 'sayur', 'daging', 'bumbu', 'kecap', 'saus', 'gula', 'garam'];
            const packagingKeywords = ['cup', 'box', 'kemasan', 'plastik', 'mika', 'sendok', 'garpu', 'sedotan', 'sablon', 'paper bowl'];
            
            const lowerName = name.toLowerCase();
            if (foodKeywords.some(kw => lowerName.includes(kw))) {
              cat = 'Bahan Baku';
            } else if (packagingKeywords.some(kw => lowerName.includes(kw))) {
              cat = 'Packaging';
            }
            
            const exists = expenseCats.some(c => c.name.toLowerCase() === cat.toLowerCase());
            const finalCat = exists 
              ? expenseCats.find(c => c.name.toLowerCase() === cat.toLowerCase()).name 
              : '';

            parsedItems.push({
              description: name,
              amount: price,
              category: finalCat,
              quantity: qty
            });
          }
        }
      }
    });

    if (parsedItems.length > 0) {
      items = parsedItems;
      ui.addNotification(`OCR Sukses! Berhasil memindai ${parsedItems.length} item barang dari struk`, 'success');
    } else {
      let totalAmount = 0;
      let maxNumberFound = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (['total', 'jumlah', 'grand', 'bayar'].some(w => line.includes(w))) {
          const numberMatches = line.replace(/[^0-9]/g, '');
          const amount = parseInt(numberMatches, 10);
          if (amount >= 1000 && amount <= 5000000) {
            totalAmount = amount;
            break;
          }
        }
      }
      
      if (totalAmount === 0) {
        lines.forEach(line => {
          const parsedLine = line.replace(/(\d+)[.,](\d{3})/g, '$1$2');
          const matches = parsedLine.match(/\\b\d{4,7}\\b/g);
          if (matches) {
            matches.forEach(m => {
              const val = parseInt(m, 10);
              if (val > maxNumberFound && val >= 1000 && val <= 5000000) {
                maxNumberFound = val;
              }
            });
          }
        });
        totalAmount = maxNumberFound;
      }
      
      const defaultCat = expenseCats.length > 0 ? expenseCats[0].name : 'Operasional';
      items = [{
        description: `Belanja di ${cleanStore}`,
        amount: totalAmount > 0 ? totalAmount : '',
        category: defaultCat,
        quantity: 1
      }];
      ui.addNotification(`OCR Sukses! Berhasil membaca total belanja dari ${cleanStore}`, 'success');
    }
  }

  async function deleteTx(id) {
    ui.askConfirmation({
      title: 'Hapus Transaksi',
      message: 'Apakah Anda yakin ingin menghapus catatan transaksi ini?',
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try { 
          auth.deleteTransaction(id); 
          ui.addNotification('Transaksi dihapus!', 'success');
        } catch(e) { 
          ui.addNotification('Gagal: ' + e.message, 'error'); 
        }
      }
    });
  }
</script>
"""

with open("/Users/sarhamsan/Documents/SARHAM/Pengeluaran/src/components/ExpenseEntry.svelte", "w") as f:
    f.write(script_block + html_css)

