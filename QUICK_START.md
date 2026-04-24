# ⚡ QUICK START - AI Prompt Enhancer

**Time Estimate:** 5 minutes to deploy  
**Status:** ✅ Ready to use  

---

## 1️⃣ RELOAD EXTENSION (1 min)

```
chrome://extensions
   ↓
Find "AI Prompt Enhancer"
   ↓
Click RELOAD button (circular arrow)
```

## 2️⃣ GET API KEY (2 min)

Go to: https://makersuite.google.com/app/apikey

Click "Create API key" button → Copy the key

## 3️⃣ SAVE API KEY (1 min)

1. Click extension icon in Chrome toolbar
2. Paste API key into field
3. Click "Test API" button
4. Click "Save Settings"

## 4️⃣ TEST (1 min)

1. Go to https://gemini.google.com
2. Focus the input box → See ✨ wand
3. Type: `"hello world"`
4. Click the wand
5. See refined text appear

---

## 📋 WHAT EACH FILE DOES

| File | Purpose |
|------|---------|
| `service-worker.js` | Calls Google Gemini API, fetches API key from storage |
| `popup.js` | Settings UI, saves/loads API key |
| `universal-handler.js` | Detects inputs, renders wand, extracts/injects text |
| `content-script.js` | Connects popup to handler |
| `manifest.json` | Extension configuration |

---

## 🔑 KEY CONSTANTS

**API Key Storage:** `chrome.storage.local['geminiApiKey']`

**API Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`

**Websites Supported:** Any with text input (Gemini, ChatGPT, Claude, etc.)

---

## ❓ TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Wand doesn't appear | Open F12 console, check for errors, reload extension |
| API test fails | Verify key is correct, no extra spaces, check internet |
| Text doesn't update | Check console for errors, try different website |
| Extension won't load | Go to chrome://extensions, click RELOAD |

---

## 📞 CONSOLE LOGS TO EXPECT

When you click the wand, you should see in F12 console:

```
[Service Worker] 📬 Received refinement request
[Service Worker] 🔑 API key found, calling Gemini...
[Service Worker] 🚀 Calling Gemini 1.5 Flash API
[Service Worker] ✅ Success! Refined text received: [preview...]
```

---

## ✅ VERIFICATION

Test these steps:
1. [ ] Extension reloaded (no console errors)
2. [ ] API key saved in popup
3. [ ] Test API button shows "✅ API test successful"
4. [ ] Wand appears on Gemini input focus
5. [ ] Click wand → console shows API logs
6. [ ] Input text updates with refined content
7. [ ] Status message shows "✨ Refined!" (green)

---

## 🎯 NEXT: TEST ON OTHER SITES

Try these websites to verify universal compatibility:

- [ ] ChatGPT (https://chatgpt.com)
- [ ] Claude (https://claude.ai)
- [ ] Gmail compose
- [ ] Twitter/X
- [ ] LinkedIn

Click any text input, wand should appear → Works!

---

**That's it! You're done. Enjoy your AI Prompt Enhancer! 🎉**
