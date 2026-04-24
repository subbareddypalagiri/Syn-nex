# Technical Architecture Document

## System Design Overview

The **Universal AI Intelligence Layer** is built on a modular, event-driven architecture that separates concerns across content scripts, background workers, and UI components.

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Browser                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  AI Chatbot Page (Gemini / ChatGPT / Claude)             │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Input Box (contenteditable or textarea)           │  │   │
│  │  │  ┌──────────────────────────────────────────┐      │  │   │
│  │  │  │ Your raw prompt...                      │ ✨   │  │   │
│  │  │  │                                          │      │  │   │
│  │  │  └──────────────────────────────────────────┘      │  │   │
│  │  │                                           [Magic Wand]  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │ Content Script Active (platform-handlers.js)             │   │
│  │ • Detects input boxes via heuristic selectors           │   │
│  │ • Injects Shadow DOM Magic Wand element                 │   │
│  │ • Listens for Magic Wand click                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                                                        │
│         │ chrome.runtime.sendMessage({                          │
│         │   action: 'refinePrompt',                             │
│         │   text: rawText,                                      │
│         │   platform: 'gemini'                                  │
│         │ })                                                    │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Service Worker (background/service-worker.js)           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ 1. Receive refinement request                      │  │   │
│  │  │ 2. Validate API key from chrome.storage.local      │  │   │
│  │  │ 3. Scrub PII using PIIScrubber                     │  │   │
│  │  │ 4. Build refinement prompt                         │  │   │
│  │  │ 5. Call Gemini API with refined prompt             │  │   │
│  │  │ 6. Extract refined text from response              │  │   │
│  │  │ 7. Send back to content script                     │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │        Google Gemini API                        │    │   │
│  │  │    (generativelanguage.googleapis.com)          │    │   │
│  │  │                                                 │    │   │
│  │  │  Request: Raw prompt + PII scrubbed            │    │   │
│  │  │  Response: Refined, structured prompt          │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                                                        │
│         │ sendResponse({                                        │
│         │   success: true,                                      │
│         │   refinedText: "Enhanced prompt..."                   │
│         │ })                                                    │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Content Script Receives Response                         │   │
│  │  • Call handler.setRefinedText(refinedText)              │   │
│  │  • Trigger input/change events for reactivity            │   │
│  │  • Show "Refined!" visual feedback                       │   │
│  │  • Ready for user to submit                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Platform Handlers (`src/content/platform-handlers.js`)

**Purpose**: Detect input boxes and manage platform-specific interactions

**Architecture**: Base class + Strategy pattern

```javascript
class BaseHandler {
  // Common functionality
  getRawText()         // Extract text from input
  setRefinedText()     // Inject refined text
  triggerInputEvent()  // Notify host of changes
  watchForChanges()    // MutationObserver
}

// Each platform extends with specific selectors
class GeminiHandler extends BaseHandler
class ChatGPTHandler extends BaseHandler
class ClaudeHandler extends BaseHandler
```

**Key Method: Input Detection**

Uses **heuristic selectors** for robustness:
- ARIA roles and labels (semantic)
- Placeholder text patterns
- Contenteditable attributes
- Data test IDs

❌ Does NOT use CSS class names (fragile, change frequently)

**Example:**
```javascript
// ✅ Robust - uses semantic attributes
document.querySelector('[contenteditable="true"][aria-label*="Message"]')

// ❌ Fragile - uses CSS classes
document.querySelector('.input-box-v2-new-design-2025')
```

### 2. Magic Wand UI (`src/ui/magic-wand.js`)

**Purpose**: Provide visual interface for refinement

**Architecture**: Web Component with Shadow DOM

```javascript
class MagicWandElement extends HTMLElement {
  // Shadow DOM encapsulation
  // - CSS isolation (no host style bleed)
  // - Encapsulated state
  // - Reusable component
  
  connectedCallback()   // Inject when added to DOM
  handleRefineClick()   // Send message to background
  showSuccess/Error()   // Visual feedback
  createSparkles()      // Hover animation
}

customElements.define('ai-refiner-wand', MagicWandElement)
```

**Shadow DOM Benefits:**
- ✅ CSS doesn't leak in/out
- ✅ No ID/class name conflicts
- ✅ Encapsulated animations
- ✅ Clean separation from host page

**Visual States:**
1. **Normal**: Subtle glassmorphism button
2. **Hover**: Sparkle effect, slight scale
3. **Refining**: Pulsing gradient, spinner-like
4. **Success**: Green flash, "Refined!" text
5. **Error**: Red shake, error message

### 3. Service Worker (`src/background/service-worker.js`)

**Purpose**: Handle API communication and prompt refinement

**Flow:**

```
Request: { action: 'refinePrompt', text, platform }
  ↓
Validate API key from storage
  ↓
Scrub PII from text (emails, phones, SSN, etc.)
  ↓
Build refinement prompt with context
  ↓
Call Gemini API (POST to generativelanguage.googleapis.com)
  ↓
Parse response and extract refined text
  ↓
Response: { success: true/false, refinedText/error }
```

