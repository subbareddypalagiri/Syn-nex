/**
 * Service Worker - Background process for API communication
 * April 2026: Gemini 2.5 Flash Lite (free-tier optimized)
 * - Uses gemini-2.5-flash-lite (latest free-tier model)
 * - No billing required
 * - Fetches API key from chrome.storage.local
 * - Correct v1beta endpoint and payload structure
 */

/**
 * Listen for messages from content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refinePrompt') {
    console.log('[Service Worker] 📬 Received refinement request');

    // Fetch key from permanent storage every time
    chrome.storage.local.get(['geminiApiKey'], async (result) => {
      const apiKey = result.geminiApiKey;
      
      if (!apiKey) {
        console.warn('[Service Worker] ❌ No API key in storage');
        sendResponse({
          success: false,
          error: 'API Key not set. Open extension popup to add your Gemini API key.'
        });
        return;
      }

      try {
        console.log('[Service Worker] 🔑 API key found, calling Gemini...');

        // Using gemini-2.5-flash-lite - latest free-tier model (no billing required)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

        // Exact correct payload
        const aiPayload = {
          contents: [{
            parts: [{
              text: "Refine and make this prompt highly professional and effective for an AI. Return only the refined text directly, no conversational filler or quotes:\n\n" + request.text
            }]
          }]
        };

        console.log('[Service Worker] 🚀 Calling Gemini 2.5 Flash Lite API');

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(aiPayload)
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.error?.message || `API Error: ${response.status}`;
          console.error('[Service Worker] ❌ API Error:', errorMsg);
          throw new Error(errorMsg);
        }

        // Extract and send back
        const refinedText = data.candidates[0].content.parts[0].text;
        console.log('[Service Worker] ✅ Success! Refined text received:', refinedText.substring(0, 50) + '...');
        
        sendResponse({
          success: true,
          refinedText: refinedText
        });
      } catch (error) {
        console.error('[Service Worker] 💥 Error:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      }
    });

    return true; // CRITICAL: Keep message channel open for async response
  }
});

/**
 * Listen for installation to open options page
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Service Worker] ✨ Extension installed');
});

console.log('[Service Worker] ✅ Service Worker initialized and ready');
