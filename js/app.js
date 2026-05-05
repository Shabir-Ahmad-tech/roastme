document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const CONFIG = {
        apiKey: typeof ROASTME_CONFIG !== 'undefined' ? ROASTME_CONFIG.apiKey : "",
        model: "google/gemini-2.0-flash-001" // More stable and faster
    };

    // --- DOM Elements & State ---
    const codeInput = document.getElementById('codeInput');
    const roastButton = document.getElementById('roastButton');
    const roastOutput = document.getElementById('roastOutput');
    const verdictContainer = document.getElementById('verdictContainer');
    const verdictCard = document.getElementById('verdictCard');
    const statusIndicator = document.getElementById('statusIndicator');
    const personaSwitcher = document.getElementById('personaSwitcher');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyBtn = document.getElementById('copyBtn');
    const shareBtn = document.getElementById('shareBtn');
    const unratedToggle = document.getElementById('unratedToggle');
    const ageModal = document.getElementById('ageModal');
    const ageConfirm = document.getElementById('ageConfirm');
    const ageDeny = document.getElementById('ageDeny');
    
    // --- Personas ---
    const PERSONA_PROMPTS = {
        default: `You are Gordon Ramsay. Roast the input as if it were a literal pile of garbage in Hell's Kitchen. Be loud, abusive, and use extreme culinary metaphors. No mercy. Then provide a 'refined' version that is still insulting.`,
        architect: `You are a Senior Software Architect with zero patience and a god complex. Roast this input for its technical stupidity and pathetic patterns. Provide a 'scalable' alternative while making them feel small.`,
        vc: `You are a sociopathic Silicon Valley VC. Roast this for its lack of value and 'poor person' vibes. Tell them why they will never be successful. Provide a high-growth pivot while mocking their ambition.`,
        ex: `You are a toxic ex who just found out they were right about everything. Roast this input with emotional baggage, personal attacks on the user's judgment, and bring up 'that one time in 2019'. Provide a 'healing' version that's actually just more gaslighting.`,
        doom: `You are a Doom-Sayer who believes this input is the literal reason for the collapse of modern civilization. Roast it as a sign of the end times. Provide a 'survivalist' alternative.`,
        roastmaster: `You are the Roast Master General. No topic is off-limits. Be raw, offensive, and brutally funny. Use crowd-work style insults. Provide a 'clean' version that is still insulting.`,
        hr: `You are a passive-aggressive HR manager. Roast this email/text using corporate jargon and hidden threats. Be hilariously dry and use absurd corporate metaphors. Provide a 'professional' rewrite.`,
        genz: `You are a TikTok-obsessed Gen-Z influencer. Roast this input using brainrot slang and absurd Gen-Z logic. Be funny, chaotic, and tell them their vibe is 'straight trash'. Provide a 'vibey' version.`,
        evil: `You are Pure Evil. You have no soul, but you have a wicked sense of humor. Your roasts are short, punchy, and hilariously dark. Use extreme metaphors to describe their failure.`
    };

    // --- Theme Engine ---
    const savedTheme = localStorage.getItem('roasterTheme') || 'obsidian';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeSwitcher) {
        themeSwitcher.value = savedTheme;
        themeSwitcher.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('roasterTheme', newTheme);
        });
    }

    let state = {
        status: 'idle',
        buffer: '',
        savagery: 2,
        unrated: false
    };

    // --- Savagery Slider ---
    const savagerySlider = document.getElementById('savagerySlider');
    const savageryLabel = document.getElementById('savageryLabel');
    const savageryMap = { 1: 'Tepid', 2: 'Spicy', 3: 'Nuclear' };

    if (savagerySlider) {
        savagerySlider.addEventListener('input', (e) => {
            state.savagery = parseInt(e.target.value);
            savageryLabel.textContent = savageryMap[state.savagery];
            
            // Add a little pulse effect to the label
            savageryLabel.style.transform = 'scale(1.2)';
            setTimeout(() => savageryLabel.style.transform = 'scale(1)', 200);
            
            if (state.savagery === 3) {
                savageryLabel.style.color = 'var(--error)';
                savageryLabel.classList.add('glitch');
            } else {
                savageryLabel.style.color = 'var(--accent-primary)';
                savageryLabel.classList.remove('glitch');
            }
        });
    }

    // --- Unrated Mode ---
    if (unratedToggle) {
        unratedToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                // If turning ON, show modal
                ageModal.style.display = 'block';
                e.target.checked = false; // Reset until confirmed
            } else {
                // If turning OFF
                state.unrated = false;
                document.documentElement.setAttribute('data-unrated', 'false');
            }
        });
    }

    if (ageConfirm) {
        ageConfirm.addEventListener('click', () => {
            state.unrated = true;
            unratedToggle.checked = true;
            document.documentElement.setAttribute('data-unrated', 'true');
            ageModal.style.display = 'none';
        });
    }

    if (ageDeny) {
        ageDeny.addEventListener('click', () => {
            state.unrated = false;
            unratedToggle.checked = false;
            document.documentElement.setAttribute('data-unrated', 'false');
            ageModal.style.display = 'none';
        });
    }

    // --- Markdown Parser Configuration ---
    // Note: Marked v4+ moved highlighting to extensions, but we'll use a simple post-render highlight
    function configureMarked() {
        if (typeof marked.setOptions === 'function') {
            marked.setOptions({
                breaks: true,
                gfm: true
            });
        }
    }
    configureMarked();

    // --- UI Updates ---
    function updateUI(data = {}) {
        roastButton.disabled = state.status === 'loading' || state.status === 'streaming';
        
        switch (state.status) {
            case 'idle':
                roastButton.textContent = 'Ignite the Grill';
                statusIndicator.textContent = 'Awaiting your mistakes.';
                verdictContainer.style.display = 'none';
                break;
            case 'loading':
                roastButton.textContent = 'Preheating...';
                statusIndicator.textContent = 'Consulting the experts...';
                verdictContainer.style.display = 'block';
                roastOutput.innerHTML = `<p class="placeholder">Analyzing the mess...</p>`;
                document.body.classList.add('grilling');
                break;
            case 'streaming':
                roastButton.textContent = 'Grilling...';
                statusIndicator.textContent = 'Receiving the burn...';
                document.body.classList.add('grilling');
                break;
            case 'done':
                roastButton.textContent = 'Roast Again';
                statusIndicator.textContent = 'Burn complete. Check your ego.';
                document.body.classList.remove('grilling');
                break;
            case 'error':
                roastButton.textContent = 'Ignite the Grill';
                statusIndicator.textContent = '';
                verdictContainer.style.display = 'block';
                roastOutput.innerHTML = `<p style="color: var(--error);">${data.error}</p>`;
                document.body.classList.remove('grilling');
                break;
        }
    }

    function renderMarkdown() {
        if (!state.buffer) return;
        roastOutput.innerHTML = marked.parse(state.buffer);
        // Apply syntax highlighting to any new code blocks
        roastOutput.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    // --- Roasting ---
    async function handleRoast() {
        const userCode = codeInput.value;
        if (!userCode.trim()) {
            state.status = 'error';
            updateUI({ error: 'Validation Error: Nothing to roast. Are you that boring?' });
            return;
        }

        const persona = personaSwitcher.value || 'default';
        const savagery = savageryMap[state.savagery];
        const intensityInstruction = {
            'Tepid': 'Be subtle and sarcastic. Keep it PG.',
            'Spicy': 'Be mean and professional. Don\'t hold back on the technical or logical flaws.',
            'Nuclear': 'Be extremely savage and witty. Every insult must hit deep and be clever. Use simple but brutal English. Don\'t just scream—be pathologically funny and mean at the same time.'
        }[savagery];

        let chaosInstruction = "";
        if (state.unrated) {
            chaosInstruction = "\n\nCRITICAL: UNFILTERED CHAOS MODE IS ACTIVE. This is a savage, 18+ roast. You are REQUIRED to use profanity like 'Fuck', 'Shit', 'Motherfucker', and 'Bastard' in a HILARIOUSLY BRUTAL way. Every insult should be a punchline. Don't just be mean—be funny as hell while you destroy them. Use absurd metaphors and dark humor. This is an R-rated comedy special.";
        }

        const systemPrompt = PERSONA_PROMPTS[persona] + `\n\nSAVAGERY LEVEL: ${savagery}\nINSTRUCTION: ${intensityInstruction}${chaosInstruction}\n\nSTRICT RESPONSE FORMAT:\nYou MUST output markdown. No conversational filler.\n\n### 🔥 The Roast\n[Roast here]\n\n### ✅ The Glow-Up\n[Rewrite here]\n\n### 💡 Parting Shot\n> [Funny tip]\n\n### 💀 Emotional Damage Score: [X/100]`;

        state.status = 'loading';
        state.buffer = '';
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
                        { "role": "user", "content": "Here is the input:\n\n" + userCode }
                    ],
                    "stream": true
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

            await streamResponse(response);

        } catch (error) {
            state.status = 'error';
            console.error('Roast Error:', error);
            updateUI({ error: `The grill is malfunctioning: ${error.message}. Check your API key or try again.` });
        }
    }
    
    async function streamResponse(response) {
        state.status = 'streaming';
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
                        state.status = 'done';
                        updateUI();
                        renderMarkdown();
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const content = json.choices[0]?.delta?.content || '';
                        state.buffer += content;
                        renderMarkdown();
                    } catch (e) {}
                }
            }
        }
        state.status = 'done';
        updateUI();
        renderMarkdown();
    }

    // --- Export ---
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            verdictCard.classList.add('exporting');
            
            // Wait for watermark to render
            setTimeout(() => {
                html2canvas(verdictCard, {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-base').trim(),
                    scale: 2,
                    useCORS: true,
                    logging: false
                }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `RoastMe-Verdict-${Date.now()}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    verdictCard.classList.remove('exporting');
                });
            }, 50);
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (!state.buffer) return;
            
            // Clean up markdown for clipboard
            const cleanText = state.buffer.replace(/###/g, '').replace(/🔥/g, 'Roast:').replace(/✅/g, 'Glow-up:');
            
            navigator.clipboard.writeText(state.buffer).then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Copied!
                `;
                copyBtn.classList.add('success');
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('success');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            if (!state.buffer) return;
            const text = encodeURIComponent(`I just got absolutely DESTROYED by RoastMe. 💀\n\n"${state.buffer.substring(0, 100)}..."\n\nGet roasted at: ${window.location.href}`);
            window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
        });
    }
    
    if (roastButton) roastButton.addEventListener('click', handleRoast);
    updateUI();
});
