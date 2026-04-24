# ⚡ QUICK FIX REFERENCE - sendMessage Undefined

**Status:** ✅ **FIXED**

---

## The Problem (In One Sentence)
UniversalHandler tried to call `chrome.runtime.sendMessage()` from page context, which has no access to Chrome APIs.

---

## The Solution (In One Sentence)
Moved all Chrome API calls to content-script.js (secure context), keeping UniversalHandler as a pure DOM handler.

---

## Code Changes (Copy-Paste Ready)

### Before ❌
```javascript
// universal-handler.js - BROKEN
async executeRefinement() {
  const rawText = extractText();
  const response = await chrome.runtime.sendMessage({...});  // ❌ ERROR
  injectText(response);
}
```

### After ✅
```javascript
// universal-handler.js - FIXED
async executeRefinement() {
  const rawText = extractText();
  return { text: rawText, target: element };  // ✅ Return data
}

injectRefinedText(target, refinedText) {
  target.focus();
  document.execCommand('insertText', false, refinedText);  // ✅ DOM only
}

// content-script.js - FIXED
document.addEventListener('refine-prompt-trigger', async () => {
  const result = await handler.executeRefinement();
  chrome.runtime.sendMessage({...}, (response) => {  // ✅ Safe here
    handler.injectRefinedText(result.target, response.refinedText);
  });
});
```

---

## Why This Works

| Layer | Has chrome API | Job |
|-------|---|---|
| **Page Context** | ❌ No | Extract text, inject text (DOM only) |
| **Content Script** | ✅ Yes | Bridge, handle chrome.runtime calls |
| **Service Worker** | ✅ Yes | API calls, storage |

---

## Files Modified

| File | Change |
|------|--------|
| `src/content/universal-handler.js` | executeRefinement returns data, added injectRefinedText() |
| `src/content/content-script.js` | Now handles chrome.runtime.sendMessage() |

---

## Testing
```
1. Reload extension (chrome://extensions)
2. Go to gemini.google.com
3. Click wand
4. No error = ✅ SUCCESS
```

---

## Remember
- **Page scripts** = No chrome APIs (security isolation)
- **Content scripts** = Some chrome APIs (bridge)
- **Service workers** = Full chrome APIs (backend)

**Always delegate to the appropriate layer!**

---
