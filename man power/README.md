# AI Prompt Enhancer - Chrome Extension

## Overview

**Universal AI Intelligence Layer** - A Chrome Extension (Manifest V3) that sits between you and AI chatbots. It intercepts your raw input, refines it into a high-fidelity prompt using Google Gemini API, and re-injects the improved version back into the chat interface.

### Features

✨ **Universal Compatibility**
- Works with Gemini, ChatGPT, and Claude
- Robust DOM detection (heuristic-based, update-proof)
- MutationObserver for dynamic page tracking

🎯 **Intelligent Prompt Refinement**
- Transforms raw input → Professional structured prompts
- Adds role/task/context/format structure
- 1.5s debounce for efficient refinement

🔐 **Security & Privacy**
- Automatic PII scrubbing before API calls
- Local API key storage (browser-encrypted)
- No tracking or data persistence

🎨 **Beautiful UI**
- Glassmorphism Magic Wand button
- Shadow DOM isolation (no CSS conflicts)
- Smooth animations and visual feedback
- Subtle sparkle effects on hover

⚡ **Performance**
- Zero-lag operation
- Invisible until needed
- Minimal memory footprint

---

## Installation

### 1. Get Your API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key (keep it safe!)

### 2. Install the Extension

#### Option A: Load Unpacked (Development)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `ai-prompt-enhancer` folder
6. The extension icon should appear in your toolbar

#### Option B: Manual Installation

1. Download all files
2. Place them in a folder structure like:
   ```
   ai-prompt-enhancer/
   ├── manifest.json
   ├── popup.html
   ├── popup.js
   ├── src/
   │   ├── content/
   │   │   ├── content-script.js
   │   │   └── platform-handlers.js
   │   ├── background/
   │   │   └── service-worker.js
   │   ├── ui/
   │   │   ├── magic-wand.js
   │   │   └── styles.css
   │   └── utils/
   │       └── pii-scrubber.js
   ```
3. Load unpacked from this folder in Chrome

### 3. Configure Your API Key

1. Click the extension icon in your toolbar
2. Enter your Gemini API key
3. (Optional) Click "Test API" to verify it works
4. Click "Save Settings"

---

## How to Use

1. **Navigate** to Gemini, ChatGPT, or Claude
2. **Type** your initial prompt/question in the chat box
3. **Click** the ✨ Magic Wand button (appears next to input)
4. **Watch** as the prompt gets refined in real-time
5. **Review** the enhanced prompt and send it

### Visual Feedback

- 🪄 **Hovering**: Wand sparkles with magical effect
- ⏳ **Refining**: Button pulses with gradient animation
- ✅ **Success**: Button flashes green, shows "Refined!" text
- ❌ **Error**: Button shakes red with error message

---

## Architecture

### Components

#### 1. **Platform Handlers** (`src/content/platform-handlers.js`)
- Base handler class with common logic
- Specialized handlers for each AI platform:
  - **GeminiHandler**: Detects contenteditable divs with ARIA labels
  - **ChatGPTHandler**: Works with textarea inputs
  - **ClaudeHandler**: Handles Claude's input areas
- Heuristic selectors (update-proof)
- MutationObserver for DOM changes

#### 2. **Magic Wand UI** (`src/ui/magic-wand.js`)
- Custom web component: `<ai-refiner-wand>`
- Encapsulated Shadow DOM (CSS isolation)
- Glassmorphism styling with animations
- Event listeners for click and hover
- Sparkle effect generation
- Status text management

#### 3. **Content Script** (`src/content/content-script.js`)
- Main orchestrator
- Initializes appropriate platform handler
- Manages lifecycle
- Listens for storage changes

#### 4. **Service Worker** (`src/background/service-worker.js`)
- Handles API communication
- Receives refinement requests from content script
- Calls Gemini API
- Manages PII scrubbing
- Error handling with fallbacks

#### 5. **PII Scrubber** (`src/utils/pii-scrubber.js`)
- Removes emails, phone numbers, credit cards
- Scrubs SSN, IP addresses, URL credentials
- Extensible pattern matching

#### 6. **Popup Settings** (`popup.html`, `popup.js`)
- User-friendly settings interface
- API key configuration
- API testing capability
- Feature toggles (PII scrubbing, status text)

---

## Technical Details

### Platform Detection Selectors

**Gemini:**
```javascript
[contenteditable="true"][role="textbox"][aria-label*="Message"]
```

**ChatGPT:**
```javascript
textarea[placeholder*="Message"]
[contenteditable="true"][role="textbox"][aria-label*="message"]
```

**Claude:**
```javascript
[contenteditable="true"][data-testid="input-field"]
[contenteditable="true"][aria-label*="message"]
```

### Prompt Refinement Flow

1. **User types** raw input
2. **Click Magic Wand** → Content script captures text
3. **Background worker** receives `refinePrompt` message
4. **PII scrubbing** removes sensitive data
5. **Gemini API** call with structured refinement prompt
6. **Response extracted** from API
7. **Text injected** into input field
8. **Events triggered** (input, change, keydown)
9. **Visual feedback** shows success

### API Request Format

```javascript
{
  contents: [{
    parts: [{ text: "Your refinement prompt here" }]
  }],
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 500
  },
  safetySettings: [...]
}
```

### PII Scrubbing Patterns

