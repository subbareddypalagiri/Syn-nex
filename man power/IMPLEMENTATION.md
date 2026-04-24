# Implementation Guide - Code Walkthrough

## How Each Component Works

### 1. Platform Handlers (The Smart Detective)

**File**: `src/content/platform-handlers.js`

**What it does**: Finds the chat input box on each AI platform using clever detection methods.

#### BaseHandler Class

```javascript
class BaseHandler {
  // Find the input box
  getInputBox() → returns HTMLElement or null
  
  // Get what user typed
  getRawText() → returns string
  
  // Replace with refined prompt
  setRefinedText(text) → modifies DOM
  
  // Tell the website something changed
  triggerInputEvent() → triggers input/change events
  
  // Watch for page updates
  watchForChanges() → uses MutationObserver
}
```

**Why it's smart:**

Instead of looking for CSS class names (which change constantly):
```javascript
// ❌ Fragile - breaks when CSS updates
querySelector('.input-v2-updated-2025-design')

// ✅ Robust - uses semantic web standards
querySelector('[contenteditable="true"][aria-label*="Message"]')
```

#### Platform-Specific Handlers

**GeminiHandler:**
```javascript
// Gemini uses a contenteditable div
getInputBox() {
  return document.querySelector(
    '[contenteditable="true"][role="textbox"][aria-label*="Message"]'
  )
}
```

**ChatGPTHandler:**
```javascript
// ChatGPT prefers textarea
getInputBox() {
  const textarea = document.querySelector('textarea[placeholder*="Message"]')
  return textarea || /* fallback to contenteditable */
}
```

**ClaudeHandler:**
```javascript
// Claude uses data-testid
getInputBox() {
  return document.querySelector('[contenteditable="true"][data-testid="input-field"]')
}
```

---

### 2. Magic Wand UI (The Sparkly Button)

**File**: `src/ui/magic-wand.js`

**What it does**: Creates the ✨ button with animations using Web Components.

#### Why Web Components?

```javascript
// ✅ Encapsulation via Shadow DOM
<ai-refiner-wand>
  #shadow-root
    <button>✨</button>
    <style>button { ... }</style>
    
// No CSS from the website affects our button!
// No CSS from our button affects the website!
```

#### Visual States

```javascript
// 1. Normal state
<button class="wand-button">✨</button>

// 2. User hovers
→ Creates sparkle effects
→ Button scales up slightly

// 3. User clicks
→ Change state to .refining
→ Button pulses with gradient
→ Status text shows "Refining..."

// 4. API responds (success)
→ Change state to .success
→ Button flashes green
→ Status text shows "Refined!"
→ After 2s, reset to normal

// 5. API responds (error)
→ Change state to .error
→ Button shakes red
→ Status text shows error message
→ After 3s, reset to normal
```

#### Click Handler Flow

```javascript
user clicks wand
  ↓
handleRefineClick()
  ↓
if (isRefining) return  // Already refining
  ↓
getActiveHandler() → Get GeminiHandler/ChatGPTHandler/ClaudeHandler
  ↓
rawText = handler.getRawText()
  ↓
if (!rawText.trim()) → showError()
  ↓
isRefining = true → Lock button
  ↓
chrome.runtime.sendMessage({
  action: 'refinePrompt',
  text: rawText,
  platform: 'gemini'
})
  ↓
Wait for response...
  ↓
sendResponse callback fires
  ↓
if (success)
  handler.setRefinedText(response.refinedText)
  showSuccess()
else
  showError(response.error)
```

---

### 3. Service Worker (The Brain)

**File**: `src/background/service-worker.js`

**What it does**: Calls the AI API and handles the actual refinement.

#### Message Handler

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refinePrompt') {
    handleRefinePrompt(request.text, request.platform)
      .then(refinedText => sendResponse({ success: true, refinedText }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    
    return true  // Keep connection open for async response
  }
})
```

#### Refinement Process

```javascript
function handleRefinePrompt(rawText, platform) {
  // Step 1: Get API key from browser storage
  const { apiKey } = await chrome.storage.local.get('apiKey')
  if (!apiKey) throw new Error('API key not configured')
  
  // Step 2: Remove sensitive data
  const scrubbedText = scrubbePII(rawText)
  // "Email me at john@example.com" 
  //   → "Email me at [EMAIL]"
  
  // Step 3: Build the refinement instruction
  const refinementPrompt = buildRefinementPrompt(scrubbedText, platform)
  // Combines:
  // - System instruction (what to do)
  // - Scrubbed user text (raw prompt)
  
  // Step 4: Call Gemini API
  const refinedText = await callGeminiAPI(refinementPrompt, apiKey)
  
  // Step 5: Return to content script
  return refinedText
}
```

#### API Call Details

```javascript
async function callGeminiAPI(prompt, apiKey) {
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
  
  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,      // Not too creative, not too rigid
        maxOutputTokens: 500   // Keep response reasonable
      }
    })
  })
  
  const data = await response.json()
  
  // Extract text from nested response structure
  return data.candidates[0].content.parts[0].text
}
```

---

### 4. Content Script (The Conductor)

**File**: `src/content/content-script.js`

**What it does**: Runs on every page and orchestrates everything.

#### Initialization

```javascript
class ContentScriptManager {
  async init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start())
    } else {
      this.start()
    }
  }
  
  async start() {
    // Try each handler until one says "I work on this site"
    const handlers = [
      new GeminiHandler(),
      new ChatGPTHandler(),
      new ClaudeHandler()
    ]
    
    for (const handler of handlers) {
      if (handler.isApplicable()) {
        this.handler = handler
        break
      }
    }
    
    if (!this.handler) return  // Not a supported site
    
    // Initialize the handler
    await this.handler.init()
    
    if (this.handler.isReady) {
      console.log('[AI Prompt Enhancer] Ready!')
    } else {
      // Retry after 2 seconds
      setTimeout(() => this.retryInit(), 2000)
    }
  }
}

