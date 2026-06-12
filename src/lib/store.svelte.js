import { supabase } from './supabase.js';

export const CATEGORY_COLORS = [
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Sky', hex: '#0ea5e9' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Slate', hex: '#64748b' }
];

const isBrowser = typeof window !== 'undefined';

class UiState {
  currentTab = $state('dashboard');
  notifications = $state([]);
  isLoading = $state(false); // NEW: Global loading state
  confirmation = $state({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Konfirmasi',
    type: 'primary',
    onConfirm: null
  });

  addNotification(message, type = 'info') {
    const id = Math.random().toString();
    this.notifications.push({ id, message, type });
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
    }, 4000);
  }

  askConfirmation(options) {
    this.confirmation = {
      isOpen: true,
      title: options.title || 'Konfirmasi',
      message: options.message || 'Apakah Anda yakin?',
      confirmText: options.confirmText || 'Ya',
      type: options.type || 'primary',
      onConfirm: () => {
        if (options.onConfirm) options.onConfirm();
        this.closeConfirmation();
      }
    };
  }

  closeConfirmation() {
    this.confirmation.isOpen = false;
  }
}

export const ui = new UiState();

class AuthState {
  currentUser = $state(null);
  transactions = $state([]);
  categories = $state([]);
  templates = $state([]);

  constructor() {
    if (isBrowser) {
      this.initAuth();
    }
  }

