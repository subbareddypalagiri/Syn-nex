/**
 * Content Script - Universal Refiner Manager
 * Framework-agnostic prompt refinement for ANY input on ANY website
 * Works with NATIVE DIV wand (no custom elements)
 */

class UniversalRefinerManager {
  constructor() {
    this.handler = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the universal refiner
   */
  async init() {
    console.log('[UniversalRefiner] 🚀 Initializing universal refiner (Native Div Mode)...');

    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  /**
   * Start the refiner
   */
  async start() {
    // Create universal handler
    if (!window.UniversalHandler) {
      console.warn('[UniversalRefiner] UniversalHandler not available, retrying...');
      setTimeout(() => this.start(), 500);
      return;
    }

    this.handler = new window.UniversalHandler();
    await this.handler.init();

    // Setup event listener for wand clicks
    this.setupWandListener();

    this.isInitialized = true;
    console.log('[UniversalRefiner] ✅ Universal refiner initialized with Native Div');
  }

  /**
   * Listen for Magic Wand click events
   * Delegates to handler and handles API communication
   */
  setupWandListener() {
    document.addEventListener('refine-prompt-trigger', async (event) => {
      console.log('[UniversalRefiner] ✨ Wand clicked! Starting refinement...');

      if (!this.handler) {
        console.warn('[UniversalRefiner] ❌ Handler not initialized');
        return;
      }

      try {
        this.handler.setLoading(true);

        // Get extracted text from handler (no chrome.runtime access here)
        const result = await this.handler.executeRefinement();
        
        if (!result) {
          console.warn('[UniversalRefiner] ❌ No text extracted');
          this.handler.setLoading(false);
          return;
        }

        const { text, target } = result;
        console.log('[UniversalRefiner] 📤 Sending to background script:', text.substring(0, 50) + '...');

        // Send to background script (content script has chrome API access)
        chrome.runtime.sendMessage(
          { action: 'refinePrompt', text: text },
          (response) => {
            if (!response) {
              console.error('[UniversalRefiner] ❌ No response from background script');
              this.handler.updateStatus('Connection error', '#ef4444');
              this.handler.setLoading(false);
              return;
            }

            if (response.success && response.refinedText) {
              console.log('[UniversalRefiner] 📥 Refined text received');
              this.handler.injectRefinedText(target, response.refinedText);
            } else {
              const errorMsg = response.error || 'Failed to refine';
              console.error('[UniversalRefiner] ❌ API Error:', errorMsg);
              this.handler.updateStatus(errorMsg, '#ef4444');
            }

            this.handler.setLoading(false);
          }
        );

      } catch (error) {
        console.error('[UniversalRefiner] ❌ Refinement error:', error);
        this.handler.updateStatus('Error: ' + error.message, '#ef4444');
        this.handler.setLoading(false);
      }
    });

    console.log('[UniversalRefiner] 🎯 Wand listener installed (handler coordinates refinement)');
  }
}

// Initialize on script load
const manager = new UniversalRefinerManager();
manager.init();

// Listen for API key changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.geminiApiKey) {
    console.log('[UniversalRefiner] Gemini API key updated');
  }
});

console.log('[UniversalRefiner] Content script loaded (Native Div Mode)');