const manager = new ContentScriptManager()
manager.init()
```

#### Platform Detection

```javascript
// GeminiHandler
isApplicable() {
  return window.location.hostname.includes('gemini.google.com')
}

// ChatGPTHandler
isApplicable() {
  return window.location.hostname.includes('chatgpt.com')
}

// ClaudeHandler
isApplicable() {
  return window.location.hostname.includes('claude.ai')
}
```

---

### 5. PII Scrubber (The Shredder)

**File**: `src/utils/pii-scrubber.js`

**What it does**: Finds and replaces sensitive information.

#### Scrubbing Examples

```javascript
// Input
"My email is john.doe@company.com and my phone is (555) 123-4567"

// After scrubbing
"My email is [EMAIL] and my phone is [PHONE]"

// Safe to send to API!
```

#### Pattern Matching

```javascript
const PIIScrubber = {
  scrub(text) {
    text = this.scrubEmails(text)
    text = this.scrubPhoneNumbers(text)
    text = this.scrubCreditCards(text)
    text = this.scrubSSN(text)
    text = this.scrubIPAddresses(text)
    text = this.scrubURLCredentials(text)
    return text
  },
  
  scrubEmails(text) {
    return text.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '[EMAIL]')
  },
  
  scrubPhoneNumbers(text) {
    return text.replace(
      /\b(?:\+?\d{1,3}[-.\s]?)?\(?(?:\d{3})\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      '[PHONE]'
    )
  }
  
  // ... more patterns
}
```

---

### 6. Settings UI (The Control Panel)

**File**: `popup.html` and `popup.js`

**What it does**: Lets users configure their API key.

#### HTML Structure

```html
<input type="password" id="apiKey" placeholder="Enter Gemini API key" />
<button type="submit">Save Settings</button>
<button type="button" id="testBtn">Test API</button>
```

#### JavaScript Logic

```javascript
// Save settings
settingsForm.addEventListener('submit', (e) => {
  e.preventDefault()
  
  const apiKey = apiKeyInput.value.trim()
  if (!apiKey) return showStatus('API key required', 'error')
  
  // Store in browser (encrypted by Chrome)
  chrome.storage.local.set({ apiKey }, () => {
    showStatus('Settings saved!', 'success')
  })
})

// Test API connection
testBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim()
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say "API test successful" in 4 words.' }]
          }]
        })
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      const text = data.candidates[0].content.parts[0].text
      showStatus('✅ API works!', 'success')
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    showStatus(`❌ API test failed: ${error.message}`, 'error')
  }
})
```

---

## Complete Flow: User Perspective

```
1. User navigates to Gemini
   → Content script injects
   → Detects input box
   → Creates ✨ Magic Wand button

2. User types their prompt
   "Write a Python function to sort a list"
   → Button shows ready

3. User clicks ✨ button
   → Button animates (pulse)
   → Status shows "Refining..."

4. Backend magic happens (1-3 seconds):
   Raw: "Write a Python function to sort a list"
     ↓ Scrubbed (no changes needed)
     ↓ Sent to Gemini API
     ↓ Refined to:
   "I need a Python function with:
    - Sorts a list in ascending order
    - Handles edge cases
    - Includes error handling
    - Provides example usage"

5. Refined prompt injected back into input box
   → Button flashes green
   → Status shows "Refined!"

6. User sees improved prompt
   → Can edit if needed
   → Sends to Gemini

7. Gemini gives better response (due to better prompt)
```

---

## Code Execution Timeline

```
Page Load
  ↓
Script 1: pii-scrubber.js
  → Defines PIIScrubber utility
  
Script 2: platform-handlers.js
  → Defines BaseHandler and subclasses
  
Script 3: magic-wand.js
  → Defines MagicWandElement web component
  → Registers as <ai-refiner-wand>
  
Script 4: content-script.js
  → Creates ContentScriptManager
  → Calls manager.init()
  → Detects platform
  → Initializes handler
  → Injects Magic Wand
  → Sets up MutationObserver
  
CSS: styles.css
  → Loads host styles (doesn't affect Shadow DOM)
  
Service Worker (background)
  → Already running
  → Ready to receive messages
  → Listening on chrome.runtime.onMessage

User Action (click wand)
  → Service Worker receives message
  → Calls Gemini API
  → Sends response back
  → Content script injects text
```

---

## Debugging Tips

### View Logs in Console (F12)

```javascript
// Look for lines like:
[AI Prompt Enhancer] Initialized successfully
[AI Prompt Enhancer] API key updated
[AI Prompt Enhancer] Service worker initialized
```

### Inspect the Magic Wand (F12)

```html
<!-- Elements tab → search for <ai-refiner-wand> -->
<ai-refiner-wand platform="gemini">
  #shadow-root
    <style>...</style>
    <div class="wand-container">
      <button class="wand-button">✨</button>
      <div class="status-text"></div>
    </div>
</ai-refiner-wand>
```

### Check Network Calls (F12 → Network)

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=***

Status: 200 ✅
Response: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
```

### Verify Storage

```javascript
// In console
chrome.storage.local.get(['apiKey'], result => {
  console.log('Stored API key:', result.apiKey ? '[exists]' : '[not set]')
})
```

---

This architecture is designed to be:
- ✅ **Modular** - Each component has one job
- ✅ **Extensible** - Easy to add platforms/features
- ✅ **Secure** - PII scrubbing, local storage
- ✅ **Fast** - Minimal performance overhead
- ✅ **Maintainable** - Clear separation of concerns

Enjoy building! 🚀
