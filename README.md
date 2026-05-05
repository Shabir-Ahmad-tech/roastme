<div align="center">
  <h1>🔥 RoastMe</h1>
  <p><strong>The Premium AI-Powered Roast & Glow-Up Engine for Literally Anything</strong></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#configuration">Configuration</a> •
    <a href="#the-themes">The Themes</a>
  </p>
</div>

---

## 📖 Overview
RoastMe is an enterprise-grade, zero-backend web application designed to analyze, critique, and refactor almost anything you write. Paste in your code, an email draft, a bad startup idea, or your dating app bio. Our AI will provide hilariously savage feedback—and then actually help you fix it.

## ✨ Features
- **Elite AI Persona Formulation:** Strict system prompting ensures zero AI filler ("As an AI language model..."). Just pure, actionable critique and beautiful code.
- **Dynamic Theme Engine:** Switch instantly between three radically different CSS architectures (`Cyberpunk`, `FAANG Enterprise`, and `Retro Terminal`).
- **Real-Time Markdown Streaming:** Server-Sent Events (SSE) stream the AI's response directly into a customized `marked.js` rendering pipeline so you can read the roast as it generates.
- **Syntax Highlighting:** Integrated `highlight.js` with the *Tokyo Night Dark* theme ensures all refactored code blocks are beautifully formatted.
- **Zero-Backend Architecture:** Runs entirely in the browser, communicating directly with frontier AI models via the OpenRouter API.

## 🎨 The Themes
RoastMe features a robust `data-theme` CSS architecture. Switching themes instantly transforms typography, padding, borders, shadows, and color palettes.
1. **Cyberpunk (Default):** Glitch effects, neon cyan, hot pink accents, and deep glassmorphism.
2. **FAANG Enterprise:** Massive negative space, stark white layouts, elegant drop shadows, and clean geometric typography (`Plus Jakarta Sans`).
3. **Retro Terminal:** Pitch black backgrounds, glowing Matrix-green text (`VT323`), inverted hover states, and brutalist flat UI design.
4. **Clown Fiesta:** Comic Sans, chaotic yellow/orange gradients, and obnoxious rounded borders. Pure eye-bleed.
5. **Zen Garden:** Minimalist beige, elegant serif fonts, and soft sage greens. Completely ironic for a roasting app.

## 🚀 Quick Start
Since RoastMe is a client-side app, getting started takes seconds.

1. Clone the repository:
   ```bash
   git clone https://github.com/Shabir-Ahmad-tech/roastme.git
   ```
2. Open `index.html` in your browser or serve it via a local development server (e.g., VS Code Live Server).

## ⚙️ Configuration
You must provide your own OpenRouter API key to communicate with the AI models.

Open `js/app.js` and locate the `CONFIG` object at the top of the file:
```javascript
const CONFIG = {
    // ENTER YOUR OPENROUTER API KEY HERE
    apiKey: "sk-or-your-api-key-here",
    
    // CHOOSE YOUR MODEL HERE
    // e.g. "google/gemma-7b-it", "anthropic/claude-3-sonnet-20240229"
    model: "openrouter/owl-alpha" 
};
```

## 🛠️ Technology Stack
- **Core:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Markdown Parsing:** [Marked.js](https://marked.js.org/)
- **Syntax Highlighting:** [Highlight.js](https://highlightjs.org/)
- **API Provider:** [OpenRouter](https://openrouter.ai/)

## 📜 License
Distributed under the MIT License. Feel free to fork, modify, and roast your own code.
