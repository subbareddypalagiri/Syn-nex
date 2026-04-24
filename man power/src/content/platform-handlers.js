/**
 * Platform Handler Architecture
 * Base class + specific implementations for Gemini, ChatGPT, Claude
 */

class BaseHandler {
  constructor() {
    this.inputBox = null;
    this.isReady = false;
    this.retryCount = 0;
    this.maxRetries = 10; // 500ms * 10 = 5 seconds
  }

  /**
   * Recursively search through Shadow DOM and Light DOM
   * This is the "Predator" - aggressively hunts for elements
   * @param {Element} root - Starting element
   * @param {string} selector - CSS selector
   * @returns {Element|null}
   */
  queryShadowRoot(root, selector) {
    const traverse = (node, depth = 0) => {
      if (!node) return null;

      // Check normal DOM
      try {
        const match = node.querySelector?.(selector);
        if (match) return match;
      } catch (e) {
        // Invalid selector, continue
      }

      // Check shadow DOM
      if (node.shadowRoot) {
        try {
          const match = node.shadowRoot.querySelector(selector);
          if (match) return match;
        } catch (e) {
          // Invalid selector in shadow, continue
        }

        // Recursively search shadow children
        for (const child of node.shadowRoot.children) {
          const result = traverse(child, depth + 1);
          if (result) return result;
        }
      }

      // Recursively search light DOM children
      for (const child of node.children || []) {
        const result = traverse(child, depth + 1);
        if (result) return result;
      }

      return null;
    };

    return traverse(root);
  }

  /**
   * Get raw text from input box
   * @returns {string}
   */
  getRawText() {
    if (!this.inputBox) return '';
    return this.inputBox.innerText || this.inputBox.value || '';
  }

