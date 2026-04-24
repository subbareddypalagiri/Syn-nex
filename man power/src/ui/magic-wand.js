/**
 * Magic Wand UI Component - Floating Universal Version
 * April 2026 - Works on ANY input (Gemini, ChatGPT, Claude, or unknown sites)
 * Dynamically positions itself relative to the focused input element
 */

class MagicWandElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isRefining = false;
    this.statusMessage = '';
  }

  connectedCallback() {
    this.render();
    console.log('[MagicWand] ✨ Wand connected to DOM');
  }

  render() {
    const wandIcon = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 20L15 9" stroke="#bdc3c7" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M19 3L17.5 6.5L14 8L17.5 9.5L19 13L20.5 9.5L24 8L20.5 6.5L19 3Z" fill="#f1c40f"/>
        <path d="M12 4L11.2 5.8L9.4 6.6L11.2 7.4L12 9.2L12.8 7.4L14.6 6.6L12.8 5.8L12 4Z" fill="#f39c12"/>
      </svg>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block !important;
          position: fixed !important;
          z-index: 2147483647 !important;
          cursor: pointer !important;
          pointer-events: auto !important;
        }
        .wand-trigger {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 48px !important;
          height: 48px !important;
          background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%) !important;
          border-radius: 50% !important;
          box-shadow: 0 4px 12px rgba(241, 196, 15, 0.6), inset 0 -2px 4px rgba(0,0,0,0.2) !important;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        .wand-trigger:hover {
          transform: scale(1.2) rotate(-10deg) !important;
          box-shadow: 0 6px 20px rgba(241, 196, 15, 0.8), inset 0 -2px 4px rgba(0,0,0,0.2) !important;
        }
        .wand-trigger:active {
          transform: scale(0.95) !important;
        }
        .status-text {
          position: absolute !important;
          bottom: -28px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          font-size: 11px !important;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
          font-weight: bold !important;
          color: #f1c40f !important;
          white-space: nowrap !important;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8) !important;
          background: rgba(20, 20, 20, 0.95) !important;
          border: 1px solid rgba(241, 196, 15, 0.3) !important;
          padding: 3px 8px !important;
          border-radius: 4px !important;
          opacity: 0 !important;
          transition: opacity 0.3s !important;
          pointer-events: none !important;
        }
        .status-text.visible {
          opacity: 1 !important;
        }
        .status-text.error {
          color: #e74c3c !important;
          background: rgba(40, 20, 20, 0.95) !important;
          border-color: rgba(231, 76, 60, 0.3) !important;
        }
        .status-text.success {
          color: #2ecc71 !important;
          background: rgba(20, 40, 20, 0.95) !important;
          border-color: rgba(46, 204, 113, 0.3) !important;
        }
        .refining-glow {
          animation: magic-pulse 1.5s infinite alternate !important;
        }
        @keyframes magic-pulse {
          from { 
            box-shadow: 0 4px 12px rgba(241, 196, 15, 0.6), inset 0 -2px 4px rgba(0,0,0,0.2) !important;
          }
          to { 
            box-shadow: 0 8px 24px rgba(243, 156, 18, 0.9), inset 0 -2px 4px rgba(0,0,0,0.2) !important;
          }
        }
      </style>
      <div class="wand-trigger" id="wand-btn" title="Refine with Magic">
        ${wandIcon}
      </div>
      <div class="status-text" id="status-text"></div>
    `;

    // Click listener
    this.shadowRoot.querySelector('#wand-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleClick();
    });
  }

  /**
   * Handle wand click - dispatch custom event
   */
  handleClick() {
    if (this.isRefining) {
      console.log('[MagicWand] ⏳ Already refining, ignoring click');
      return;
    }

    console.log('[MagicWand] 🎯 Wand clicked! Dispatching refine event...');

    // Dispatch custom event with composed:true (pierces Shadow DOM)
    const event = new CustomEvent('refine-prompt-trigger', {
      bubbles: true,
      composed: true,
      detail: {
        platform: this.getAttribute('platform') || 'universal',
        timestamp: Date.now()
      }
    });

    // Dispatch from wand element (shadow DOM)
    this.dispatchEvent(event);

    // Also dispatch at document level for extra coverage
    document.dispatchEvent(event);

    console.log('[MagicWand] ✨ Refine event dispatched (shadow + document)');
  }

  /**
   * Set loading state with rotating glow
   */
  setLoading(isLoading) {
    this.isRefining = isLoading;
    const btn = this.shadowRoot.querySelector('.wand-trigger');

    if (isLoading) {
      btn.classList.add('refining-glow');
      this.updateStatus('Casting...', '#f1c40f', false);
    } else {
      btn.classList.remove('refining-glow');
    }
  }

  /**
   * Update status message below wand
   * @param {string} msg - Status message
   * @param {string} color - Text color (hex)
   * @param {boolean} autoHide - Auto-hide after 2.5 seconds
   */
  updateStatus(msg, color = '#f1c40f', autoHide = true) {
    const statusEl = this.shadowRoot.querySelector('#status-text');

    statusEl.textContent = msg;
    statusEl.style.color = color;

    // Add class based on color
    statusEl.classList.remove('error', 'success');
    if (color === '#e74c3c') statusEl.classList.add('error');
    if (color === '#2ecc71') statusEl.classList.add('success');

    // Show
    statusEl.classList.add('visible');

    // Auto-hide
    if (autoHide && msg) {
      setTimeout(() => {
        statusEl.classList.remove('visible');
        statusEl.textContent = '';
      }, 2500);
    }
  }

  /**
   * Update wand position (top, left coordinates)
   * Uses fixed positioning relative to viewport
   * @param {number} top - Top position in pixels
   * @param {number} left - Left position in pixels
   */
  updatePosition(top, left) {
    this.style.cssText = `
      position: fixed !important;
      top: ${top}px !important;
      left: ${left}px !important;
      z-index: 2147483647 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      cursor: pointer !important;
    `;
  }

  /**
   * Show the wand
   */
  show() {
    this.style.opacity = '1';
    this.style.visibility = 'visible';
    this.style.pointerEvents = 'auto';
  }

  /**
   * Hide the wand
   */
  hide() {
    this.style.opacity = '0.3';
    this.style.visibility = 'visible';
    this.style.pointerEvents = 'none';
  }
}

// Register custom element
const registerWand = () => {
  if (typeof window !== 'undefined' && window.customElements) {
    if (!customElements.get('ai-refiner-wand')) {
      customElements.define('ai-refiner-wand', MagicWandElement);
      console.log('[MagicWand] ✨ Wand registered successfully!');
    }
  } else {
    setTimeout(registerWand, 100);
  }
};

registerWand();
