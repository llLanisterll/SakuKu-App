<script>
  import { ui } from '../lib/store.svelte.js';

  function handleCancel() {
    ui.closeConfirmation();
  }

  function handleConfirm() {
    if (ui.confirmation.onConfirm) {
      ui.confirmation.onConfirm();
    }
  }
</script>

{#if ui.confirmation.isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-overlay" onclick={handleCancel}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-card animate-scale-in" onclick={e => e.stopPropagation()}>
      <div class="modal-header">
        <h3 class="modal-title">{ui.confirmation.title}</h3>
      </div>
      <div class="modal-body">
        <p class="modal-message">{ui.confirmation.message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={handleCancel}>Batal</button>
        <button class="btn btn-{ui.confirmation.type === 'danger' ? 'danger' : 'primary'}" onclick={handleConfirm}>
          {ui.confirmation.confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  .modal-card {
    background-color: var(--bg-sidebar);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    width: 100%;
    max-width: 440px;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  .modal-header {
    padding: 1.5rem 1.5rem 0.5rem;
  }

  .modal-title {
    font-size: 1.125rem;
    font-weight: 700;
  }

  .modal-body {
    padding: 0.5rem 1.5rem 1.5rem;
  }

  .modal-message {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    background-color: rgba(255, 255, 255, 0.02);
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  :root.light-theme .modal-footer {
    background-color: rgba(0, 0, 0, 0.01);
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-scale-in {
    animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