  /**
   * Set refined text in input box with proper React/Angular state management
   * This is the "Action Trigger" - ensures Gemini's UI recognizes the change
   * 
   * ATOMIC OPERATIONS for Gemini 2026:
   * 1. Focus the input box
   * 2. Select all existing text
   * 3. Use document.execCommand('insertText') to replace it
   * 4. Dispatch input event to notify React of the change
   * @param {string} text - The refined text to insert
   */
  setRefinedText(text) {
    if (!this.inputBox) {
      console.error('[AI Prompt Enhancer] ❌ Cannot set refined text - no input box found');
      return;
    }

    console.log('[AI Prompt Enhancer] 🔧 Setting refined text (atomic mode):', {
      textLength: text.length,
      inputBoxTag: this.inputBox.tagName,
      contentEditable: this.inputBox.contentEditable,
    });

    try {
      // STEP 1: Focus the input box to activate event listeners
      this.inputBox.focus();
      console.log('[AI Prompt Enhancer] ✓ Step 1: Input focused');

      // STEP 2: Select all existing text
      document.execCommand('selectAll', false, null);
      console.log('[AI Prompt Enhancer] ✓ Step 2: All text selected');

      // STEP 3: Replace with new text using insertText command
      // This is the ONLY way Gemini's React state recognizes programmatic changes
      document.execCommand('insertText', false, text);
      console.log('[AI Prompt Enhancer] ✓ Step 3: Text inserted via execCommand');

      // STEP 4: Manually dispatch input event to trigger React state update
      // Use bubbles: true and composed: true to ensure it reaches all listeners
      const inputEvent = new Event('input', { 
        bubbles: true, 
        composed: true,
        cancelable: true
      });
      this.inputBox.dispatchEvent(inputEvent);
      console.log('[AI Prompt Enhancer] ✓ Step 4: Input event dispatched');

      // STEP 5: Also dispatch change event for completeness
      const changeEvent = new Event('change', { 
        bubbles: true, 
        composed: true,
        cancelable: true
      });
      this.inputBox.dispatchEvent(changeEvent);
      console.log('[AI Prompt Enhancer] ✓ Step 5: Change event dispatched');

      // STEP 6: Simulate keyboard events to ensure React detects user input
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
          this.inputBox.dispatchEvent(keyEvent);
          console.log('[AI Prompt Enhancer] ✓ Step 6: Keyboard event simulated');
        } catch (e) {
          console.warn('[AI Prompt Enhancer] ⚠ Keyboard event failed:', e);
        }
      }, 50);

      console.log('[AI Prompt Enhancer] ✅ Refined text injection complete!');
    } catch (error) {
      console.error('[AI Prompt Enhancer] ❌ Error setting refined text:', error);
      
      // Fallback: Direct innerText assignment
      try {
        console.log('[AI Prompt Enhancer] 🔄 Attempting fallback: direct innerText assignment');
        this.inputBox.innerText = text;
        this.inputBox.textContent = text;
        this.triggerInputEvent();
        console.log('[AI Prompt Enhancer] ✅ Fallback injection successful');
      } catch (fallbackError) {
        console.error('[AI Prompt Enhancer] ❌ Fallback also failed:', fallbackError);
      }
    }
  }

  /**
   * Trigger input/change events for React/Vue/Next.js reactivity
   * ENHANCED April 2026: More aggressive event dispatch to ensure Gemini detects changes
   */
  triggerInputEvent() {
    if (!this.inputBox) return;

    const input = this.inputBox;

    // STEP 1: Native focus events (ensure listeners are active)
    input.focus();
    input.dispatchEvent(new Event('focus', { bubbles: true, composed: true }));

    // STEP 2: Comprehensive input/change event suite
    const events = [
      // Core input events
      new Event('input', { bubbles: true, composed: true }),
      new Event('change', { bubbles: true, composed: true }),
      
      // Keyboard events (simulate user typing)
      new KeyboardEvent('keydown', {
        key: 'a',
        code: 'KeyA',
        keyCode: 65,
        bubbles: true,
        composed: true,
      }),
      new KeyboardEvent('keypress', {
        key: 'a',
        code: 'KeyA',
        charCode: 97,
        bubbles: true,
        composed: true,
      }),
      new KeyboardEvent('keyup', {
        key: 'a',
        code: 'KeyA',
        keyCode: 65,
        bubbles: true,
        composed: true,
      }),
      
      // Blur event to signal completion
      new Event('blur', { bubbles: true, composed: true }),
    ];

    // STEP 3: Dispatch all events sequentially
    events.forEach(event => {
      try {
        input.dispatchEvent(event);
      } catch (e) {
        console.warn('[AI Prompt Enhancer] Failed to dispatch event:', event.type, e);
      }
    });

    // STEP 4: Trigger native mutation events for contentEditable
    if (input.contentEditable === 'true') {
      try {
        const mutationEvent = new MutationEvent('DOMCharacterDataModified', {
          bubbles: true,
          cancelable: true,
        });
        input.dispatchEvent(mutationEvent);
      } catch (e) {
        console.warn('[AI Prompt Enhancer] Mutation event dispatch failed:', e);
      }
    }

    // STEP 5: Force React state update via input event property
    // This is crucial for React 18+ frameworks
    try {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        input.constructor.prototype,
        'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, input.innerText || input.value);
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      }
    } catch (e) {
      console.warn('[AI Prompt Enhancer] React state override failed:', e);
    }

    console.log('[AI Prompt Enhancer] ✅ Input events triggered with aggressive dispatch on', input.tagName);
  }

  /**
   * Check if handler is applicable to current page
   * @returns {boolean}
   */
  isApplicable() {
    return false;
  }

  /**
   * Detect input box - override in subclasses
   * @returns {HTMLElement|null}
   */
  getInputBox() {
    throw new Error('getInputBox() must be implemented');
  }

  /**
   * Inject Magic Wand UI - override in subclasses
   */
  injectUI() {
    throw new Error('injectUI() must be implemented');
  }

  /**
   * Initialize handler with retry logic
   */
  async init() {
    this.retryCount = 0;
    this.tryInitialize();
  }

  /**
   * Try to initialize with exponential backoff
   */
  tryInitialize() {
    this.inputBox = this.getInputBox();
    this.isReady = !!this.inputBox;

    if (this.isReady) {
      this.injectUI();
      this.watchForChanges();
      console.log(`[AI Prompt Enhancer] ${this.constructor.name} initialized successfully`);
    } else if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => this.tryInitialize(), 500);
      console.log(`[AI Prompt Enhancer] ${this.constructor.name} retry ${this.retryCount}/${this.maxRetries}`);
    } else {
      console.warn(`[AI Prompt Enhancer] ${this.constructor.name} failed to initialize after ${this.maxRetries} retries`);
    }
  }

  /**
   * Watch for DOM changes
   */
  watchForChanges() {
    const observer = new MutationObserver(() => {
      const newInputBox = this.getInputBox();
      if (newInputBox && newInputBox !== this.inputBox) {
        this.inputBox = newInputBox;
        // Remove old wand
        const oldWand = document.querySelector('ai-refiner-wand');
        if (oldWand) oldWand.parentElement?.remove();
        // Inject new one
        this.injectUI();
      }
    });

    const target = document.querySelector('main') || 
                   document.querySelector('[role="main"]') ||
                   document.body;

    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['contenteditable', 'aria-label'],
    });
  }
}