- **Emails**: `user@example.com` → `[EMAIL]`
- **Phone**: `(123) 456-7890` → `[PHONE]`
- **Credit Cards**: `4532-1488-0343-6467` → `[CREDIT_CARD]`
- **SSN**: `123-45-6789` → `[SSN]`
- **IP**: `192.168.1.1` → `[IP]`
- **URL Creds**: `http://user:pass@site.com` → `https://[CREDENTIALS]@`

---

## Configuration

### Chrome Storage Keys

```javascript
{
  apiKey: "your-gemini-api-key",
  autoScrubPII: true,
  showStatusText: true
}
```

### Permissions Used

- `storage` - Store API key securely
- `scripting` - Inject content scripts
- `activeTab` - Access current tab
- `webRequest` - Monitor network requests
- `host_permissions` - Access specific domains

---

## Troubleshooting

### Magic Wand doesn't appear?

1. **Refresh the page** - Sometimes DOM loads before extension
2. **Check console** - Open DevTools (F12) → Console for errors
3. **Verify domain** - Extension only works on gemini.google.com, chatgpt.com, claude.ai
4. **Check permissions** - Go to `chrome://extensions` → Details → Site access

### "API key not configured" error?

1. Click extension icon
2. Enter your Gemini API key
3. Click "Test API" to verify it works
4. Refresh the chat page

### Refinement doesn't work?

1. Check if input box is detected (should have ✨ wand nearby)
2. Ensure API key is valid (test in settings)
3. Check quota - Gemini API free tier has limits
4. Look at console for detailed error messages

### Extension breaks after website update?

**This shouldn't happen!** Platform handlers use heuristic selectors (ARIA labels, roles, placeholders) instead of CSS classes. If it does break:

1. Open an issue with your findings
2. Temporarily disable the extension
3. Clear cache and reload

---

## Development

### Project Structure

```
ai-prompt-enhancer/
├── manifest.json                 # Manifest V3 config
├── popup.html                    # Settings UI
├── popup.js                      # Settings logic
├── src/
│   ├── content/
│   │   ├── content-script.js     # Main orchestrator
│   │   └── platform-handlers.js  # Platform-specific logic
│   ├── background/
│   │   └── service-worker.js     # API communication
│   ├── ui/
│   │   ├── magic-wand.js         # Custom web component
│   │   └── styles.css            # Shadow DOM styles
│   └── utils/
│       └── pii-scrubber.js       # PII scrubbing logic
├── images/                       # Icons (optional)
└── README.md                     # This file
```

### Adding a New Platform

1. Extend `BaseHandler` in `platform-handlers.js`:

```javascript
class NewPlatformHandler extends BaseHandler {
  isApplicable() {
    return window.location.hostname.includes('newplatform.com');
  }

  getInputBox() {
    // Return input element using heuristic selectors
    return document.querySelector('[contenteditable="true"]');
  }

  injectUI() {
    // Inject Magic Wand near input
  }
}
```

2. Register in `manifest.json`:

```json
"host_permissions": [
  "https://newplatform.com/*"
]
```

3. Add to handlers array in `content-script.js`

### Extending PII Scrubbing

Add new patterns to `PIIScrubber` in `pii-scrubber.js`:

```javascript
scrubCustomPattern(text) {
  return text.replace(/pattern-here/g, '[REPLACEMENT]');
}
```

### Testing Locally

1. Load unpacked extension
2. Open Chrome DevTools (F12)
3. Check **Console** for logs (prefixed with `[AI Prompt Enhancer]`)
4. Check **Network tab** for API calls
5. Inspect **Shadow DOM** elements in Elements tab

---

## Security Considerations

✅ **What we do:**
- Scrub PII before sending to API
- Store API key locally (encrypted by browser)
- Use HTTPS for all API calls
- Validate API responses
- Minimal permissions requested

⚠️ **What to know:**
- API key is stored in plaintext in `chrome.storage.local` (browser handles encryption)
- Prompts are sent to Google's Gemini API (outside your control)
- We don't have access to your API key after initial setup
- Free tier of Gemini has rate limits and quota

---

## Performance Notes

- **Content script**: ~50KB (minified)
- **Service worker**: ~15KB
- **Shadow DOM**: Zero layout impact
- **Debounce**: 1.5s to prevent API spam
- **Memory**: Minimal - only active on supported domains

---

## Limitations

1. **Only works on**: Gemini, ChatGPT, Claude
2. **Requires**: Active internet + valid API key
3. **Rate limited**: By Google's Gemini API quotas
4. **No history**: Refinements aren't stored
5. **No shortcuts**: Must click wand each time

---

## Future Enhancements

- [ ] Keyboard shortcut (Ctrl+Shift+R)
- [ ] Refinement history
- [ ] Custom prompt templates
- [ ] Multiple API provider support
- [ ] Offline mode with local LLM
- [ ] Advanced settings (temperature, tokens)
- [ ] Dark mode for settings
- [ ] Bulk message refinement

---

## License

This project is provided as-is for personal and commercial use.

---

## Support

If you encounter issues:

1. **Check the FAQ** above
2. **Enable debug mode** in DevTools
3. **Test the API** in settings
4. **Verify selectors** for your platform in console
5. **Report bugs** with detailed information

---

## Credits

Built with ❤️ for AI enthusiasts who want better prompts.

Powered by Google's Gemini API.

---

## Changelog

### v1.0.0 (Initial Release)
- Platform detection for Gemini, ChatGPT, Claude
- Shadow DOM Magic Wand UI
- PII scrubbing
- Glassmorphism design
- Settings management
- API key configuration
- Error handling and visual feedback

---

**Happy prompting! ✨**