**API Request Structure:**

```javascript
{
  contents: [{
    parts: [{ text: "Refinement instruction + raw prompt" }]
  }],
  generationConfig: {
    temperature: 0.7,        // Creative but focused
    topK: 40,                // Limit diversity
    topP: 0.95,              // Nucleus sampling
    maxOutputTokens: 500     // Limit response length
  },
  safetySettings: [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    // ... more safety settings
  ]
}
```

**Error Handling:**
- Network errors → Return user-friendly message
- Invalid API key → "API key not configured"
- API rate limit → Wait and retry
- Malformed response → Return original prompt

### 4. Content Script (`src/content/content-script.js`)

**Purpose**: Orchestrate the entire extension lifecycle

**Initialization Sequence:**

```
Script loads
  ↓
Wait for DOM ready (if needed)
  ↓
Detect active platform (Gemini/ChatGPT/Claude)
  ↓
Instantiate appropriate handler
  ↓
Get input box via handler.getInputBox()
  ↓
Inject Magic Wand UI via handler.injectUI()
  ↓
Setup MutationObserver for dynamic updates
  ↓
Ready for user interaction
```

**Retry Logic:**
- If input box not found initially, retry after 2s
- Watches for DOM changes (new input boxes)
- Handles page transitions and SPAs

### 5. PII Scrubber (`src/utils/pii-scrubber.js`)

**Purpose**: Remove sensitive data before sending to API

**Patterns:**
```javascript
Email:        user@example.com      → [EMAIL]
Phone:        (123) 456-7890        → [PHONE]
SSN:          123-45-6789           → [SSN]
Credit Card:  4532-1488-0343-6467   → [CREDIT_CARD]
IP Address:   192.168.1.1           → [IP]
URL Creds:    http://user:pass@...  → https://[CREDENTIALS]@...
```