/**
 * Gemini Handler (gemini.google.com)
 * AGGRESSIVE Shadow DOM Predator - hunts through all nested Shadow Roots
 * Updated April 2026 for deeply nested UI structure
 */
class GeminiHandler extends BaseHandler {
  isApplicable() {
    return window.location.hostname.includes('gemini.google.com');
  }

  getInputBox() {
    // Strategy 0: 2026-specific Gemini UI selectors (April 2026)
    let inputBox = this.queryShadowRoot(
      document.body,
      'div[contenteditable="true"][aria-label*="Prompt"]'
    );
    if (inputBox) {
      console.log('[Gemini] Found via Strategy 0 (2026 Prompt div)');
      return inputBox;
    }

    // Strategy 0b: Input area container (2026)
    inputBox = this.queryShadowRoot(document.body, '.input-area-container [contenteditable="true"]');
    if (inputBox) {
      console.log('[Gemini] Found via Strategy 0b (2026 input-area-container)');
      return inputBox;
    }

    // Strategy 1: Direct search with aggressive Shadow DOM penetration
    inputBox = this.queryShadowRoot(
      document.body,
      '[contenteditable="true"][aria-label*="Prompt"]'
    );
    if (inputBox) {
      console.log('[Gemini] Found via Strategy 1 (aria-label Prompt)');
      return inputBox;
    }

    // Strategy 2: Search by aria-label with case insensitivity
    inputBox = this.queryShadowRoot(
      document.body,
      '[contenteditable="true"][aria-label*="prompt"]'
    );
    if (inputBox) {
      console.log('[Gemini] Found via Strategy 2 (case-insensitive prompt)');
      return inputBox;
    }

    // Strategy 3: Find rich-textarea and dig into its shadow
    const richTextarea = this.queryShadowRoot(
      document.body,
      'rich-textarea'
    );

    if (richTextarea?.shadowRoot) {
      inputBox = richTextarea.shadowRoot.querySelector('[contenteditable="true"]');
      if (inputBox) {
        console.log('[Gemini] Found via Strategy 3a (rich-textarea shadow)');
        return inputBox;
      }

      // Even deeper search in rich-textarea shadow
      inputBox = this.queryShadowRoot(
        richTextarea,
        '[contenteditable="true"]'
      );
      if (inputBox) {
        console.log('[Gemini] Found via Strategy 3b (rich-textarea recursive)');
        return inputBox;
      }
    }

    // Strategy 3c: Deep rich-textarea div search (2026)
    inputBox = this.queryShadowRoot(document.body, 'rich-textarea div[contenteditable="true"]');
    if (inputBox) {
      console.log('[Gemini] Found via Strategy 3c (rich-textarea deep div)');
      return inputBox;
    }

    // Strategy 4: Search for any contenteditable with message label
    inputBox = this.queryShadowRoot(
      document.body,
      '[contenteditable="true"][aria-label*="message"]'
    );
    if (inputBox) {
      console.log('[Gemini] Found via Strategy 4 (message label)');
      return inputBox;
    }

    // Strategy 5: Brute force - find ANY contenteditable in main area
    const mainArea = document.querySelector('main') || 
                     document.querySelector('[role="main"]');

    if (mainArea) {
      inputBox = this.queryShadowRoot(
        mainArea,
        '[contenteditable="true"]'
      );

      if (inputBox) {
        // Verify it's actually an input (has reasonable size)
        const rect = inputBox.getBoundingClientRect();
        if (rect.height > 20 && rect.height < 200) {
          console.log('[Gemini] Found via Strategy 5 (main area brute force)');
          return inputBox;
        }
      }
    }

    // Strategy 6: Ultra-aggressive - search ALL contenteditable elements (Gemini April 2026)
    inputBox = this.queryShadowRoot(document.body, '[contenteditable="true"]');
    if (inputBox) {
      const rect = inputBox.getBoundingClientRect();
      // Make sure it's visible and reasonable size (not a title or label)
      if (rect.height > 15 && rect.height < 300 && rect.width > 100) {
        console.log('[Gemini] Found via Strategy 6 (ultra-aggressive search)');
        return inputBox;
      }
    }

    // Strategy 7: Look for input elements as fallback (for text-based inputs)
    inputBox = this.queryShadowRoot(
      document.body,
      'textarea[placeholder*="prompt" i], textarea[placeholder*="message" i], input[placeholder*="prompt" i], input[placeholder*="message" i]'
    );
    if (inputBox) {
      console.log('[Gemini] Found via Strategy 7 (textarea/input placeholder)');
      return inputBox;
    }

    console.log('[Gemini] No input box found after 7 strategies');
    return null;
  }

