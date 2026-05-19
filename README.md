# 🚀 Syn-Nex: Real-Time Prompt Optimization Middleware

Syn-Next is a context-aware browser extension and middleware layer designed to supercharge user prompts in real-time. By intercepting raw, standard queries within mainstream AI chat interfaces, Syn-Next automatically upgrades them into high-fidelity, structurally optimized instructions with a single click of its signature **Wand UI Element**.

> **"AI Decides How to Talk to Itself"** — Syn-Next bridges the gap between everyday user language and professional prompt engineering, yielding **10x superior AI outputs** while dramatically decreasing bad requests.

---

## 📺 Visual Demo

<video src="assets/demmo.video.mp4" autoplay loop muted playsinline width="100%"></video>

*Instant prompt transformation utilizing the non-intrusive Wand UI handler.*

---

## 🏗️ System Architecture & Tech Stack

Syn-Next is engineered for zero-latency interference and high reliability:

* **Frontend Injection:** Vanilla JavaScript/TypeScript, MutationObserver API for precise DOM manipulation.
* **Background Processing:** Chrome Service Workers for isolated, secure prompt reconstruction.
* **UI/UX:** TailwindCSS (encapsulated to prevent CSS bleeding into host sites).

### 🔄 The Execution Pipeline

```text
[ Raw User Input ] ──> [ Typing Pauses ] ──> [ 🪄 Wand UI Renders ]
                                                     │
                                            (User Clicks Wand)
                                                     │
                    ┌────────────────────────────────┴────────────────────────────────┐
                    ▼                                                                 ▼
        [ Intent Extraction ]  ──>  [ Context Mapping ]  ──>  [ Persona Injection ]
                    │                                                                 │
                    └────────────────────────────────┬────────────────────────────────┘
                                                     │
                                                     ▼
                              [ High-Fidelity Prompt Injected to DOM ] ──> [ Target AI Response ]
```

---

## 📊 Expected Value & Impact

Syn-Next isn't just a UX tool; it's an optimization engine designed to deliver:

* **Prompt Elevation:** Massively increases syntactic depth and structural vocabulary.
* **Execution Latency:** Near-instantaneous injection (**< 120ms** target).
* **Bad Request Mitigation:** Significant reduction in systemic generic or broken LLM responses.
* **First-Turn Success:** Achieves desired output without the need for follow-up refinement loops.

---

## ⚙️ Quick Start & Installation

### Local Development Setup
1. Clone the repository:
   ```bash
   git clone [https://github.com/](https://github.com/)[NEE-GITHUB-USERNAME]/syn-next.git
   cd syn-next
   ```
2. Open your browser and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** on (top right corner).
4. Click **Load unpacked** and select the root directory of this project.

---

## 🗺️ Product Roadmap

- [x] Core DOM Interception & Wand UI Injection
- [x] Real-time Prompt Re-engineering Engine
- [ ] Native support for localized AI models (Ollama, LM Studio).
- [ ] Custom user-defined prompt templates.

---

## 👨‍💻 Developed By

**[Nee Full Name]** *Full-Stack / AI Tooling Developer* * 💼 LinkedIn: [Nee LinkedIn URL]  
* 🐙 GitHub: [Nee GitHub Profile URL]  
* ✉️ Email: [Nee Email Address]
