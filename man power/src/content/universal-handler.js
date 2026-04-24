/**
 * Universal Handler - Framework-Agnostic Input Detection
 * Works on ANY website with contenteditable or textarea inputs
 * Uses PURE NATIVE DIV with Shadow DOM (no Web Components)
 * Manifest V3 compatible - no customElements.define() required
 */

class UniversalHandler {
  constructor() {
    this.activeInput = null;
    this.currentTarget = null;  // Cached target for focus locking
    this.isMonitoring = false;
    this.wandContainer = null;
    this.shadowRoot = null;
    this.positioningInterval = null;
    this.lastPositionX = null;   // Track last position to avoid unnecessary updates
    this.lastPositionY = null;
  }

  /**
   * Start monitoring all inputs on the page
   * This replaces all site-specific detection logic
   */
  async init() {
    console.log('[UniversalHandler] 🚀 Initializing universal input detection (Pure Native DIV)...');

    // Create wand first (must exist before focus listener references it)
    this.createNativeWand();

    // Setup global wand click listener (capture phase for Shadow DOM)
    this.setupWandClickListener();

    // Install global focus listener
    this.setupFocusListener();

    // Monitor for new inputs added to DOM
    this.setupMutationObserver();

    // Try to find already-focused input
    this.detectActiveInput();

    this.isMonitoring = true;
    console.log('[UniversalHandler] ✅ Universal monitoring activated - Native Div Ready');
  }

  /**
   * Get raw text from the currently active input
   * Handles nested contenteditable structures (Gemini, ChatGPT)
   * @returns {string}
   */
  getRawText() {
    const target = this.currentTarget || this.activeInput;
    if (!target) {
      console.warn('[UniversalHandler] ❌ No target (currentTarget or activeInput)');
      return '';
    }

    let rawText = '';

    // CASE 1: Native textarea or input element
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
      rawText = target.value || '';
      console.log('[UniversalHandler] 📝 Extracted from TEXTAREA/INPUT:', rawText.length, 'chars');
      return rawText;
    }

    // CASE 2: Direct contenteditable element
    if (target.contentEditable === 'true' || target.getAttribute('contenteditable') === 'true') {
      rawText = target.innerText || target.textContent || '';
      console.log('[UniversalHandler] 📝 Extracted from contenteditable:', rawText.length, 'chars');
      return rawText;
    }

    // CASE 3: Wrapper element (not directly editable) - search for contenteditable child
    // This handles Gemini/ChatGPT where the container is not editable but contains editable children
    const editableChild = target.querySelector('[contenteditable="true"]');
    if (editableChild) {
      rawText = editableChild.innerText || editableChild.textContent || '';
      console.log('[UniversalHandler] 📝 Extracted from nested contenteditable child:', rawText.length, 'chars');
      this.currentTarget = editableChild; // Update to actual editable element
      this.activeInput = editableChild; // Keep activeInput in sync
      return rawText;
    }

    // CASE 4: Try textarea inside the target
    const textarea = target.querySelector('textarea');
    if (textarea) {
      rawText = textarea.value || '';
      console.log('[UniversalHandler] 📝 Extracted from nested textarea:', rawText.length, 'chars');
      this.currentTarget = textarea;
      this.activeInput = textarea;
      return rawText;
    }