  injectUI() {
    if (!this.inputBox) {
      console.warn('[Gemini] Cannot inject UI - no input box found');
      return;
    }

    // Check if already injected (but don't skip - re-injection is fine)
    const existingWand = document.querySelector('ai-refiner-wand');
    if (existingWand) {
      console.log('[Gemini] Wand already present, ensuring visibility');
      // Just make sure it's still visible (in case visibility was changed)
      const parent = existingWand.parentElement;
      if (parent) {
        parent.style.visibility = 'visible';
        parent.style.opacity = '1';
        parent.style.pointerEvents = 'auto';
      }
      return;
    }

    // Find the best container - look for input wrapper or send button container
    let container = this.inputBox.closest('[role="textbox"]')?.parentElement ||
                    this.inputBox.closest('[contenteditable]')?.parentElement ||
                    this.inputBox.parentElement?.parentElement;

    // Try to find the send button area
    const sendButton = this.queryShadowRoot(
      document.body,
      'button[aria-label*="Send"]'
    ) || this.queryShadowRoot(
      document.body,
      'button[aria-label*="send"]'
    );

    // Create wrapper with absolute positioning (precision coordinates)
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute !important;
      bottom: 10px !important;
      right: 50px !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      pointer-events: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
      width: 30px !important;
      height: 30px !important;
      background: #8e44ad !important;
      border-radius: 50% !important;
    `;

    const wand = document.createElement('ai-refiner-wand');
    wand.setAttribute('platform', 'gemini');
    wrapper.appendChild(wand);

    // DIRECT CLICK LISTENER - Bypass event bubbling issues
    // Dispatch the custom event through the wand element with proper composed flag
    wand.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Gemini] Wand clicked! Triggering custom event...');
      
      // Dispatch the refine-prompt-trigger event with composed:true
      const event = new CustomEvent('refine-prompt-trigger', {
        bubbles: true,
        composed: true,
        detail: { 
          platform: 'gemini',
          timestamp: Date.now()
        }
      });
      
      // Dispatch from the wand element
      wand.dispatchEvent(event);
      
      // Also dispatch at document level for extra coverage
      document.dispatchEvent(new CustomEvent('refine-prompt-trigger', {
        bubbles: true,
        composed: true,
        detail: { 
          platform: 'gemini',
          timestamp: Date.now()
        }
      }));
      
      console.log('[Gemini] Custom event dispatched successfully');
    });

    // Find the closest relative positioned parent or create one
    if (container) {
      // Ensure container has relative positioning
      if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }
      container.appendChild(wrapper);
      console.log('[Gemini] Wand injected into container (position: relative)');
    } else if (sendButton?.parentElement) {
      // Use send button's parent
      const parent = sendButton.parentElement;
      if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      parent.appendChild(wrapper);
      console.log('[Gemini] Wand injected near send button');
    } else {
      // Last resort - inject at bottom right of viewport (FIXED positioning = always visible)
      wrapper.style.position = 'fixed';
      wrapper.style.bottom = '20px';
      wrapper.style.right = '20px';
      wrapper.style.zIndex = '2147483647';
      document.body.appendChild(wrapper);
      console.log('[Gemini] Wand injected at fixed position (bottom-right corner)');
    }

    console.log('[AI Prompt Enhancer] ✨ Gemini wand injected successfully! (z-index: 2147483647, SVG inline, CSP-compliant, ALWAYS VISIBLE)');
  }

  /**
   * Override watch to be even more aggressive for Gemini
   * ENHANCED: Periodic re-injection check every 2 seconds
   * FORCE-INJECT: MutationObserver watches prompt container for wand removal
   */
  watchForChanges() {
    const mainArea = document.querySelector('main') || 
                     document.querySelector('[role="main"]') ||
                     document.body;

    // MutationObserver for DOM changes (detects new input boxes)
    const observer = new MutationObserver(() => {
      const newInputBox = this.getInputBox();

      if (newInputBox && newInputBox !== this.inputBox) {
        this.inputBox = newInputBox;

        // Remove old wand
        const oldWand = document.querySelector('ai-refiner-wand');
        if (oldWand?.parentElement) {
          oldWand.parentElement.remove();
        }

        // Inject new wand
        this.injectUI();
        console.log('[AI Prompt Enhancer] Gemini input re-detected during chat');
      }
    });

    observer.observe(mainArea, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['contenteditable', 'aria-label', 'role'],
      characterData: false,
    });

    // Also monitor shadow DOM mutations
    this.monitorShadowRoots(mainArea);

    // ============================================================
    // WAND RESURRECTION OBSERVER (The Ultimate Safety Net)
    // ============================================================
    // Watch the prompt container specifically for wand removal
    // If Gemini deletes our wand, re-inject it INSTANTLY
    this.startWandResurrectionObserver();

    // PERIODIC RE-INJECTION CHECK (every 2 seconds)
    // Sometimes Gemini deletes the wand during DOM re-renders
    // This ensures the wand is always present if the input box exists
    this.periodicWandCheck = setInterval(() => {
      try {
        // Check if wand is still in the DOM
        const wand = document.querySelector('ai-refiner-wand');
        
        if (!wand && this.inputBox) {
          // Wand disappeared! Re-inject it immediately
          console.warn('[Gemini] Wand disappeared from DOM, re-injecting via periodic check...');
          this.injectUI();
        } else if (!wand && !this.inputBox) {
          // No input box, try to find it again
          const newInputBox = this.getInputBox();
          if (newInputBox) {
            this.inputBox = newInputBox;
            console.log('[Gemini] Found input box again in periodic check, injecting wand');
            this.injectUI();
          }
        }
      } catch (error) {
        console.error('[Gemini] Error in periodic wand check:', error);
      }
    }, 2000); // Check every 2 seconds
  }

  /**
   * WAND RESURRECTION OBSERVER
   * Watches the prompt container for ANY changes
   * If wand is removed, re-injects it IMMEDIATELY
   */
  startWandResurrectionObserver() {
    if (!this.inputBox) return;

    // Find the prompt container (parent of input box)
    let promptContainer = this.inputBox.closest('[role="textbox"]')?.parentElement ||
                          this.inputBox.closest('[contenteditable]')?.parentElement ||
                          this.inputBox.parentElement?.parentElement ||
                          this.inputBox.parentElement;

    if (!promptContainer) {
      console.warn('[Gemini] Could not find prompt container for wand resurrection observer');
      return;
    }

    // Create observer for the prompt container
    const wandResurrectionObserver = new MutationObserver((mutations) => {
      // Check if wand still exists in the container
      const wand = promptContainer.querySelector('ai-refiner-wand');
      
      if (!wand) {
        // Wand was removed! Re-inject it IMMEDIATELY
        console.warn('[Gemini] 💀 Wand was removed by Gemini! Resurrecting... ✨');
        
        // Small delay to ensure DOM is stable
        setTimeout(() => {
          this.injectUI();
        }, 50);
      }
    });

    // Observe the prompt container
    wandResurrectionObserver.observe(promptContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'display', 'visibility', 'opacity'],
    });

    console.log('[Gemini] 🔮 Wand Resurrection Observer activated - wand is now IMMORTAL ✨');
    this.wandResurrectionObserver = wandResurrectionObserver;
  }

  /**
   * Monitor shadow roots for changes
   */
  monitorShadowRoots(root) {
    const walk = (node, depth = 0) => {
      if (depth > 10) return; // Limit depth

      if (node.shadowRoot) {
        const observer = new MutationObserver(() => {
          const newInputBox = this.getInputBox();
          if (newInputBox && newInputBox !== this.inputBox) {
            this.inputBox = newInputBox;
            this.injectUI();
          }
        });

        observer.observe(node.shadowRoot, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['contenteditable'],
        });
      }

      for (const child of node.children || []) {
        walk(child, depth + 1);
      }
    };

    walk(root);
  }
}

/**
 * ChatGPT Handler (chatgpt.com)
 * Now with Shadow DOM fallback for edge cases
 */
class ChatGPTHandler extends BaseHandler {
  isApplicable() {
    return window.location.hostname.includes('chatgpt.com');
  }

  getInputBox() {
    // ChatGPT uses textarea for input
    const textarea = document.querySelector(
      'textarea[placeholder*="Message"]'
    );

    if (textarea) return textarea;

    // Alternative: contenteditable div
    let inputBox = document.querySelector(
      '[contenteditable="true"][role="textbox"][aria-label*="message"]'
    );

    if (inputBox) return inputBox;

    // Fallback: use Shadow DOM search
    inputBox = this.queryShadowRoot(
      document.body,
      'textarea[placeholder*="Message"]'
    );

    if (inputBox) return inputBox;

    return this.queryShadowRoot(
      document.body,
      '[contenteditable="true"][aria-label*="message"]'
    );
  }

  injectUI() {
    if (!this.inputBox) return;

    // Check if already injected
    if (document.querySelector('ai-refiner-wand')) return;

    const container = this.inputBox.closest('form') || this.inputBox.parentElement;
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
      z-index: 1000;
    `;

    const wand = document.createElement('ai-refiner-wand');
    wand.setAttribute('platform', 'chatgpt');
    wrapper.appendChild(wand);
    container.appendChild(wrapper);
  }
}

