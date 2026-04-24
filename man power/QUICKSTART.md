# Quick Start Guide

## 5-Minute Setup

### Step 1: Get API Key (1 min)
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key to clipboard

### Step 2: Load Extension (2 min)
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `ai-prompt-enhancer` folder
5. Extension appears in toolbar

### Step 3: Configure (1 min)
1. Click extension icon in toolbar
2. Paste your API key
3. Click **Test API** (should show green checkmark)
4. Click **Save Settings**

### Step 4: Use It (1 min)
1. Go to [Gemini](https://gemini.google.com), [ChatGPT](https://chatgpt.com), or [Claude](https://claude.ai)
2. Type a prompt
3. Click the ✨ **Magic Wand** button next to your input
4. Watch it refine automatically!

---

## Example Usage

**Before:**
```
give me python code for web scraping
```

**After (AI-Refined):**
```
I need a Python script for web scraping with the following requirements:
- Use the requests library to fetch HTML
- Parse with BeautifulSoup
- Extract data from a list of URLs
- Handle errors gracefully
- Save results to CSV
- Include proper headers and rate limiting

Please provide well-commented code.
```

---

## Keyboard Shortcuts

- `F12` - Open DevTools (for troubleshooting)
- `Ctrl+Shift+I` - Inspect element
- None yet for the extension (roadmap item!)

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Wand doesn't appear | Refresh page, check domain is supported |
| "API key not configured" | Click extension icon, enter key, save |
| API test fails | Check key is valid at makersuite.google.com |
| No refinement happens | Check console (F12) for errors |
| Extension breaks after update | Uses heuristic selectors, should be fine - clear cache |

---

## File Structure Explained

```
ai-prompt-enhancer/
│
├── manifest.json
│   └─ Tells Chrome about the extension
│      (permissions, content scripts, etc.)
│
├── popup.html + popup.js
│   └─ Settings page (opens when you click icon)
│
└── src/
    ├── content/
    │   ├── content-script.js
    │   │   └─ Runs on every page, initializes handlers
    │   └── platform-handlers.js
    │       └─ Detects input boxes on Gemini/ChatGPT/Claude
    │
    ├── background/
    │   └── service-worker.js
    │       └─ Handles API calls behind the scenes
    │
    ├── ui/
    │   ├── magic-wand.js
    │   │   └─ The sparkly button UI
    │   └── styles.css
    │       └─ Styling for the button
    │
    └── utils/
        └── pii-scrubber.js
            └─ Removes emails, phones, etc. before sending
```

---

## How It Actually Works

```
You Type → Click Wand → Content Script Captures Text
                              ↓
                    Background Worker Receives Message
                              ↓
                    Removes Personal Info (PII)
                              ↓
                    Calls Google's Gemini API
                              ↓
                    Gets Back Refined Prompt
                              ↓
                    Injects Into Chat Box
                              ↓
                    Triggers Change Events
                              ↓
                    Shows "Refined!" ✅
```

---

## API Quota Info

**Free Tier Limits:**
- 60 requests per minute
- 1,500 requests per day
- Limited context window

**Paid Tier:**
- Unlimited requests
- Larger context windows
- Higher rate limits

Check usage at: https://makersuite.google.com/app/apikey

---

## Privacy & Security

✅ **Safe:**
- API key stays in your browser
- Prompts never stored
- No tracking or analytics
- Open source (you can audit it)

⚠️ **Note:**
- Prompts sent to Google's servers (encrypted)
- PII is scrubbed but not 100% foolproof
- Review what gets sent before using sensitive info

---

## Tips & Tricks

1. **Better prompts = Better refinements**
   - Start with specific intent
   - Example: "Write Python code for web scraping with error handling"

2. **Use it before complex requests**
   - Great for coding questions
   - Good for research/writing
   - Less useful for casual chat

3. **Check the refined version**
   - Read what was refined
   - Edit if needed before sending
   - You're in control

4. **Keyboard tip**
   - Tab to the input box
   - Tab to the Magic Wand
   - Space to click (sometimes)

---

## Need Help?

1. Check console for errors: **F12 → Console**
2. Test API in settings: Extension icon → Test API
3. Verify domain: Only works on gemini.google.com, chatgpt.com, claude.ai
4. Clear cache: **Ctrl+Shift+Delete** → Clear all time

---

## Next Steps

- ⭐ **Star this repo** if you find it useful!
- 🐛 **Report bugs** with details
- 💡 **Suggest features** in issues
- 🚀 **Fork and improve** the code

Happy prompting! ✨