    // CASE 5: Fallback - try to get text from target itself
    rawText = target.innerText || target.textContent || '';
    console.log('[UniversalHandler] 📝 Extracted from fallback (innerText/textContent):', rawText.length, 'chars');
    return rawText;
  }

  /**
   * Set refined text in the active input with atomic operations
   * This is the core injection method - framework-agnostic
   * @param {string} text - The refined text to inject
   */
  setRefinedText(text) {
    if (!this.activeInput) {
      console.error('[UniversalHandler] ❌ No active input to refine');
      return;
    }

    console.log('[UniversalHandler] 🔧 Setting refined text (universal atomic mode):', {
      textLength: text.length,
      inputType: this.activeInput.tagName,
      contentEditable: this.activeInput.contentEditable,
    });

    try {
      // STEP 1: Focus the input
      this.activeInput.focus();
      console.log('[UniversalHandler] ✓ Step 1: Input focused');

      // STEP 2: Select all existing text
      document.execCommand('selectAll', false, null);
      console.log('[UniversalHandler] ✓ Step 2: All text selected');

      // STEP 3: Replace with new text using execCommand
      // This is NATIVE BROWSER API - future-proof against any framework
      document.execCommand('insertText', false, text);
      console.log('[UniversalHandler] ✓ Step 3: Text inserted via execCommand');

      // STEP 4: Dispatch input event (bubbles:true, composed:true)
      const inputEvent = new Event('input', {
        bubbles: true,
        composed: true,
        cancelable: true
      });
      this.activeInput.dispatchEvent(inputEvent);
      console.log('[UniversalHandler] ✓ Step 4: Input event dispatched');

      // STEP 5: Dispatch change event
      const changeEvent = new Event('change', {
        bubbles: true,
        composed: true,
        cancelable: true
      });
      this.activeInput.dispatchEvent(changeEvent);
      console.log('[UniversalHandler] ✓ Step 5: Change event dispatched');

      // STEP 6: Dispatch keyboard events to wake up frameworks
      setTimeout(() => {
        try {
          const keyEvent = new KeyboardEvent('keydown', {
            key: 'End',
            code: 'End',
            keyCode: 35,
            bubbles: true,
            composed: true,
            cancelable: true
          });
          this.activeInput.dispatchEvent(keyEvent);
          console.log('[UniversalHandler] ✓ Step 6: Keyboard event simulated');
        } catch (e) {
          console.warn('[UniversalHandler] ⚠ Keyboard event failed:', e);
        }
      }, 50);

      console.log('[UniversalHandler] ✅ Refined text injection complete!');
    } catch (error) {
      console.error('[UniversalHandler] ❌ Error setting refined text:', error);

      // Fallback: Direct assignment
      try {
        console.log('[UniversalHandler] 🔄 Attempting fallback: direct value assignment');
        if (this.activeInput.value !== undefined) {
          this.activeInput.value = text;
        } else {
          this.activeInput.innerText = text;
        }
        this.dispatchInputEvents();
        console.log('[UniversalHandler] ✅ Fallback injection successful');
      } catch (fallbackError) {
        console.error('[UniversalHandler] ❌ Fallback also failed:', fallbackError);
      }
    }
  }

  /**
   * Dispatch comprehensive input events for framework reactivity
   */
  dispatchInputEvents() {
    if (!this.activeInput) return;

    const input = this.activeInput;

    // Focus
    input.focus();
    input.dispatchEvent(new Event('focus', { bubbles: true, composed: true }));

    // Input events
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    // Keyboard simulation
    [
      new KeyboardEvent('keydown', { key: 'a', bubbles: true, composed: true }),
      new KeyboardEvent('keypress', { key: 'a', bubbles: true, composed: true }),
      new KeyboardEvent('keyup', { key: 'a', bubbles: true, composed: true }),
    ].forEach(event => {
      try {
        input.dispatchEvent(event);
      } catch (e) {
        console.warn('[UniversalHandler] Failed to dispatch keyboard event:', e);
      }
    });

    console.log('[UniversalHandler] ✅ Input events dispatched');
  }

  /**
   * Global focus listener - detects when ANY input gets focus
   */
  setupFocusListener() {
    // FOCUS event - high level detection
    document.addEventListener('focus', (e) => {
      const target = e.target;

      // Check if it's a valid input element
      if (this.isValidInput(target)) {
        if (this.activeInput !== target) {
          console.log('[UniversalHandler] 👁 Focus detected on:', {
            tagName: target.tagName,
            type: target.type || 'contenteditable',
            isContentEditable: target.contentEditable === 'true',
          });

          this.activeInput = target;
          this.currentTarget = target; // Cache target for refinement

          // Reposition wand to new input
          if (this.wandContainer) {
            this.updateWandPosition();
            this.showWand();
            this.startContinuousPositioning();
          }
        }
      }
    }, true); // Use capture phase to catch all focus events

    // BLUR event - stop positioning when input loses focus
    document.addEventListener('blur', (e) => {
      const target = e.target;
      if (this.activeInput === target && this.isValidInput(target)) {
        console.log('[UniversalHandler] 👁 Blur detected, hiding wand');
        this.activeInput = null;
        this.stopContinuousPositioning();
        this.hideWand();
      }
    }, true);

    // MOUSEDOWN event - cache the clicked element before focus fires
    // This handles nested structures where focus bubbles up from child to parent
    document.addEventListener('mousedown', (e) => {
      const target = e.target;
      
      // Cache the actual clicked element (could be nested inside wrapper)
      if (this.isValidInput(target) || this.isValidInputContainer(target)) {
        this.currentTarget = target;
        console.log('[UniversalHandler] 🖱 Mousedown cached target:', target.tagName);
      }
    }, true); // Use capture phase

    console.log('[UniversalHandler] 🎯 Global focus + blur listener + mousedown cache installed');
  }

  /**
   * Check if element is a container that holds a valid input
   * (used for mousedown caching before focus event)
   */
  isValidInputContainer(element) {
    if (!element || !element.querySelector) return false;
    
    // Check if this element contains a contenteditable or textarea
    const hasEditable = element.querySelector('[contenteditable="true"], textarea, input[type="text"]');
    return !!hasEditable;
  }

  /**
   * Global wand click listener using event delegation
   * Detects clicks on wand container, handles Shadow DOM event trapping
   * Also handles API refinement with backend
   */
  setupWandClickListener() {
    // Use mousedown with capture phase to intercept before anything else
    document.addEventListener('mousedown', (e) => {
      // Check if the click happened ON or INSIDE our wand container
      if (this.wandContainer && (e.target === this.wandContainer || this.wandContainer.contains(e.target))) {
        e.preventDefault(); // Stop focus from leaving the input
        e.stopPropagation();

        console.log('[UniversalHandler] 🎯 Native Wand clicked via Global Delegation!');

        // Trigger the refinement flow (will be handled by content-script via event)
        this.dispatchRefinementEvent();
      }
    }, true); // Use capture phase to intercept before other listeners

    console.log('[UniversalHandler] 🎯 Global wand click listener installed (capture phase)');
  }

  /**
   * Dispatch refinement trigger event for content-script to catch
   * This is still needed for the full API refinement flow
   */
  dispatchRefinementEvent() {
    console.log('[UniversalHandler] ✨ Dispatching refinement trigger event...');

    // Dispatch custom event that content-script listens for
    const event = new CustomEvent('refine-prompt-trigger', {
      bubbles: true,
      composed: true,
      detail: {
        platform: 'universal',
        timestamp: Date.now()
      }
    });

    // Dispatch from document for max compatibility
    document.dispatchEvent(event);

    console.log('[UniversalHandler] ✨ Refinement trigger event dispatched');
  }

  /**
   * Mutation observer - detects new inputs added to DOM
   */
  setupMutationObserver() {
    const observer = new MutationObserver(() => {
      // Check if currently focused element is still valid
      if (document.activeElement && this.isValidInput(document.activeElement)) {
        this.activeInput = document.activeElement;
        if (this.wandContainer) {
          this.updateWandPosition();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['contenteditable', 'aria-label'],
    });

    console.log('[UniversalHandler] 👀 Mutation observer installed');
  }

  /**
   * Check if an element is a valid input for refinement
   * @param {Element} element
   * @returns {boolean}
   */
  isValidInput(element) {
    if (!element) return false;

    // ContentEditable divs/spans
    if (element.contentEditable === 'true') {
      const rect = element.getBoundingClientRect();
      // Must be reasonably sized (not a title or small label)
      if (rect.height > 15 && rect.height < 500 && rect.width > 100) {
        return true;
      }
    }

    // Textarea elements
    if (element.tagName === 'TEXTAREA') {
      const rect = element.getBoundingClientRect();
      if (rect.height > 15 && rect.height < 500 && rect.width > 100) {
        return true;
      }
    }

    // Input elements (type: text, email, etc.)
    if (element.tagName === 'INPUT' && ['text', 'email', 'search', ''].includes(element.type)) {
      const rect = element.getBoundingClientRect();
      if (rect.height > 15 && rect.height < 100 && rect.width > 100) {
        return true;
      }
    }

    // [contenteditable] divs in shadow DOM
    if (element.getAttribute && element.getAttribute('contenteditable') === 'true') {
      const rect = element.getBoundingClientRect();
      if (rect.height > 15 && rect.height < 500 && rect.width > 100) {
        return true;
      }
    }

    return false;
  }

  /**
   * Try to find already-focused input (on page load)
   */
  detectActiveInput() {
    const activeEl = document.activeElement;

    if (activeEl && this.isValidInput(activeEl)) {
      this.activeInput = activeEl;
      console.log('[UniversalHandler] Found already-focused input:', activeEl.tagName);
      return;
    }

    // Search for any visible input
    const inputs = document.querySelectorAll('[contenteditable="true"], textarea, input[type="text"]');
    for (const input of inputs) {
      if (this.isValidInput(input)) {
        this.activeInput = input;
        console.log('[UniversalHandler] Found input in DOM:', input.tagName);
        return;
      }
    }

    console.log('[UniversalHandler] ⏳ No input found yet - waiting for user to focus');
  }

  /**
   * Create native wand using pure DIV + Shadow DOM (no Web Components)
   * This bypasses Manifest V3 customElements context isolation issues
   */
  createNativeWand() {
    if (document.getElementById('ai-refiner-wand-root')) {
      this.wandContainer = document.getElementById('ai-refiner-wand-root');
      this.shadowRoot = this.wandContainer.shadowRoot;
      return;
    }

    // Create raw div container
    this.wandContainer = document.createElement('div');
    this.wandContainer.id = 'ai-refiner-wand-root';

    // Apply bulletproof styles directly to container
    Object.assign(this.wandContainer.style, {
      position: 'fixed',
      zIndex: '2147483647',
      display: 'none', // Hidden until focus
      pointerEvents: 'auto',
      width: '48px',
      height: '48px'
    });

    // Attach Shadow DOM to the native div
    this.shadowRoot = this.wandContainer.attachShadow({ mode: 'open' });

    // Inject styles and UI into shadow root
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block !important;
          width: 48px !important;
          height: 48px !important;
        }
        button {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 48px !important;
          height: 48px !important;
          border-radius: 50% !important;
          background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%) !important;
          border: none !important;
          cursor: pointer !important;
          box-shadow: 0 4px 12px rgba(241, 196, 15, 0.6), inset 0 -2px 4px rgba(0,0,0,0.2) !important;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
          font-size: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          user-select: none !important;
          -webkit-user-select: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        button:hover {
          transform: scale(1.2) rotate(-10deg) !important;
          box-shadow: 0 6px 20px rgba(241, 196, 15, 0.8), inset 0 -2px 4px rgba(0,0,0,0.2) !important;
        }
        button:active {
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
          z-index: 1000 !important;
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
        .refining {
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
      <button id="magic-btn" title="Refine with Magic">✨</button>
      <div class="status-text" id="status-text"></div>
    `;

    // Append to body (highest safe level before documentElement)
    document.body.appendChild(this.wandContainer);

    console.log('[UniversalHandler] ✨ Native Wand created with Shadow DOM (no Web Components)');
  }

  /**
   * Execute refinement: Extract text, send to API, inject refined version
   * Handles nested contenteditable structures (Gemini, ChatGPT)
   */
  async executeRefinement() {
    console.log('[UniversalHandler] 🔄 Starting executeRefinement...');

    const target = this.currentTarget || this.activeInput;
    if (!target) {
      console.warn('[UniversalHandler] ❌ No target found');
      this.updateStatus('No input detected', '#ef4444');
      return null;
    }

    // 1. EXTRACT TEXT DEEPLY
    let rawText = '';
    let finalTarget = target;

    // Check for nested editable first (for wrapper containers)
    const editableChild = target.querySelector('[contenteditable="true"], textarea');
    if (editableChild) {
      finalTarget = editableChild;
    }

    // Extract based on element type
    if (finalTarget.tagName === 'TEXTAREA' || finalTarget.tagName === 'INPUT') {
      rawText = finalTarget.value;
    } else {
      rawText = finalTarget.innerText || finalTarget.textContent;
    }

    // Validate extraction
    if (!rawText || rawText.trim() === '') {
      console.warn('[UniversalHandler] ❌ Extracted text is empty');
      this.updateStatus('Type something first!', '#ef4444');
      return null;
    }

    console.log('[UniversalHandler] 📤 Extracted text ready for routing:', rawText.substring(0, 50) + '...');
    
    // Return extracted text and target for content script to process
    return { text: rawText, target: finalTarget };
  }

  /**
   * Inject refined text into target element
   */
  injectRefinedText(target, refinedText) {
    if (!target) {
      console.warn('[UniversalHandler] ❌ No target for injection');
      return;
    }

    console.log('[UniversalHandler] 📥 Injecting refined text...');
    
    target.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, refinedText);

    // Wake up frameworks (Gemini/ChatGPT/Claude)
    target.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    target.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    console.log('[UniversalHandler] ✅ Text injected successfully');
    this.updateStatus('✨ Refined!', '#10b981');
  }

  /**
   * Update wand status message with toast notification
   */
  updateStatus(msg, color = '#f1c40f', autoHide = true) {
    if (!this.shadowRoot) return;

    const statusEl = this.shadowRoot.querySelector('#status-text');
    if (!statusEl) return;

    statusEl.textContent = msg;
    statusEl.style.color = color;

    // Update classes
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
   * Set loading state with pulsing animation
   */
  setLoading(isLoading) {
    if (!this.shadowRoot) return;

    const btn = this.shadowRoot.querySelector('#magic-btn');
    if (!btn) return;

    if (isLoading) {
      btn.classList.add('refining');
      this.updateStatus('Casting...', '#f1c40f', false);
    } else {
      btn.classList.remove('refining');
    }
  }

  /**
   * Update wand position based on active input
   * Uses fixed positioning with viewport-relative coordinates
   * Optimized to skip updates if position hasn't changed
   */
  updateWandPosition() {
    if (!this.activeInput || !this.wandContainer) return;

    const rect = this.activeInput.getBoundingClientRect();

    // Precision placement at bottom-right of the active input
    const top = rect.top + rect.height - 45;
    const left = rect.left + rect.width - 55;

    // Skip update if position hasn't changed (avoid unnecessary DOM updates)
    if (this.lastPositionX === left && this.lastPositionY === top) {
      return;  // Position unchanged, skip DOM update
    }

    // Cache new position
    this.lastPositionX = left;
    this.lastPositionY = top;

    // Apply position directly to container
    Object.assign(this.wandContainer.style, {
      top: `${top}px`,
      left: `${left}px`,
      display: 'block',
      opacity: '1',
      visibility: 'visible',
      pointerEvents: 'auto'
    });

    // Only log if position actually changed (reduced logging)
    console.log('[UniversalHandler] 📍 Wand repositioned:', { left, top });
  }

  /**
   * Show the wand
   */
  showWand() {
    if (this.wandContainer) {
      Object.assign(this.wandContainer.style, {
        display: 'block',
        opacity: '1',
        visibility: 'visible',
        pointerEvents: 'auto'
      });
      this.updateWandPosition();
    }
  }

  /**
   * Hide the wand
   */
  hideWand() {
    if (this.wandContainer) {
      Object.assign(this.wandContainer.style, {
        display: 'none',
        opacity: '0.3',
        visibility: 'visible',
        pointerEvents: 'none'
      });
    }
  }

  /**
   * Start continuous wand positioning (for scrolling/resizing)
   * Optimized: Only runs when input has focus, stops when blurred
   */
  startContinuousPositioning() {
    if (this.positioningInterval) return;

    this.positioningInterval = setInterval(() => {
      // Only update if input still has focus
      if (this.activeInput && this.wandContainer && document.activeElement === this.activeInput) {
        this.updateWandPosition();
      }
    }, 100); // Update every 100ms only when needed

    console.log('[UniversalHandler] 📌 Continuous positioning started');
  }

  /**
   * Stop continuous positioning
   */
  stopContinuousPositioning() {
    if (this.positioningInterval) {
      clearInterval(this.positioningInterval);
      this.positioningInterval = null;
      this.lastPositionX = null;
      this.lastPositionY = null;
      console.log('[UniversalHandler] 📌 Continuous positioning stopped');
    }
  }
}

// Export handler
window.UniversalHandler = UniversalHandler;
console.log('[UniversalHandler] Module loaded and ready');