**Strategy:**
- Regex-based pattern matching
- Extensible (easy to add new patterns)
- Always-on (applied before every API call)
- Transparent to user (doesn't modify visible text)

### 6. Settings UI (`popup.html`, `popup.js`)

**Purpose**: Let users configure API key and options

**Features:**
- API key input (masked)
- Quick API connectivity test
- Feature toggles (PII scrubbing, status text)
- Help text with link to get API key
- Visual status feedback (success/error/info)

---

## Event Flow Diagrams

### User Interaction Flow

```
User sees input box with ✨ wand
       ↓
User clicks Magic Wand
       ↓
MagicWandElement.handleRefineClick()
       ↓
getActiveHandler().getRawText()
       ↓
Validate input (not empty)
       ↓
Set isRefining = true
       ↓
chrome.runtime.sendMessage({
  action: 'refinePrompt',
  text: rawText,
  platform: 'gemini'
})
       ↓
Service Worker receives message
       ↓
handleRefinePrompt(text, platform)
       ↓
[API call with PII scrubbing]
       ↓
sendResponse({ success, refinedText/error })
       ↓
Content Script processes response
       ↓
handler.setRefinedText(refinedText)
       ↓
handler.triggerInputEvent()
       ↓
Show success feedback (green, ✅)
       ↓
Clear status after 2s
       ↓
User reviews and submits
```

### DOM Change Detection

```
Website updates (SPA navigation, new input box)
       ↓
MutationObserver fires
       ↓
handler.watchForChanges() callback
       ↓
Check if newInputBox !== oldInputBox
       ↓
If yes: Remove old wand, injectUI() with new wand
       ↓
Continue listening for more changes
```

---

## Data Flow & Security

### Sensitive Data Handling

```
User Types Raw Prompt
    ↓
Raw text IN content script (local, not sent anywhere)
    ↓
User clicks Magic Wand
    ↓
Raw text sent to Service Worker via chrome.runtime.sendMessage
    ↓
PIIScrubber.scrub(text)
    ↓
Scrubbed text sent to Gemini API
    ↓
Refined text sent back to content script
    ↓
Refined text injected into input box
    ↓
Prompt NEVER stored, cached, or logged
```

### Storage Architecture

```
Chrome Local Storage
├── apiKey (stored encrypted by browser)
├── autoScrubPII (boolean preference)
└── showStatusText (boolean preference)

// NOT stored:
// - User prompts
// - Refined prompts
// - Refinement history
// - API responses
```

### API Security

```
Content Script
    ↓ (chrome.runtime.sendMessage)
Service Worker
    ↓ (HTTPS POST)
Google Gemini API
    ↓
Response
    ↓
Service Worker
    ↓ (sendResponse callback)
Content Script
    ↓
User's Chat Box
```

✅ All communication is encrypted (HTTPS)
✅ API key never sent to content script
✅ API key never sent to chatbot websites
✅ PII scrubbed before external transmission

---

## Performance Optimizations

### 1. Debouncing
- Not implemented yet (could add 1.5s debounce if refine-on-type)
- Currently on-demand (click to refine)

### 2. Lazy Initialization
```javascript
// Don't scan for handlers until needed
// Only run content script on specific domains
```

### 3. Shadow DOM Benefits
- No forced layout recalculations
- CSS doesn't affect host page
- Encapsulated animations don't tax performance

### 4. Efficient DOM Selectors
- Use modern querySelector API
- Avoid complex CSS selectors
- Use semantic attributes (faster to parse)

### 5. Memory Management
```javascript
// Remove old sparkles
setTimeout(() => sparkle.remove(), 1500)

// Cleanup event listeners
observer.disconnect() when needed
```

### 6. Metrics
- **Content script size**: ~50KB (minified)
- **Service worker**: ~15KB
- **Shadow DOM overhead**: Negligible
- **API latency**: 1-3 seconds (Gemini response time)

---

## Extensibility Points

### 1. Add New Platform

```javascript
// 1. Create new handler
class NewPlatformHandler extends BaseHandler {
  isApplicable() { /* check URL */ }
  getInputBox() { /* heuristic selectors */ }
  injectUI() { /* insert wand */ }
}

// 2. Register in content-script.js
const handlers = [
  new platformHandlers.GeminiHandler(),
  new platformHandlers.ChatGPTHandler(),
  new platformHandlers.ClaudeHandler(),
  new platformHandlers.NewPlatformHandler() // ← Add this
];

// 3. Update manifest.json
"host_permissions": [
  "https://newplatform.com/*"
]
```

### 2. Add New PII Pattern

```javascript
// In pii-scrubber.js
PIIScrubber.scrubBankAccount = function(text) {
  return text.replace(/\b\d{10}\b/g, '[BANK_ACCOUNT]');
}
```

### 3. Change Refinement Strategy

```javascript
// In service-worker.js
function buildRefinementPrompt(rawText, platform) {
  // Modify the instruction here
  // Add custom logic based on platform
}
```

### 4. Add New API Provider

```javascript
// In service-worker.js
async function callGeminiAPI(prompt, apiKey) {
  // Replace with your API provider
  // await fetch('https://your-api.com/refine', { ... })
}
```

---

## Manifest V3 Details

```json
{
  "manifest_version": 3,
  
  // Permissions needed
  "permissions": [
    "storage",        // Read/write chrome.storage.local
    "scripting",      // Inject content scripts
    "activeTab"       // Access current tab
  ],
  
  // Which sites can we run on?
  "host_permissions": [
    "https://gemini.google.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*"
  ],
  
  // Content scripts inject into matching pages
  "content_scripts": [{
    "matches": [ "https://gemini.google.com/*", ... ],
    "js": [ /* injected in order */ ],
    "css": [ /* styling */ ],
    "run_at": "document_start"  // Run ASAP
  }],
  
  // Service worker (background process)
  "background": {
    "service_worker": "src/background/service-worker.js"
  },
  
  // Settings popup
  "action": {
    "default_popup": "popup.html"
  }
}
```

---

## Testing Checklist

### Manual Testing

- [ ] Load unpacked extension
- [ ] API key configuration works
- [ ] API test passes
- [ ] Magic Wand appears on Gemini
- [ ] Magic Wand appears on ChatGPT
- [ ] Magic Wand appears on Claude
- [ ] Click wand → refinement happens
- [ ] Refined text injects correctly
- [ ] Host site recognizes injected text (can send)
- [ ] Visual feedback shows (success/error)
- [ ] Keyboard navigation works
- [ ] Works on mobile Chrome
- [ ] PII properly scrubbed (check network tab)

### Browser Console

```javascript
// Check logs
console.log('[AI Prompt Enhancer] ...')

// Inspect shadow DOM
// DevTools → Elements → expand <ai-refiner-wand>
```

---

## Troubleshooting Guide

### Extension doesn't load
- Check manifest.json syntax
- Enable developer mode in chrome://extensions/
- Check for permission errors

### Magic Wand doesn't appear
- Check if domain is in host_permissions
- Refresh the page
- Open DevTools → Console for errors
- Verify handler.getInputBox() finds an element

### API calls fail
- Check API key validity
- Verify internet connection
- Check API quota at makersuite.google.com
- Look at Network tab for response codes

### Text injection doesn't work
- Verify triggerInputEvent() fires
- Check if input box is detected correctly
- Ensure handler.setRefinedText() is called
- Test with console: `handler.setRefinedText('test')`

---

## Future Roadmap

### Phase 2 (Upcoming)
- [ ] Keyboard shortcut (Ctrl+Shift+E)
- [ ] Refinement history sidebar
- [ ] Custom prompt templates
- [ ] Multiple API providers
- [ ] Advanced settings UI

### Phase 3 (Future)
- [ ] Offline mode with local LLM (ollama)
- [ ] Batch refinement
- [ ] Prompt versioning
- [ ] Team collaboration features
- [ ] Analytics dashboard

---

This is a production-grade architecture designed for extensibility, security, and user privacy.

**Happy coding!** 🚀
