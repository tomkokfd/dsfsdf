(function() {
    'use strict';

    const API_BASE_URL = '';
    const AD_ID = extractAdIdFromUrl() || window.adId || window.itemId || '2217671294';
    const USER_FIRSTNAME = 'Пользователь';

    let lastMessageId = 0;
    let seenMessageHashes = new Set();
    let chatWidget = null;
    let chatButton = null;
    let chatWindow = null;
    let messagesContainer = null;
    let inputField = null;
    let sendButton = null;
    let isOpen = false;
    let isMinimized = false;
    let unreadCount = 0;
    let isTyping = false;
    let typingTimeout = null;
    let notificationSound = null;

    function loadState() {
        try {
            const saved = localStorage.getItem(`support_state_${AD_ID}`);
            if (saved) {
                const state = JSON.parse(saved);
                unreadCount = state.unreadCount || 0;
                lastMessageId = state.lastMessageId || 0;
            }
        } catch (error) {
            console.warn('Error loading state:', error);
        }
    }

    function saveState() {
        try {
            const state = {
                unreadCount: unreadCount,
                lastMessageId: lastMessageId,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(`support_state_${AD_ID}`, JSON.stringify(state));
        } catch (error) {
            console.warn('Error saving state:', error);
        }
    }

    function extractAdIdFromUrl() {
        const match = window.location.pathname.match(/\/(\w+\d+)/);
        if (match) return match[1];
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('id')) return urlParams.get('id');
        if (window.adId) return window.adId;
        if (window.itemId) return window.itemId;
        return '2217671294';
    }

    function createChatHTML() {
        return `
            <div id="smartsupp-widget-button" class="smartsupp-widget-button">
                <div class="smartsupp-button-icon">
                    <img src="/style/support/supportIcon.gif" alt="Поддержка">
                </div>
                <div class="smartsupp-unread-badge" id="smartsupp-unread-badge">
                    <span id="smartsupp-unread-count">0</span>
                </div>
            </div>

            <div id="smartsupp-widget-window" class="smartsupp-widget-window">
                <div class="smartsupp-header">
                    <div class="smartsupp-header-content">
                        <div class="smartsupp-avatar">
                            <img src="/style/support/supportIcon.gif" alt="Поддержка">
                        </div>
                        <div class="smartsupp-header-info">
                            <div class="smartsupp-agent-name">Техподдержка</div>
                            <div class="smartsupp-agent-status">
                                <span class="smartsupp-status-dot"></span>
                                <span>Онлайн</span>
                            </div>
                        </div>
                    </div>
                    <div class="smartsupp-header-actions">
                        <button class="smartsupp-minimize-btn" id="smartsupp-minimize-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13H5v-2h14v2z"/>
                            </svg>
                        </button>
                        <button class="smartsupp-close-btn" id="smartsupp-close-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="smartsupp-messages" id="smartsupp-messages">
                    <div class="smartsupp-typing-indicator" id="smartsupp-typing-indicator" style="display: none;">
                        <div class="smartsupp-message smartsupp-message-agent">
                            <div class="smartsupp-message-avatar">
                                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTMTcuNTIgMiAxMiAyWk0xMiA2QzEzLjY2IDYgMTUgNy4zNCAxNSA5UzEzLjY2IDEyIDEyIDEyUzkgMTAuNjYgOSA5UzEwLjM0IDYgMTIgNlpNMTIgMjBDOS43NCAyMCA3Ljc5IDE4Ljg1IDYuNTIgMTcuMDRDNi44MSAxNS4yMSA5LjMxIDE0IDEyIDE0UzE3LjE5IDE1LjIxIDE3LjQ4IDE3LjA0QzE2LjIxIDE4Ljg1IDE0LjI2IDIwIDEyIDIwWiIgZmlsbD0iIzMzNzNkYyIvPgo8L3N2Zz4K" alt="Агент">
                            </div>
                            <div class="smartsupp-message-content">
                                <div class="smartsupp-typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="smartsupp-input-area">
                    <div class="smartsupp-input-wrapper">
                        <textarea 
                            id="smartsupp-input" 
                            class="smartsupp-input" 
                            placeholder="Напишите сообщение..."
                            rows="1"
                        ></textarea>
                        <button class="smartsupp-send-btn" id="smartsupp-send-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="smartsupp-powered-by">
                        Техподдержка СДЭК
                    </div>
                </div>
            </div>
        `;
    }

    function createChatCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .smartsupp-widget-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 80px;
                height: 80px;
                background: #1AB248;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 16px rgba(26, 178, 72, 0.4);
                z-index: 2147483647;
                transition: all 0.3s ease;
                color: white;
                overflow: visible;
            }

            .smartsupp-widget-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
            }

            .smartsupp-widget-button.open {
                transform: scale(0.95);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }

            .smartsupp-button-icon {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .smartsupp-button-icon img {
                width: 70px;
                height: 70px;
                object-fit: cover;
                border-radius: 50%;
            }

            .smartsupp-unread-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ff4757;
                color: white;
                border-radius: 50%;
                min-width: 22px;
                height: 22px;
                display: none;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(255, 71, 87, 0.4);
                animation: pulse-badge 2s infinite;
                z-index: 10;
            }

            .smartsupp-unread-badge.show {
                display: flex !important;
            }

            @keyframes pulse-badge {
                0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7); }
                50% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(255, 71, 87, 0); }
            }

            .smartsupp-widget-window {
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 360px;
                height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                display: none;
                flex-direction: column;
                z-index: 2147483647;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                overflow: hidden;
            }

            .smartsupp-widget-window.open {
                display: flex;
                animation: slideUp 0.3s ease;
            }

            .smartsupp-widget-window.minimized {
                height: 60px;
            }

            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .smartsupp-header {
                background: #1AB248;
                color: white;
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-height: 60px;
                box-sizing: border-box;
            }

            .smartsupp-header-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .smartsupp-avatar img {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: white;
                object-fit: cover;
            }

            .smartsupp-agent-name {
                font-weight: 600;
                font-size: 16px;
            }

            .smartsupp-agent-status {
                font-size: 12px;
                opacity: 0.9;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .smartsupp-status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #2ed573;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .smartsupp-header-actions {
                display: flex;
                gap: 8px;
            }

            .smartsupp-minimize-btn, .smartsupp-close-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }

            .smartsupp-minimize-btn:hover, .smartsupp-close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .smartsupp-minimize-btn svg, .smartsupp-close-btn svg {
                width: 20px;
                height: 20px;
            }

            .smartsupp-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                background: #f8f9fa;
            }

            .smartsupp-widget-window.minimized .smartsupp-messages {
                display: none;
            }

            .smartsupp-message {
                display: flex;
                gap: 8px;
                max-width: 80%;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .smartsupp-message-agent {
                align-self: flex-start;
            }

            .smartsupp-message-visitor {
                align-self: flex-end;
                flex-direction: row-reverse;
            }

            .smartsupp-message-avatar img {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
            }

            .user-avatar-icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #1AB248;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }

            .smartsupp-message-content {
                background: white;
                padding: 12px 16px;
                border-radius: 18px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                max-width: 100%;
            }

            .smartsupp-message-visitor .smartsupp-message-content {
                background: #1AB248;
                color: white;
            }

            .smartsupp-message-text {
                font-size: 14px;
                line-height: 1.4;
                word-wrap: break-word;
                margin: 0;
            }

            .smartsupp-message-time {
                font-size: 11px;
                opacity: 0.6;
                margin-top: 4px;
            }

            .smartsupp-typing-dots {
                display: flex;
                gap: 4px;
                padding: 8px 0;
            }

            .smartsupp-typing-dots span {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #999;
                animation: typing 1.4s infinite;
            }

            .smartsupp-typing-dots span:nth-child(2) {
                animation-delay: 0.2s;
            }

            .smartsupp-typing-dots span:nth-child(3) {
                animation-delay: 0.4s;
            }

            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-10px); }
            }

            .smartsupp-input-area {
                background: white;
                border-top: 1px solid #e9ecef;
                padding: 16px;
            }

            .smartsupp-widget-window.minimized .smartsupp-input-area {
                display: none;
            }

            .smartsupp-input-wrapper {
                display: flex;
                align-items: flex-end;
                gap: 8px;
                background: #f8f9fa;
                border-radius: 20px;
                padding: 8px 12px;
                border: 1px solid #e9ecef;
                transition: border-color 0.2s;
            }

            .smartsupp-input-wrapper:focus-within {
                border-color: #1AB248;
            }

            .smartsupp-input {
                flex: 1;
                border: none;
                background: none;
                outline: none;
                resize: none;
                font-size: 14px;
                line-height: 1.4;
                max-height: 100px;
                min-height: 20px;
                font-family: inherit;
            }

            .smartsupp-send-btn {
                background: #1AB248;
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: white;
                transition: background 0.2s;
                flex-shrink: 0;
            }

            .smartsupp-send-btn:hover {
                background: #159c3d;
            }

            .smartsupp-send-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }

            .smartsupp-send-btn svg {
                width: 16px;
                height: 16px;
            }

            .smartsupp-powered-by {
                text-align: center;
                font-size: 11px;
                color: #999;
                margin-top: 8px;
            }

            @media (max-width: 480px) {
                .smartsupp-widget-window {
                    width: calc(100vw - 20px);
                    height: calc(100vh - 40px);
                    bottom: 10px;
                    right: 10px;
                }
                .smartsupp-widget-button {
                    bottom: 15px;
                    right: 15px;
                    width: 50px;
                    height: 50px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function getCurrentTime() {
        const now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' +
               now.getMinutes().toString().padStart(2, '0');
    }

    async function sendMessageToBot(message) {
        try {
            console.log('[SUPPORT] Отправка сообщения в бот:', message);

            const response = await fetch(API_BASE_URL + '/api/supportMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    adId: AD_ID,
                    message: message,
                    firstname: USER_FIRSTNAME
                })
            });

            const result = await response.json();

            if (result.ok) {
                console.log('[SUPPORT] Сообщение отправлено в бот');

                await logSupportActivity('message_sent', {
                    message: message,
                    timestamp: new Date().toISOString()
                });
                return true;
            } else {
                console.error('[SUPPORT] Ошибка отправки:', result.error);
                return false;
            }
        } catch (error) {
            console.error('[SUPPORT] Ошибка при отправке сообщения:', error);
            return false;
        }
    }

    async function markMessagesAsRead() {
        try {
            const response = await fetch(API_BASE_URL + '/api/markSupportMessagesRead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    adId: AD_ID,
                    timestamp: new Date().toISOString()
                })
            });

            const result = await response.json();
            return result.ok;
        } catch (error) {
            return false;
        }
    }

    async function logSupportActivity(action, data = {}) {
        try {
            await fetch(API_BASE_URL + '/api/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    adId: AD_ID,
                    title: 'Support Activity',
                    eventType: 'support_activity',
                    supportAction: action,
                    supportData: data,
                    timestamp: new Date().toISOString(),
                    service: 'CDEK 2.0'
                })
            });
        } catch (error) {}
    }

    function addUserMessage(text) {
        if (!messagesContainer) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'smartsupp-message smartsupp-message-visitor';
        messageDiv.innerHTML = `
            <div class="smartsupp-message-avatar">
                <div class="user-avatar-icon">👤</div>
            </div>
            <div class="smartsupp-message-content">
                <div class="smartsupp-message-text">${escapeHtml(text)}</div>
                <div class="smartsupp-message-time">${getCurrentTime()}</div>
            </div>
        `;
        const typingIndicator = document.getElementById('smartsupp-typing-indicator');
        messagesContainer.insertBefore(messageDiv, typingIndicator);
        setTimeout(() => scrollToBottom(true), 100);
    }

    function playNotificationSound() {
        try {
            if (notificationSound) {
                notificationSound.currentTime = 0;
                notificationSound.play().catch(function() {});
            } else {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Новое сообщение', {
                        body: 'Получено сообщение от техподдержки',
                        icon: '/style/support/supportIcon.gif'
                    });
                }
            }
        } catch (error) {}
    }

    function addOperatorMessage(text) {
        if (!messagesContainer) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'smartsupp-message smartsupp-message-agent';
        messageDiv.innerHTML = `
            <div class="smartsupp-message-avatar">
                <img src="/style/support/supportIcon.gif" alt="Оператор">
            </div>
            <div class="smartsupp-message-content">
                <div class="smartsupp-message-text">${text}</div>
                <div class="smartsupp-message-time">${getCurrentTime()}</div>
            </div>
        `;
        const typingIndicator = document.getElementById('smartsupp-typing-indicator');
        messagesContainer.insertBefore(messageDiv, typingIndicator);
        setTimeout(() => scrollToBottom(true), 100);
        playNotificationSound();
        logSupportActivity('message_received', {
            message: text,
            timestamp: new Date().toISOString()
        });
    }

    function showTyping() {
        const typingIndicator = document.getElementById('smartsupp-typing-indicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'block';
            scrollToBottom();
        }
    }

    function hideTyping() {
        const typingIndicator = document.getElementById('smartsupp-typing-indicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function scrollToBottom(smooth = true) {
        if (messagesContainer) {
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    }

    function updateUnreadCount(count) {
        unreadCount = count;
        const badge = document.getElementById('smartsupp-unread-badge');
        const countEl = document.getElementById('smartsupp-unread-count');
        if (badge && countEl) {
            if (count > 0) {
                badge.classList.add('show');
                badge.style.display = 'flex';
                countEl.textContent = count;
            } else {
                badge.classList.remove('show');
                badge.style.display = 'none';
            }
        }
        saveState();
    }

    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }

    function sendMessage() {
        if (!inputField) return;
        const text = inputField.value.trim();
        if (!text) return;
        addUserMessage(text);
        inputField.value = '';
        autoResizeTextarea(inputField);
        sendMessageToBot(text).then(function(success) {
            if (!success) {
                addOperatorMessage('Извините, произошла ошибка при отправке сообщения. Попробуйте еще раз.');
            }
        });
        updateUnreadCount(0);
    }

    async function pollMessagesFromBot() {
        try {
            const response = await fetch(API_BASE_URL + '/api/getSupportMessages?adId=' + AD_ID + '&lastId=' + lastMessageId, {
                method: 'GET',
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            const result = await response.json();

            if (result.ok && result.messages && result.messages.length > 0) {
                let newMessagesCount = 0;
                result.messages.forEach(function(msg) {
                    const text = msg.text || msg.content;
                    if (text) {
                        const hash = text + '_' + (msg.id || 0);
                        if (seenMessageHashes.has(hash)) return;
                        seenMessageHashes.add(hash);
                        addOperatorMessage(text);
                        newMessagesCount++;
                        if (!isOpen || isMinimized) {
                            unreadCount++;
                        }
                    }
                    lastMessageId = Math.max(lastMessageId, msg.id || 0);
                });

                if (newMessagesCount > 0) {
                    saveState();
                    if (!isOpen || isMinimized) {
                        updateUnreadCount(unreadCount);
                    } else {
                        markMessagesAsRead();
                    }
                }
            }
        } catch (error) {}
    }

    function init() {
        if (!AD_ID) return;

        loadState();

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        try {
            notificationSound = new Audio('/style/support/notification.mp3');
            notificationSound.volume = 1.0;
        } catch (error) {}

        createChatCSS();

        const chatHTML = createChatHTML();
        document.body.insertAdjacentHTML('beforeend', chatHTML);

        chatWidget = document.querySelector('.smartsupp-widget-button');
        chatWindow = document.querySelector('.smartsupp-widget-window');
        messagesContainer = document.getElementById('smartsupp-messages');
        inputField = document.getElementById('smartsupp-input');
        sendButton = document.getElementById('smartsupp-send-btn');

        if (unreadCount > 0) {
            updateUnreadCount(unreadCount);
        }

        if (chatWidget) {
            chatWidget.addEventListener('click', toggleChat);
        }

        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }

        if (inputField) {
            inputField.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            inputField.addEventListener('input', function(e) {
                autoResizeTextarea(e.target);
            });
        }

        const minimizeBtn = document.getElementById('smartsupp-minimize-btn');
        const closeBtn = document.getElementById('smartsupp-close-btn');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', minimizeChat);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeChat);
        }

        setInterval(pollMessagesFromBot, 3000);

        logSupportActivity('chat_initialized', {
            adId: AD_ID,
            unreadCount: unreadCount,
            lastMessageId: lastMessageId,
            timestamp: new Date().toISOString()
        });
    }

    function openChat() {
        if (chatWindow && chatWidget) {
            chatWindow.classList.add('open');
            chatWindow.classList.remove('minimized');
            chatWidget.classList.add('open');
            isOpen = true;
            isMinimized = false;

            const hadUnreadMessages = unreadCount > 0;
            if (hadUnreadMessages) {
                markMessagesAsRead();
            }
            unreadCount = 0;
            updateUnreadCount(0);

            setTimeout(function() {
                scrollToBottom(true);
                if (inputField) inputField.focus();
            }, 300);

            logSupportActivity('chat_opened', {
                hadUnreadMessages: hadUnreadMessages,
                timestamp: new Date().toISOString()
            });
        }
    }

    function closeChat() {
        if (chatWindow && chatWidget) {
            chatWindow.classList.remove('open');
            chatWindow.classList.remove('minimized');
            chatWidget.classList.remove('open');
            isOpen = false;
            isMinimized = false;

            logSupportActivity('chat_closed', {
                timestamp: new Date().toISOString()
            });
        }
    }

    function minimizeChat() {
        if (chatWindow) {
            chatWindow.classList.add('minimized');
            isMinimized = true;
        }
    }

    function toggleChat() {
        if (isOpen) {
            if (isMinimized) {
                chatWindow.classList.remove('minimized');
                isMinimized = false;
                const hadUnreadMessages = unreadCount > 0;
                if (hadUnreadMessages) {
                    markMessagesAsRead();
                }
                unreadCount = 0;
                updateUnreadCount(0);
                setTimeout(function() {
                    scrollToBottom(true);
                    if (inputField) inputField.focus();
                }, 100);
            } else {
                closeChat();
            }
        } else {
            openChat();
        }
    }

    window.smartsupp = function(command) {
        switch (command) {
            case 'chat:open': openChat(); break;
            case 'chat:close': closeChat(); break;
            case 'chat:minimize': minimizeChat(); break;
        }
    };

    window.CustomChat = {
        open: openChat,
        close: closeChat,
        minimize: minimizeChat,
        toggle: toggleChat,
        isOpen: function() { return isOpen; },
        isMinimized: function() { return isMinimized; },
        addOperatorMessage: addOperatorMessage,
        addUserMessage: addUserMessage
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
