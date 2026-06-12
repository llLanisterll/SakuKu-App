<script>
  import { ui } from '../lib/store.svelte.js';

  function dismiss(id) {
    ui.notifications = ui.notifications.filter(n => n.id !== id);
  }
</script>

<div class="notification-container">
  {#each ui.notifications as notif (notif.id)}
    <div class="toast animate-slide-in {notif.type}">
      <div class="toast-icon">
        {#if notif.type === 'success'}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.8-11.2a1 1 0 00-1.6-1.2L9 9.58 7.8 8.38a1 1 0 10-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clip-rule="evenodd" />
          </svg>
        {:else if notif.type === 'error'}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        {/if}
      </div>
      <div class="toast-message">{notif.message}</div>
      <button class="toast-dismiss" onclick={() => dismiss(notif.id)} title="Tutup" aria-label="Tutup notifikasi">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      <div class="toast-progress {notif.type}"></div>
    </div>
  {/each}
</div>

<style>
  .notification-container {
    position: fixed;
    /* Di atas bottom nav mobile (bottom nav ~56px + sedikit margin) */
    bottom: 72px;
    right: 16px;
    left: 16px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }

  @media (min-width: 1024px) {
    .notification-container {
      bottom: 24px;
      right: 24px;
      left: auto;
      width: 380px;
    }
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0.875rem 0.875rem 0.875rem 1rem;
    border-radius: 14px;
    background: rgba(15, 23, 42, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.35), 0 2px 8px -2px rgba(0,0,0,0.2);
    color: #f3f4f6;
    position: relative;
    overflow: hidden;
    pointer-events: all;
  }

  :root.light-theme .toast {
    background: rgba(255, 255, 255, 0.97);
    border: 1px solid rgba(0, 0, 0, 0.07);
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.1);
    color: #0f172a;
  }

  .toast.success { border-left: 3px solid var(--color-success); }
  .toast.success .toast-icon { color: var(--color-success); }

  .toast.error { border-left: 3px solid var(--color-danger); }
  .toast.error .toast-icon { color: var(--color-danger); }

  .toast.info { border-left: 3px solid var(--color-primary); }
  .toast.info .toast-icon { color: var(--color-primary); }

  .toast-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .toast-message {
    font-size: 0.8125rem;
    font-weight: 500;
    flex-grow: 1;
    line-height: 1.4;
  }

  /* Dismiss button */
  .toast-dismiss {
    background: none;
    border: none;
    cursor: pointer;
    color: currentColor;
    opacity: 0.4;
    padding: 2px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s, background 0.15s;
  }

  .toast-dismiss:hover {
    opacity: 1;
    background: rgba(255,255,255,0.1);
  }

  :root.light-theme .toast-dismiss:hover {
    background: rgba(0,0,0,0.06);
  }

  .toast-dismiss svg {
    width: 14px;
    height: 14px;
  }

  /* Progress bar */
  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 100%;
    animation: shrink 4s linear forwards;
    border-radius: 0 0 14px 14px;
  }

  .toast-progress.success { background: var(--color-success); }
  .toast-progress.error { background: var(--color-danger); }
  .toast-progress.info { background: var(--color-primary); }

  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .animate-slide-in {
    animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
