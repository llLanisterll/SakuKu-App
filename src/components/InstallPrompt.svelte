<script>
  import { onMount } from 'svelte';

  let deferredPrompt = $state(null);
  let showPrompt = $state(false);
  let isIOS = $state(false);

  onMount(() => {
    // 1. Cek apakah di iOS dan belum di-install
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    // Jika sudah di-install, kita hentikan
    if (isStandalone) return;

    if (isIOSDevice) {
      isIOS = true;
      // Jangan terlalu sering muncul di iOS, cek localStorage (munculkan sekali saja per 3 hari)
      const lastPrompt = localStorage.getItem('sakuku_ios_prompt');
      const now = new Date().getTime();
      if (!lastPrompt || now - parseInt(lastPrompt) > 259200000) {
        setTimeout(() => { showPrompt = true; }, 3000); // Muncul setelah 3 detik
      }
    }

    // 2. Tangkap event beforeinstallprompt (Android / Chrome Desktop)
    window.addEventListener('beforeinstallprompt', (e) => {
      // Cegah Chrome agar tidak memunculkan prompt mini miliknya sendiri
      e.preventDefault();
      // Simpan event sehingga bisa dipanggil nanti
      deferredPrompt = e;
      // Tampilkan UI custom kita
      setTimeout(() => { showPrompt = true; }, 2000);
    });
  });

  async function handleInstall() {
    if (!deferredPrompt) return;
    
    // Tampilkan prompt bawaan
    deferredPrompt.prompt();
    
    // Tunggu respon pengguna
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    }
    
    deferredPrompt = null;
    showPrompt = false;
  }

  function handleDismiss() {
    showPrompt = false;
    if (isIOS) {
      localStorage.setItem('sakuku_ios_prompt', new Date().getTime().toString());
    }
  }
</script>

{#if showPrompt}
  <div class="install-prompt-overlay animate-fade-in">
    <div class="install-prompt-card slide-up">
      <button class="btn-close" onclick={handleDismiss} aria-label="Tutup">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="prompt-content">
        <div class="app-icon-preview">
          <img src="/pwa-192x192.png" alt="SakuKu Icon" />
        </div>
        
        <div class="prompt-text">
          <h3>Instal Aplikasi SakuKu</h3>
          <p>
            {#if isIOS}
              Tambahkan aplikasi ke layar utama untuk pengalaman akses yang cepat, layar penuh, dan fitur offline!
            {:else}
              Dapatkan akses instan, notifikasi cerdas, dan fitur offline dengan menginstal aplikasi ini ke perangkat Anda.
            {/if}
          </p>
        </div>
      </div>

      {#if isIOS}
        <div class="ios-instruction">
          <p>Ketuk tombol <strong>Share</strong> ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> ) di bawah, lalu gulir dan pilih <br/><span class="highlight-action">"Add to Home Screen"</span></p>
        </div>
      {:else}
        <button class="btn-install" onclick={handleInstall}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Instal Sekarang
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .install-prompt-overlay {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    padding: 1rem;
    z-index: 9999;
    display: flex;
    justify-content: center;
    pointer-events: none; /* Let clicks pass through background */
  }

  @media (min-width: 640px) {
    .install-prompt-overlay {
      top: 0;
      align-items: flex-end;
      padding-bottom: 2rem;
    }
  }

  .install-prompt-card {
    pointer-events: auto; /* Enable clicks on card */
    position: relative;
    background: rgba(30, 30, 30, 0.75);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 1.5rem;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
    color: white;
  }

  /* Light Theme Adjustments */
  :global(:root.light-theme) .install-prompt-card {
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.8) inset;
    color: #111827;
  }

  .slide-up {
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .btn-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 28px; height: 28px;
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 50%;
    color: inherit;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
  }

  :global(:root.light-theme) .btn-close { background: rgba(0,0,0,0.05); }

  .btn-close:hover { background: rgba(255,255,255,0.2); }
  :global(:root.light-theme) .btn-close:hover { background: rgba(0,0,0,0.1); }
  
  .btn-close svg { width: 14px; height: 14px; }

  .prompt-content {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-bottom: 1.25rem;
    margin-top: 0.5rem;
  }

  .app-icon-preview {
    width: 64px; height: 64px;
    flex-shrink: 0;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.1);
  }

  .app-icon-preview img {
    width: 100%; height: 100%;
    object-fit: cover;
  }

  .prompt-text h3 {
    margin: 0;
    font-size: 1.125rem;
    font-family: var(--font-title, sans-serif);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 0.375rem;
  }

  .prompt-text p {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.4;
    opacity: 0.8;
  }

  .btn-install {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--color-primary, #6366f1), #8b5cf6);
    color: white;
    font-size: 0.9375rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
  }

  .btn-install:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(99, 102, 241, 0.5);
  }

  .btn-install:active {
    transform: translateY(0);
  }

  .btn-install svg { width: 18px; height: 18px; }

  .ios-instruction {
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    padding: 1rem;
    text-align: center;
    font-size: 0.8125rem;
    border: 1px dashed rgba(255,255,255,0.2);
  }

  :global(:root.light-theme) .ios-instruction {
    background: rgba(0,0,0,0.02);
    border-color: rgba(0,0,0,0.1);
  }

  .ios-instruction p { margin: 0; line-height: 1.5; opacity: 0.9; }
  
  .ios-instruction svg {
    display: inline-block;
    width: 16px; height: 16px;
    vertical-align: text-bottom;
    color: #3b82f6; /* Safari blue */
  }

  .highlight-action {
    display: inline-block;
    margin-top: 0.5rem;
    font-weight: 700;
    color: var(--color-primary, #6366f1);
    background: var(--color-primary-glow, rgba(99,102,241,0.1));
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
  }
</style>
