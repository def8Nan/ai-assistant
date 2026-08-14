// widget.js
(function () {
    const chatIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    const closeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    const sendIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>`;

    window.AI = {
        init: function (config) {
            const apiUrl = config.apiUrl || "http://127.0.0.1:8000/chat";
            injectStyles();
            createWidgetHTML(apiUrl);
        }
    };

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #ai-widget-btn {
                position: fixed; bottom: 24px; right: 24px;
                width: 64px; height: 64px; border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; border: none; cursor: pointer;
                box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
                z-index: 9999; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex; align-items: center; justify-content: center;
            }
            #ai-widget-btn:hover {
                transform: translateY(-4px) scale(1.05);
                box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.5);
            }
            #ai-widget-btn:active { transform: translateY(0) scale(0.95); }
            #ai-widget-btn svg { width: 28px; height: 28px; }

            #ai-widget-window {
                position: fixed; bottom: 100px; right: 24px;
                width: 380px; max-width: calc(100vw - 32px);
                height: 600px; max-height: calc(100vh - 140px);
                background: #ffffff; border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.08);
                display: none; flex-direction: column; z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                overflow: hidden; opacity: 0; transform: translateY(20px) scale(0.95);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            #ai-widget-window.active {
                display: flex; opacity: 1; transform: translateY(0) scale(1);
            }

            .ai-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; padding: 16px 20px; display: flex;
                justify-content: space-between; align-items: center;
                position: relative; overflow: hidden;
            }
            .ai-header::before {
                content: ''; position: absolute; top: -50%; right: -20%;
                width: 200px; height: 200px; background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
            }
            .ai-header-left { display: flex; align-items: center; z-index: 1; }
            .ai-header-info h3 { margin: 0; font-size: 16px; font-weight: 600; }
            .ai-header-info p {
                margin: 2px 0 0 0; font-size: 12px; opacity: 0.9;
                display: flex; align-items: center; gap: 4px;
            }
            .ai-status-dot {
                width: 8px; height: 8px; background: #4ade80; border-radius: 50%;
                display: inline-block; box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.3);
                animation: pulse 2s infinite;
            }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

            .ai-header-buttons { display: flex; gap: 8px; align-items: center; z-index: 1; }

            .ai-new-chat-btn {
                background: rgba(255, 255, 255, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white; padding: 6px 12px; border-radius: 8px;
                cursor: pointer; font-size: 13px; font-weight: 500;
                transition: all 0.2s; backdrop-filter: blur(10px);
                font-family: inherit;
            }
            .ai-new-chat-btn:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: scale(1.02);
            }

            .ai-close-btn {
                background: rgba(255, 255, 255, 0.15);
                border: none; color: white;
                width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; transition: all 0.2s; backdrop-filter: blur(10px);
            }
            .ai-close-btn:hover { background: rgba(255, 255, 255, 0.25); transform: scale(1.05); }

            .ai-messages {
                flex: 1; padding: 20px; overflow-y: auto; background: #fafbfc;
                display: flex; flex-direction: column; gap: 12px;
            }
            .ai-messages::-webkit-scrollbar { width: 6px; }
            .ai-messages::-webkit-scrollbar-track { background: transparent; }
            .ai-messages::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.15); border-radius: 3px; }
            .ai-messages::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.25); }

            .ai-msg-wrapper {
                display: flex;
                animation: messageSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            @keyframes messageSlideIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .ai-msg-wrapper.user { justify-content: flex-end; }
            .ai-msg-wrapper.bot { justify-content: flex-start; }

            .ai-msg-content {
                display: flex; flex-direction: column; gap: 4px; max-width: 85%;
            }
            .ai-msg {
                padding: 12px 16px; border-radius: 18px; font-size: 14px;
                line-height: 1.5; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            }
            .ai-msg.user {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; border-bottom-right-radius: 6px;
                white-space: pre-wrap;
            }
            .ai-msg.bot {
                background: #ffffff; color: #1f2937; border: 1px solid #e5e7eb;
                border-bottom-left-radius: 6px;
                white-space: pre-wrap;
            }
            .ai-msg-time { font-size: 11px; color: #9ca3af; padding: 0 4px; }
            .ai-msg-wrapper.user .ai-msg-time { text-align: right; }

            .ai-typing-wrapper {
                display: flex;
                justify-content: flex-start;
                animation: messageSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .ai-typing {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 18px;
                border-bottom-left-radius: 6px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                transition: opacity 0.3s ease;
            }

            .ai-typing-dots { display: flex; gap: 4px; }
            .ai-typing-dots span {
                width: 7px; height: 7px; background: #9ca3af; border-radius: 50%;
                animation: typingBounce 1.4s infinite ease-in-out;
            }
            .ai-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
            .ai-typing-dots span:nth-child(2) { animation-delay: -0.16s; }
            @keyframes typingBounce {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }

            .ai-input-area {
                padding: 16px; background: white; border-top: 1px solid #f3f4f6;
                display: flex; gap: 8px; align-items: flex-end;
            }
            .ai-input-area textarea {
                flex: 1;
                padding: 12px 16px;
                border: 1.5px solid #e5e7eb;
                border-radius: 20px;
                outline: none;
                font-size: 14px;
                font-family: inherit;
                transition: border-color 0.2s, box-shadow 0.2s;
                background: #fafbfc;
                resize: none;
                min-height: 44px;
                max-height: 120px;
                overflow-y: auto;
                line-height: 1.4;
                box-sizing: border-box;
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            .ai-input-area textarea:focus {
                border-color: #667eea;
                background: white;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            .ai-input-area textarea::-webkit-scrollbar {
                display: none;
            }

            .ai-send-btn {
                width: 44px; height: 44px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; border: none; border-radius: 50%; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                transition: all 0.2s; flex-shrink: 0;
            }
            .ai-send-btn:hover:not(:disabled) {
                background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
                transform: scale(1.05);
            }
            .ai-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .ai-send-btn svg { width: 20px; height: 20px; fill: currentColor; margin-left: 2px; }

            @media (max-width: 480px) {
                #ai-widget-window {
                    right: 0; bottom: 0; width: 100vw; height: 100vh;
                    max-height: 100vh; border-radius: 0;
                }
                #ai-widget-btn { bottom: 16px; right: 16px; }
            }
        `;
        document.head.appendChild(style);
    }

    function createWidgetHTML(apiUrl) {
        const btn = document.createElement('button');
        btn.id = 'ai-widget-btn';
        btn.innerHTML = chatIcon;
        btn.onclick = () => toggleWindow();
        btn.setAttribute('aria-label', 'Открыть чат');
        document.body.appendChild(btn);

        const windowDiv = document.createElement('div');
        windowDiv.id = 'ai-widget-window';
        windowDiv.innerHTML = `
            <div class="ai-header">
                <div class="ai-header-left">
                    <div class="ai-header-info">
                        <h3>AI Помощник</h3>
                        <p><span class="ai-status-dot"></span> Онлайн</p>
                    </div>
                </div>
                <div class="ai-header-buttons">
                    <button class="ai-new-chat-btn" onclick="clearHistory()">Новый чат</button>
                    <button class="ai-close-btn" onclick="toggleWindow()" title="Закрыть">✕</button>
                </div>
            </div>
            <div class="ai-messages" id="ai-messages-container"></div>
            <div class="ai-input-area">
                <textarea id="ai-input" maxlength="1000" rows="1" placeholder="Напишите ваше сообщение..." onkeypress="handleKeyPress(event, '${apiUrl}')" oninput="autoResizeTextarea(this)"></textarea>
                <button class="ai-send-btn" id="ai-send-btn" onclick="sendMessage('${apiUrl}')" title="Отправить">
                    ${sendIcon}
                </button>
            </div>
        `;
        document.body.appendChild(windowDiv);

        setTimeout(() => {
            appendMessage("Здравствуйте! Чем могу помочь?", 'bot', true);
        }, 100);
    }

    window.toggleWindow = function () {
        const win = document.getElementById('ai-widget-window');
        const btn = document.getElementById('ai-widget-btn');
        if (win.classList.contains('active')) {
            win.classList.remove('active');
            btn.innerHTML = chatIcon;
            btn.setAttribute('aria-label', 'Открыть чат');
        } else {
            win.classList.add('active');
            btn.innerHTML = closeIcon;
            btn.setAttribute('aria-label', 'Закрыть чат');
            setTimeout(() => document.getElementById('ai-input').focus(), 300);
        }
    };

    window.clearHistory = function () {
        const container = document.getElementById('ai-messages-container');
        container.innerHTML = '';
        appendMessage("Здравствуйте! Чем могу помочь?", 'bot', true);
    };

    window.handleKeyPress = function (event, apiUrl) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage(apiUrl);
        }
    };

    window.autoResizeTextarea = function(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    };

    function showTypingIndicator() {
        const container = document.getElementById('ai-messages-container');
        const wrapper = document.createElement('div');
        wrapper.className = 'ai-typing-wrapper';
        wrapper.id = 'ai-typing-wrapper';
        wrapper.innerHTML = `
            <div class="ai-typing">
                <div class="ai-typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        container.appendChild(wrapper);
        scrollChat();
    }

    function hideTypingIndicator() {
        const wrapper = document.getElementById('ai-typing-wrapper');
        if (wrapper) {
            wrapper.remove();
        }
    }

    window.sendMessage = async function (apiUrl) {
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send-btn');

        if (sendBtn.disabled) return;

        const message = input.value.trim();
        if (!message) return;

        if (message.length > 1000) {
            appendMessage("Сообщение слишком длинное. Пожалуйста, сократите его до 1000 символов.", 'bot');
            return;
        }

        appendMessage(message, 'user');
        input.value = '';
        autoResizeTextarea(input);

        showTypingIndicator();
        sendBtn.disabled = true;

        let botMsgElement = null;
        let firstTokenReceived = false;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) {
                hideTypingIndicator();
                if (response.status === 429) {
                    appendMessage("Вы отправляете сообщения слишком часто. Пожалуйста, подождите немного.", 'bot');
                    return;
                }
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            hideTypingIndicator();
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) {
                                if (!firstTokenReceived) {
                                    firstTokenReceived = true;
                                    hideTypingIndicator();
                                    botMsgElement = appendMessage("", 'bot', false, true);
                                }
                                botMsgElement.textContent += parsed.text;
                                scrollChat();
                            }
                        } catch (e) {
                            console.warn('Ошибка парсинга SSE:', e);
                        }
                    }
                }
            }
            hideTypingIndicator();
        } catch (error) {
            hideTypingIndicator();
            appendMessage("Извините, произошла ошибка соединения с сервером. Попробуйте позже.", 'bot');
            console.error("AI Widget Error:", error);
        } finally {
            sendBtn.disabled = false;
            input.focus();
            scrollChat();
        }
    };

    function scrollChat() {
        const container = document.getElementById('ai-messages-container');
        container.scrollTop = container.scrollHeight;
    }

    function appendMessage(text, sender, skipAnimation = false, returnElement = false) {
        const container = document.getElementById('ai-messages-container');

        const wrapper = document.createElement('div');
        wrapper.className = `ai-msg-wrapper ${sender}`;
        if (skipAnimation) wrapper.style.animation = 'none';

        const content = document.createElement('div');
        content.className = 'ai-msg-content';

        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-msg ${sender}`;
        msgDiv.textContent = text;

        const time = document.createElement('div');
        time.className = 'ai-msg-time';
        const now = new Date();
        time.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        content.appendChild(msgDiv);
        content.appendChild(time);
        wrapper.appendChild(content);

        container.appendChild(wrapper);
        scrollChat();

        return returnElement ? msgDiv : null;
    }
})();