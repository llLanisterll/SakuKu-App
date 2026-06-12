<script>
  import { ui } from '../lib/store.svelte.js';
  import { onMount } from 'svelte';

  let inputVal = $state('');
  let inputEl;

  // Sync state when prompt opens
  $effect(() => {
    if (ui.prompt.isOpen) {
      inputVal = ui.prompt.defaultValue || '';
      // Focus element in next tick
      setTimeout(() => {
        if (inputEl) inputEl.focus();
      }, 10);
    }
  });

  function handleCancel() {
    if (ui.prompt.onCancel) {
      ui.prompt.onCancel();
    } else {
      ui.closePrompt();
    }
  }

  function handleConfirm(e) {
    if (e) e.preventDefault();
    if (ui.prompt.onConfirm) {
      ui.prompt.onConfirm(inputVal);
    } else {
      ui.closePrompt();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      handleCancel();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if ui.prompt.isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-overlay" onclick={handleCancel}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-card animate-scale-in" onclick={e => e.stopPropagation()}>
      <div class="modal-header">
        <h3 class="modal-title">{ui.prompt.title}</h3>
      </div>
      
      <form onsubmit={handleConfirm}>
        <div class="modal-body">
          {#if ui.prompt.message}
            <p class="modal-message">{ui.prompt.message}</p>
          {/if}
          <input 
            type={ui.prompt.type || 'text'} 
            bind:value={inputVal} 
            bind:this={inputEl}
            class="prompt-input" 
            placeholder="Ketik di sini..."
            required 
          />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick={handleCancel}>Batal</button>
          <button type="submit" class="btn btn-primary">{ui.prompt.confirmText}</button>
        </div>
      </form>
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
    margin-bottom: 1rem;
  }

  .prompt-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background-color: var(--color-background);
    color: var(--text-foreground);
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .prompt-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-glow);
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