/**
 * Claude Handler (claude.ai)
 * Now with Shadow DOM fallback for nested structures
 */
class ClaudeHandler extends BaseHandler {
  isApplicable() {
    return window.location.hostname.includes('claude.ai');
  }

  getInputBox() {
    // Claude uses contenteditable div
    const inputArea = document.querySelector(
      '[contenteditable="true"][data-testid="input-field"]'
    );

    if (inputArea) return inputArea;

    // Fallback: search by ARIA labels
    let inputBox = document.querySelector(
      '[contenteditable="true"][aria-label*="message"]'
    );

    if (inputBox) return inputBox;

    // Use Shadow DOM search as last resort
    inputBox = this.queryShadowRoot(
      document.body,
      '[contenteditable="true"][data-testid="input-field"]'
    );

    if (inputBox) return inputBox;

    return this.queryShadowRoot(
      document.body,
      '[contenteditable="true"][aria-label*="message"]'
    );
  }

  injectUI() {
    if (!this.inputBox) return;

    // Check if already injected
    if (document.querySelector('ai-refiner-wand')) return;

    const container = this.inputBox.parentElement;
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
      z-index: 1000;
    `;

    const wand = document.createElement('ai-refiner-wand');
    wand.setAttribute('platform', 'claude');
    wrapper.appendChild(wand);
    container.appendChild(wrapper);
  }
}

// Export handlers
window.platformHandlers = {
  BaseHandler,
  GeminiHandler,
  ChatGPTHandler,
  ClaudeHandler,
};
