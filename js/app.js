/**
 * RoastMe - Premium AI Roasting Platform
 * Organized for Production-Grade Scalability
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURATION ---
    const CONFIG = {
        apiKey: typeof ROASTME_CONFIG !== 'undefined' ? ROASTME_CONFIG.apiKey : "",
        model: "google/gemini-2.0-flash-001",
        savageryMap: { 1: 'Tepid', 2: 'Spicy', 3: 'Nuclear' }
    };

    // --- 2. STATE MANAGEMENT ---
    let state = {
        app: 'idle', // idle | loading | streaming | done | error
        ui: {
            isDrawerOpen: false,
            currentTheme: localStorage.getItem('roasterTheme') || 'obsidian'
        },
        data: {
            buffer: '',
            savagery: 2,
            unrated: false,
            caseId: '#0000'
        }
    };

    // --- 3. DOM ELEMENTS ---
    const elements = {
        // Core
        codeInput: document.getElementById('codeInput'),
        roastButton: document.getElementById('roastButton'),
        roastOutput: document.getElementById('roastOutput'),
        statusIndicator: document.getElementById('statusIndicator'),
        
        // Verdict
        verdictContainer: document.getElementById('verdictContainer'),
        verdictCard: document.getElementById('verdictCard'),
        caseIdLabel: document.getElementById('caseId'),
        
        // Drawer & Settings
        drawer: document.getElementById('settingsDrawer'),
        openSettingsBtn: document.getElementById('openSettings'),
        closeSettingsBtn: document.getElementById('closeSettings'),
        closeDrawerBtn: document.getElementById('closeDrawer'),
        personaSwitcher: document.getElementById('personaSwitcher'),
        themeSwitcher: document.getElementById('themeSwitcher'),
        savagerySlider: document.getElementById('savagerySlider'),
        savageryLabel: document.getElementById('savageryLabel'),
        unratedToggle: document.getElementById('unratedToggle'),
        
        // Modals
        ageModal: document.getElementById('ageModal'),
        ageConfirm: document.getElementById('ageConfirm'),
        ageDeny: document.getElementById('ageDeny'),
        
        // Actions
        downloadBtn: document.getElementById('downloadBtn'),
        copyBtn: document.getElementById('copyBtn')
    };

    // --- 4. PERSONA PROMPTS ---
    const PERSONA_PROMPTS = {
        default: `You are Gordon Ramsay. Roast the input as if it were a literal pile of garbage in Hell's Kitchen. Be loud, abusive, and use extreme culinary metaphors. No mercy. Then provide a 'refined' version that is still insulting.`,
        architect: `You are a Senior Software Architect with zero patience and a god complex. Roast this input for its technical stupidity and pathetic patterns. Provide a 'scalable' alternative while making them feel small.`,
        vc: `You are a sociopathic Silicon Valley VC. Roast this for its lack of value and 'poor person' vibes. Tell them why they will never be successful. Provide a high-growth pivot while mocking their ambition.`,
        ex: `You are a toxic ex who just found out they were right about everything. Roast this input with emotional baggage, personal attacks on the user's judgment, and bring up 'that one time in 2019'. Provide a 'healing' version that's actually just more gaslighting.`,
        roastmaster: `You are the Roast Master General. No topic is off-limits. Be raw, offensive, and brutally funny. Use crowd-work style insults. Provide a 'clean' version that is still insulting.`,
        genz: `You are a TikTok-obsessed Gen-Z influencer. Roast this input using brainrot slang and absurd Gen-Z logic. Be funny, chaotic, and tell them their vibe is 'straight trash'. Provide a 'vibey' version.`,
        evil: `You are Pure Evil. You have no soul, but you have a wicked sense of humor. Your roasts are short, punchy, and hilariously dark. Use extreme metaphors to describe their failure.`
    };

    // --- 5. DRAWER & UI LOGIC ---
    const toggleDrawer = (force) => {
        state.ui.isDrawerOpen = force !== undefined ? force : !state.ui.isDrawerOpen;
        elements.drawer.classList.toggle('open', state.ui.isDrawerOpen);
    };

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('roasterTheme', theme);
        state.ui.currentTheme = theme;
    };

    const generateCaseId = () => {
        const id = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
        state.data.caseId = `#${id}`;
        elements.caseIdLabel.textContent = state.data.caseId;
    };

    // --- 6. RENDER & UPDATES ---
    const updateUI = (data = {}) => {
        const { app } = state;
        elements.roastButton.disabled = (app === 'loading' || app === 'streaming');
        
        switch (app) {
            case 'idle':
                elements.roastButton.textContent = 'Ignite the Grill';
                elements.statusIndicator.textContent = 'Awaiting your mistakes.';
                elements.verdictContainer.style.display = 'none';
                break;
            case 'loading':
                elements.roastButton.textContent = 'Preheating...';
                elements.statusIndicator.textContent = 'Consulting the experts...';
                elements.verdictContainer.style.display = 'block';
                elements.roastOutput.innerHTML = `<p class="placeholder">Analyzing the mess...</p>`;
                document.body.classList.add('grilling');
                generateCaseId();
                break;
            case 'streaming':
                elements.roastButton.textContent = 'Grilling...';
                elements.statusIndicator.textContent = 'Receiving the burn...';
                break;
            case 'done':
                elements.roastButton.textContent = 'Roast Again';
                elements.statusIndicator.textContent = 'Burn complete. Check your ego.';
                document.body.classList.remove('grilling');
                break;
            case 'error':
                elements.roastButton.textContent = 'Try Again';
                elements.statusIndicator.textContent = 'Grill malfunction.';
                elements.roastOutput.innerHTML = `<p style="color: var(--error);">${data.error || 'Unknown Error'}</p>`;
                document.body.classList.remove('grilling');
                break;
        }
    };

    const renderMarkdown = () => {
        if (!state.data.buffer) return;
        elements.roastOutput.innerHTML = marked.parse(state.data.buffer);
        elements.roastOutput.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
    };

    // --- 7. AI & API LOGIC ---
    async function handleRoast() {
        const input = elements.codeInput.value.trim();
        if (!input) {
            state.app = 'error';
            updateUI({ error: 'Validation Error: Nothing to roast. Are you that boring?' });
            return;
        }

        const persona = elements.personaSwitcher.value;
        const savageryText = CONFIG.savageryMap[state.data.savagery];
        const intensityInstruction = {
            'Tepid': 'Be subtle and sarcastic. Keep it PG.',
            'Spicy': 'Be mean and professional. Don\'t hold back on the technical or logical flaws.',
            'Nuclear': 'Be extremely savage and witty. Every insult must hit deep and be clever.'
        }[savageryText];

        let chaos = state.data.unrated ? "\n\nCRITICAL: UNFILTERED CHAOS MODE ACTIVE. Use profanity and be brutally funny/dark." : "";

        const systemPrompt = PERSONA_PROMPTS[persona] + 
            `\n\nSAVAGERY: ${savageryText}\nINSTRUCTION: ${intensityInstruction}${chaos}` +
            `\n\nSTRICT MARKDOWN FORMAT:\n### 🔥 The Roast\n### ✅ The Glow-Up\n### 💡 Parting Shot\n### 💀 Emotional Damage: [X/100]`;

        state.app = 'loading';
        state.data.buffer = '';
        updateUI();

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${CONFIG.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": CONFIG.model,
                    "messages": [
                        { "role": "system", "content": systemPrompt },
                        { "role": "user", "content": "Here is the input:\n\n" + input }
                    ],
                    "stream": true
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            await streamResponse(response);

        } catch (error) {
            state.app = 'error';
            updateUI({ error: error.message });
        }
    }

    async function streamResponse(response) {
        state.app = 'streaming';
        updateUI();
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let chunkBuffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunkBuffer += decoder.decode(value, { stream: true });
            const lines = chunkBuffer.split('\n');
            chunkBuffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.substring(6);
                    if (data.trim() === '[DONE]') {
                        finishRoast();
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const content = json.choices[0]?.delta?.content || '';
                        state.data.buffer += content;
                        renderMarkdown();
                    } catch (e) {}
                }
            }
        }
        finishRoast();
    }

    const finishRoast = () => {
        state.app = 'done';
        updateUI();
        renderMarkdown();
    };

    // --- 8. EXPORT & SHARING ---
    const setupSharing = () => {
        elements.downloadBtn.addEventListener('click', () => {
            elements.verdictCard.classList.add('exporting');
            setTimeout(() => {
                html2canvas(elements.verdictCard, {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-base').trim(),
                    scale: 2,
                    useCORS: true
                }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `RoastMe-Verdict-${state.data.caseId}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    elements.verdictCard.classList.remove('exporting');
                });
            }, 100);
        });

        elements.copyBtn.addEventListener('click', () => {
            if (!state.data.buffer) return;
            navigator.clipboard.writeText(state.data.buffer).then(() => {
                const original = elements.copyBtn.innerHTML;
                elements.copyBtn.innerHTML = '<span>Copied!</span>';
                setTimeout(() => elements.copyBtn.innerHTML = original, 2000);
            });
        });
    };

    // --- 9. INITIALIZATION ---
    const init = () => {
        // Theme
        applyTheme(state.ui.currentTheme);
        elements.themeSwitcher.value = state.ui.currentTheme;

        // Drawer
        elements.openSettingsBtn.addEventListener('click', () => toggleDrawer(true));
        elements.closeSettingsBtn.addEventListener('click', () => toggleDrawer(false));
        elements.closeDrawerBtn.addEventListener('click', () => toggleDrawer(false));

        // Settings Listeners
        elements.themeSwitcher.addEventListener('change', (e) => applyTheme(e.target.value));
        
        elements.savagerySlider.addEventListener('input', (e) => {
            state.data.savagery = parseInt(e.target.value);
            elements.savageryLabel.textContent = CONFIG.savageryMap[state.data.savagery];
        });

        elements.unratedToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                elements.ageModal.style.display = 'flex';
                e.target.checked = false;
            } else {
                state.data.unrated = false;
                document.documentElement.setAttribute('data-unrated', 'false');
            }
        });

        elements.ageConfirm.addEventListener('click', () => {
            state.data.unrated = true;
            elements.unratedToggle.checked = true;
            document.documentElement.setAttribute('data-unrated', 'true');
            elements.ageModal.style.display = 'none';
        });

        elements.ageDeny.addEventListener('click', () => {
            elements.ageModal.style.display = 'none';
        });

        // Main Action
        elements.roastButton.addEventListener('click', handleRoast);

        // Sharing
        setupSharing();

        // Markdown Init
        if (typeof marked.setOptions === 'function') {
            marked.setOptions({ breaks: true, gfm: true });
        }
    };

    init();
});