  async initAuth() {
    ui.isLoading = true;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await this.handleSession(session.user);
    }
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await this.handleSession(session.user);
      } else {
        this.logoutLocal();
      }
    });
    ui.isLoading = false;
  }

  async handleSession(user) {
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      this.currentUser = { 
        id: user.id, 
        email: user.email, 
        username: profile.username, 
        theme: profile.theme, 
        isSuperAdmin: profile.is_superadmin 
      };
      
      this.applyTheme(profile.theme);

      if (profile.is_superadmin) {
        ui.currentTab = 'admin-dashboard';
      } else {
        await this.loadUserData();
        if (ui.currentTab === 'admin-dashboard') ui.currentTab = 'dashboard';
      }
    }
  }

  async loadUserData() {
    if (!this.currentUser) return;
    ui.isLoading = true;

    try {
      // Fetch concurrently
      const [txRes, catRes, tplRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('created_at', { ascending: true }),
        supabase.from('templates').select('*').order('created_at', { ascending: true })
      ]);

      if (txRes.error) throw txRes.error;
      if (catRes.error) throw catRes.error;
      if (tplRes.error) throw tplRes.error;

      this.transactions = txRes.data;
      this.categories = catRes.data;
      this.templates = tplRes.data;

    } catch (e) {
      console.error("Error loading data", e);
      ui.addNotification("Gagal memuat data dari server.", "error");
    } finally {
      ui.isLoading = false;
    }
  }

  applyTheme(theme) {
    if (!isBrowser) return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
  }

  async register(email, password, username) {
    ui.isLoading = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username } // Will be captured by SQL trigger
        }
      });
      if (error) throw error;
      if (data.session) {
        await this.handleSession(data.session.user);
      }
    } finally {
      ui.isLoading = false;
    }
  }

  async login(email, password) {
    ui.isLoading = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Session handled by onAuthStateChange
    } finally {
      ui.isLoading = false;
    }
  }

  async logout() {
    ui.isLoading = true;
    await supabase.auth.signOut();
    this.logoutLocal();
    ui.isLoading = false;
  }

  logoutLocal() {
    this.currentUser = null;
    this.transactions = [];
    this.categories = [];
    this.templates = [];
    if (isBrowser) {
      document.documentElement.classList.remove('light-theme');
    }
    ui.currentTab = 'dashboard';
  }

  async toggleTheme() {
    if (!this.currentUser) return;
    const newTheme = this.currentUser.theme === 'dark' ? 'light' : 'dark';
    
    // Update local state early for better UX
    this.currentUser.theme = newTheme;
    this.applyTheme(newTheme);

    const { error } = await supabase.from('profiles').update({ theme: newTheme }).eq('id', this.currentUser.id);
    if (error) {
      // Revert if error
      this.currentUser.theme = newTheme === 'dark' ? 'light' : 'dark';
      this.applyTheme(this.currentUser.theme);
      ui.addNotification('Gagal mengubah tema', 'error');
    }
  }

  // Transactions
  async addTransaction(txData) {
    if (!this.currentUser) return;
    ui.isLoading = true;
    try {
      const newTx = {
        user_id: this.currentUser.id,
        description: txData.description,
        amount: Number(txData.amount),
        type: txData.type || 'expense',
        category: txData.category,
        date: txData.date,
        payment_method: txData.payment_method || 'Tunai'
      };

      const { data, error } = await supabase.from('transactions').insert([newTx]).select().single();
      if (error) throw error;

      // Update local state
      this.transactions = [data, ...this.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
      console.error(e);
      throw new Error('Gagal menambah transaksi');
    } finally {
      ui.isLoading = false;
    }
  }

  async deleteTransaction(id) {
    if (!this.currentUser) return;
    ui.isLoading = true;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      this.transactions = this.transactions.filter(t => t.id !== id);
    } catch (e) {
      console.error(e);
      ui.addNotification('Gagal menghapus transaksi', 'error');
    } finally {
      ui.isLoading = false;
    }
  }

  // Categories
  async addCategory(name, type = 'expense', color) {
    if (!this.currentUser) return;
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Nama kategori tidak boleh kosong');
    
    const exists = this.categories.find(c => c.name.toLowerCase() === cleanName.toLowerCase() && c.type === type);
    if (exists) throw new Error('Kategori dengan nama tersebut sudah ada di tipe yang sama');

    ui.isLoading = true;
    try {
      const newCat = {
        user_id: this.currentUser.id,
        name: cleanName,
        type: type,
        color: color || '#64748b'
      };

      const { data, error } = await supabase.from('categories').insert([newCat]).select().single();
      if (error) throw error;
      this.categories = [...this.categories, data];
    } catch(e) {
      console.error(e);
      throw new Error('Gagal menambah kategori');
    } finally {
      ui.isLoading = false;
    }
  }

  async deleteCategory(id) {
    if (!this.currentUser) return;
    const cat = this.categories.find(c => c.id === id);
    if (cat && cat.name.toLowerCase() === 'lainnya') {
      throw new Error('Kategori "Lainnya" tidak dapat dihapus');
    }
    ui.isLoading = true;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      this.categories = this.categories.filter(c => c.id !== id);
    } catch(e) {
      console.error(e);
      throw new Error('Gagal menghapus kategori');
    } finally {
      ui.isLoading = false;
    }
  }

  // Templates
  async addTemplate(tplData) {
    if (!this.currentUser) return;
    ui.isLoading = true;
    try {
      const newTpl = {
        user_id: this.currentUser.id,
        label: tplData.label.trim(),
        desc: tplData.desc.trim(),
        category: tplData.category,
        amount: Number(tplData.amount) || 0,
        qty: Number(tplData.qty) || 1,
        payment: tplData.payment || 'Tunai'
      };

      const { data, error } = await supabase.from('templates').insert([newTpl]).select().single();
      if (error) throw error;
      this.templates = [...this.templates, data];
    } catch(e) {
      console.error(e);
      throw new Error('Gagal menambah template');
    } finally {
      ui.isLoading = false;
    }
  }

  async updateTemplate(id, tplData) {
    if (!this.currentUser) return;
    ui.isLoading = true;
    try {
      const updateData = {
        label: tplData.label.trim(),
        desc: tplData.desc.trim(),
        category: tplData.category,
        amount: Number(tplData.amount) || 0,
        qty: Number(tplData.qty) || 1,
        payment: tplData.payment || 'Tunai'
      };

      const { data, error } = await supabase.from('templates').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      
      this.templates = this.templates.map(t => t.id === id ? data : t);
    } catch(e) {
      console.error(e);
      throw new Error('Gagal menyimpan template');
    } finally {
      ui.isLoading = false;
    }
  }

  async deleteTemplate(id) {
    if (!this.currentUser) return;
    ui.isLoading = true;
    try {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) throw error;
      this.templates = this.templates.filter(t => t.id !== id);
    } catch(e) {
      console.error(e);
      ui.addNotification('Gagal menghapus template', 'error');
    } finally {
      ui.isLoading = false;
    }
  }

  // Profile & Data Management
  async updateProfile(data) {
    if (!this.currentUser) return;
    ui.isLoading = true;
    try {
      if (data.newPassword) {
        const { error } = await supabase.auth.updateUser({ password: data.newPassword });
        if (error) throw error;
      }
      
      if (data.newUsername && data.newUsername !== this.currentUser.username) {
        const { error } = await supabase.from('profiles').update({ username: data.newUsername }).eq('id', this.currentUser.id);
        if (error) throw error;
        this.currentUser.username = data.newUsername;
      }
    } catch (e) {
      console.error(e);
      throw new Error('Gagal memperbarui profil');
    } finally {
      ui.isLoading = false;
    }
  }

  async resetData() {
    if (!this.currentUser) return;
    ui.isLoading = true;
    try {
      // Menghapus dari Supabase
      await Promise.all([
        supabase.from('transactions').delete().eq('user_id', this.currentUser.id),
        supabase.from('templates').delete().eq('user_id', this.currentUser.id),
        supabase.from('categories').delete().eq('user_id', this.currentUser.id)
      ]);
      
      this.transactions = [];
      this.templates = [];
      this.categories = [];
      
      // Tambahkan default categories jika perlu, tapi untuk sekarang kita biarkan kosong
      // atau biarkan user membuat baru karena Supabase tidak secara otomatis membuat default categories.
    } catch (e) {
      console.error(e);
      throw new Error('Gagal mereset data');
    } finally {
      ui.isLoading = false;
    }
  }

  // Admin Methods
  async getAllUsersData() {
    if (!this.currentUser?.isSuperAdmin) return [];
    ui.isLoading = true;
    try {
      // Karena kita hanya punya akses ke profiles dan tidak ke admin API tanpa service key,
      // Kita bisa buat query atau tampilkan data dasar saja.
      // Dalam Supabase, tabel profil berisi semua user. Tapi data transaksi di RLS dilindungi.
      // Jika Superadmin, kita harus by-pass RLS atau pakai function postgres.
      // Untuk amannya, kita panggil function RPC atau sekedar fetch profil.
      const { data: profiles, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      
      return profiles.map(p => ({
        id: p.id,
        username: p.username,
        transactionCount: 'Tersembunyi',
        totalExpense: 0
      }));
    } catch(e) {
      console.error(e);
      return [];
    } finally {
      ui.isLoading = false;
    }
  }
}

export const auth = new AuthState();
