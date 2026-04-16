/**
 * ============================================
 * SCRIPT-BASIC.JS
 * Orquestación principal, eventos y lógica del chat
 * ============================================
 */

// ===== VARIABLES GLOBALES =====
let editingMessage = null;  // Mensaje en edición

// ===== RATE LIMIT SYSTEM =====

const RATE_LIMIT_MAX = 5;  // 5 mensajes por hora
const RATE_LIMIT_KEY = 'pera_rate_limit';

// ===== HISTORIAL DE CONVERSACIONES =====

const MAX_SAVED_CONVERSATIONS = 5;
const CONVERSATIONS_KEY = 'alondra_conversations';
const ACTIVE_CONVERSATION_KEY = 'alondra_active_conversation';

/**
 * Obtiene el estado actual del rate limit desde localStorage
 * @returns {Object} - { count: number, resetTimestamp: number | null }
 */
function getRateLimitState() {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) {
        return { count: 0, resetTimestamp: null };
    }
    
    try {
        return JSON.parse(stored);
    } catch (e) {
        return { count: 0, resetTimestamp: null };
    }
}

/**
 * Guarda el estado del rate limit en localStorage
 * @param {number} count - Número de mensajes usados
 * @param {number|null} resetTimestamp - Timestamp de reseteo (null si no hay límite alcanzado)
 */
function saveRateLimitState(count, resetTimestamp) {
    const state = { count, resetTimestamp };
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
}

/**
 * Verifica si el rate limit actual permite enviar un nuevo mensaje
 * También maneja el reseteo automático si pasó 1 hora desde el bloqueo
 * @returns {boolean} - true si se puede enviar, false si está bloqueado
 */
function checkRateLimit() {
    const state = getRateLimitState();
    
    // Si hay un timestamp de reseteo y ya pasó la hora
    if (state.resetTimestamp && Date.now() >= state.resetTimestamp) {
        // Resetear el contador
        saveRateLimitState(0, null);
        return true;
    }
    
    // Si no hay bloqueo activo y el contador es menor al máximo
    if (!state.resetTimestamp && state.count < RATE_LIMIT_MAX) {
        return true;
    }
    
    // Está bloqueado
    return false;
}

/**
 * Incrementa el contador de rate limit
 * Si alcanza el límite, guarda el timestamp de reseteo (1 hora desde ahora)
 */
function incrementRateLimit() {
    const state = getRateLimitState();
    const newCount = state.count + 1;
    
    if (newCount >= RATE_LIMIT_MAX) {
        // Alcanzó el límite: guardar timestamp de reseteo (1 hora desde ahora)
        const resetTimestamp = Date.now() + (60 * 60 * 1000); // 1 hora en ms
        saveRateLimitState(RATE_LIMIT_MAX, resetTimestamp);
    } else {
        // Aún tiene crédito
        saveRateLimitState(newCount, null);
    }
}

/**
 * Obtiene el tiempo restante del bloqueo en formato legible
 * @returns {string|null} - Tiempo restante o null si no está bloqueado
 */
function getRateLimitRemainingTime() {
    const state = getRateLimitState();
    
    if (!state.resetTimestamp) return null;
    
    const remaining = state.resetTimestamp - Date.now();
    if (remaining <= 0) return null;
    
    const minutes = Math.ceil(remaining / (60 * 1000));
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
}

/**
 * Genera un ID único para una nueva conversación
 * @returns {string} - ID único
 */
function generateConversationId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
}

/**
 * Obtiene todas las conversaciones guardadas
 * @returns {Array} - Lista de conversaciones
 */
function getConversations() {
    const stored = localStorage.getItem(CONVERSATIONS_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        return [];
    }
}

/**
 * Guarda todas las conversaciones en localStorage
 * @param {Array} conversations - Lista de conversaciones
 */
function saveConversations(conversations) {
    // Limitar a 5 conversaciones
    while (conversations.length > MAX_SAVED_CONVERSATIONS) {
        conversations.pop();
    }
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

/**
 * Obtiene la conversación activa actual
 * @returns {Object|null} - Conversación activa o null
 */
function getActiveConversation() {
    const conversations = getConversations();
    const activeId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (!activeId) return null;
    return conversations.find(c => c.id === activeId) || null;
}


/**
 * Guarda la conversación actual en el historial
 * Extrae los mensajes del DOM y los guarda (con HTML formateado)
 */
function saveCurrentConversation() {
    // Extraer mensajes del DOM (excluyendo streaming, rate-limit y typing indicator)
    const messageElements = document.querySelectorAll('#messagesDynamic .message-user, #messagesDynamic .message-ia:not(#streaming-message):not(.rate-limit-notice):not(.typing-indicator-container)');
    const messages = [];
    
    messageElements.forEach(el => {
        const bubble = el.querySelector('.bubble');
        if (!bubble) return;
        
        const role = el.classList.contains('message-user') ? 'user' : 'assistant';
        // Guardar el HTML interno (ya formateado por Markdown)
        const contentHtml = bubble.innerHTML;
        // También guardar texto plano como respaldo (para título)
        const contentText = bubble.innerText || bubble.textContent;
        
        if (contentText && contentText.trim() && !contentText.includes('typing')) {
            messages.push({
                role: role,
                content: contentHtml,      // HTML formateado
                contentText: contentText,  // Texto plano (para título y búsquedas)
                timestamp: new Date().toISOString()
            });
        }
    });
    
    if (messages.length === 0) return;
    
    // Generar título (primer mensaje del usuario en texto plano)
    const firstUserMessage = messages.find(m => m.role === 'user');
    const title = firstUserMessage ? firstUserMessage.contentText.substring(0, 50) : 'Nueva conversación';
    
    // Obtener conversación activa o crear nueva
    let conversations = getConversations();
    let activeId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    let existingIndex = conversations.findIndex(c => c.id === activeId);
    
    const conversation = {
        id: activeId || generateConversationId(),
        title: title,
        createdAt: existingIndex !== -1 ? conversations[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: messages
    };
    
    if (existingIndex !== -1) {
        conversations[existingIndex] = conversation;
    } else {
        conversations.unshift(conversation);
        localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversation.id);
    }
    
    // Ordenar por updatedAt (más reciente primero)
    conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    saveConversations(conversations);
}

/**
 * Formatea una fecha para mostrar en el historial
 * @param {string} dateString - Fecha ISO
 * @returns {string} - Fecha formateada
 */
function formatHistoryDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    // Hoy
    if (diffDays === 0) {
        return `Hoy, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    // Ayer
    if (diffDays === 1) {
        return `Ayer, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    // Hace X días (2-7)
    if (diffDays < 7) {
        return `Hace ${diffDays} días`;
    }
    // Semanas (1-4)
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'} atrás`;
    }
    // Meses (1-12)
    if (diffMonths < 12) {
        return `${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'} atrás`;
    }
    // Años
    return `${diffYears} ${diffYears === 1 ? 'año' : 'años'} atrás`;
}

/**
 * Carga y renderiza el historial en el modal
 */
function loadHistoryList() {
    const historyContainer = document.getElementById('historyList');
    if (!historyContainer) return;
    
    const conversations = getConversations();
    const activeId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    
    if (conversations.length === 0) {
        historyContainer.innerHTML = '<p style="text-align: center; color: var(--text-hint); padding: 20px;">No hay conversaciones guardadas</p>';
        return;
    }
    
    historyContainer.innerHTML = '';
    
    conversations.forEach(conv => {
        const messageCount = conv.messages.length;
        const dateFormatted = formatHistoryDate(conv.updatedAt);
        const isActive = conv.id === activeId;
        
        const div = document.createElement('div');
        div.className = 'history-item';
        div.dataset.id = conv.id;
        div.style.cssText = `
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 12px;
            background: ${isActive ? 'var(--bg-active)' : 'var(--bg-tertiary)'};
            border: 1px solid ${isActive ? 'var(--accent-soft)' : 'var(--border-default)'};
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1; overflow: hidden;">
                    <div style="font-weight: 500; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${escapeHtml(conv.title)}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-hint); margin-top: 4px;">
                        ${dateFormatted} · ${messageCount} ${messageCount === 1 ? 'mensaje' : 'mensajes'}
                    </div>
                </div>
                ${isActive ? '<span style="font-size: 0.7rem; color: var(--accent-color);">● Activo</span>' : ''}
            </div>
        `;
        
        div.addEventListener('click', () => loadConversation(conv.id));
        historyContainer.appendChild(div);
    });
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} str - Texto a escapar
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Carga una conversación específica por ID
 * @param {string} conversationId - ID de la conversación
 */
function loadConversation(conversationId) {
    const conversations = getConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation) return;
    
    // Actualizar conversación activa
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversation.id);
    
    // Limpiar UI
    messagesDynamic.innerHTML = '';
    
    // Ocultar welcome-chat
    if (typeof window.hideWelcomeChat === 'function') {
        window.hideWelcomeChat();
    }
    
    // Cargar mensajes usando el HTML guardado directamente
    conversation.messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = msg.role === 'user' ? 'message-user' : 'message-ia';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = msg.role === 'user' ? 'bubble user-bubble' : 'bubble bot-bubble';
        
        // Usar el HTML guardado directamente (ya formateado)
        bubbleDiv.innerHTML = msg.content;
        
        // Renderizar matemáticas en el contenido cargado
if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(bubbleDiv, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
        ]
    });
}
        
        // Aplicar color de acento a burbujas de usuario
        if (msg.role === 'user') {
            const savedColor = localStorage.getItem('pera_accent_color') || '#333537';
            bubbleDiv.style.backgroundColor = savedColor;
        }
        
        messageDiv.appendChild(bubbleDiv);
        
        // Añadir botones de acción
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        actionsDiv.innerHTML = `
            <button class="action-btn copy-btn" aria-label="Copiar mensaje" onclick="window.copyMessage(this)">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-iconid="446994" data-svgname="Copy"><path clip-rule="evenodd" d="m13.8 2.25h-.0321c-.8128-.00001-1.4685-.00001-1.9994.04336-.5466.04467-1.0267.13902-1.471.36537-.70557.35952-1.27925.9332-1.63877 1.63881-.22634.44421-.3207.92435-.36537 1.47099-.04337.53091-.04337 1.18651-.04336 1.99934v.00002.03211.45h-.45-.0321-.00003c-.81283-.00001-1.46843-.00001-1.99934.04336-.54663.04467-1.02678.13902-1.47099.36537-.70561.35952-1.27929.9332-1.63881 1.63877-.22634.4443-.3207.9244-.36537 1.471-.04337.5309-.04337 1.1866-.04336 1.9994v.0321 2.4.0321c-.00001.8128-.00001 1.4685.04336 1.9994.04467.5466.13903 1.0267.36537 1.471.35952.7056.9332 1.2792 1.63881 1.6388.44421.2263.92436.3207 1.47099.3653.53091.0434 1.18652.0434 1.99935.0434h.03212 2.4.0321c.8129 0 1.4685 0 1.9994-.0434.5466-.0446 1.0267-.139 1.471-.3653.7056-.3596 1.2792-.9332 1.6388-1.6388.2263-.4443.3207-.9244.3653-1.471.0434-.5309.0434-1.1865.0434-1.9994v-.0321-.45h.45.0321c.8129 0 1.4685 0 1.9994-.0434.5466-.0446 1.0267-.139 1.471-.3653.7056-.3596 1.2793-.9332 1.6388-1.6388.2263-.4443.3207-.9244.3653-1.471.0434-.5309.0434-1.1865.0434-1.9994v-.0321-2.4-.03212c0-.81283 0-1.46844-.0434-1.99935-.0446-.54664-.139-1.02678-.3653-1.47099-.3595-.70561-.9332-1.27929-1.6388-1.63881-.4443-.22635-.9244-.3207-1.471-.36537-.5309-.04337-1.1865-.04337-1.9994-.04336h-.0321zm1.95 12h.45c.8525 0 1.4467-.0006 1.9093-.0384.4539-.0371.7147-.1062.9122-.2068.4233-.2158.7675-.56.9833-.9833.1006-.1975.1697-.4583.2068-.9122.0378-.4626.0384-1.0568.0384-1.9093v-2.4c0-.85245-.0006-1.44669-.0384-1.90932-.0371-.45388-.1062-.71464-.2068-.91216-.2158-.42336-.56-.76757-.9833-.98328-.1975-.10064-.4583-.16978-.9122-.20686-.4626-.0378-1.0568-.03838-1.9093-.03838h-2.4c-.8525 0-1.4467.00058-1.9093.03838-.4539.03708-.7147.10622-.9122.20686-.4233.21571-.7675.55992-.98326.98328-.10064.19752-.16977.45828-.20686.91216-.0378.46263-.03838 1.05687-.03838 1.90932v.45h.45.0321c.8129-.00001 1.4685-.00001 1.9994.04336.5466.04467 1.0267.13902 1.471.36537.7056.35952 1.2792.9332 1.6388 1.63877.2263.4443.3207.9244.3653 1.471.0434.5309.0434 1.1865.0434 1.9994v.0321zm-10.77148-4.25476c.19752-.10064.45829-.16978.91216-.20686.46263-.0378 1.05687-.03838 1.90932-.03838h2.4c.8525 0 1.4467.00058 1.9093.03838.4539.03708.7147.10622.9122.20686.4233.21576.7675.55996.9833.98326.1006.1975.1697.4583.2068.9122.0378.4626.0384 1.0568.0384 1.9093v2.4c0 .8525-.0006 1.4467-.0384 1.9093-.0371.4539-.1062.7147-.2068.9122-.2158.4233-.56.7675-.9833.9833-.1975.1006-.4583.1697-.9122.2068-.4626.0378-1.0568.0384-1.9093.0384h-2.4c-.85245 0-1.44669-.0006-1.90932-.0384-.45387-.0371-.71464-.1062-.91216-.2068-.42336-.2158-.76757-.56-.98328-.9833-.10064-.1975-.16977-.4583-.20686-.9122-.0378-.4626-.03838-1.0568-.03838-1.9093v-2.4c0-.8525.00058-1.4467.03838-1.9093.03709-.4539.10622-.7147.20686-.9122.21571-.4233.55992-.7675.98328-.98326z" fill="currentColor" fill-rule="evenodd"></path></svg>
            </button>
        `;
        
        // Añadir botón de editar solo para mensajes de usuario
        if (msg.role === 'user') {
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-message-user';
            editBtn.setAttribute('aria-label', 'Editar mensaje');
            editBtn.innerHTML = `
                <svg fill="currentColor" width="21" height="21" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5,18H9.24a1,1,0,0,0,.71-.29l6.92-6.93h0L19.71,8a1,1,0,0,0,0-1.42L15.47,2.29a1,1,0,0,0-1.42,0L11.23,5.12h0L4.29,12.05a1,1,0,0,0-.29.71V17A1,1,0,0,0,5,18ZM14.76,4.41l2.83,2.83L16.17,8.66,13.34,5.83ZM6,13.17l5.93-5.93,2.83,2.83L8.83,16H6ZM21,20H3a1,1,0,0,0,0,2H21a1,1,0,0,0,0-2Z"></path>
                </svg>
            `;
            actionsDiv.appendChild(editBtn);
        }
        
        messageDiv.appendChild(actionsDiv);
        messagesDynamic.appendChild(messageDiv);
    });
    
    // Actualizar contexto del bot
    if (typeof window.clearContext === 'function') {
        window.clearContext();
    }
    
    // Reconstruir contexto con los mensajes cargados (usando texto plano)
    conversation.messages.forEach(msg => {
        if (typeof window.addToContext === 'function') {
            // Usar contentText para el contexto (evita HTML en el prompt)
            const plainContent = msg.contentText || msg.content.replace(/<[^>]*>/g, '');
            window.addToContext({ role: msg.role, content: plainContent });
        }
    });
    
    // Marcar como ya saludado si hay mensajes
    if (conversation.messages.length > 0 && typeof window.marcarSaludoComoHecho === 'function') {
        window.marcarSaludoComoHecho();
    }
    
    scrollToBottom();
    
    // Recargar historial para actualizar estado activo
    loadHistoryList();
}

/**
 * Crea una nueva conversación (nuevo chat)
 */
function createNewConversation() {
    // Generar nuevo ID
    const newId = generateConversationId();
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, newId);
    
    // Limpiar UI
    messagesDynamic.innerHTML = '';
    
    // Mostrar welcome-chat
    if (typeof window.showWelcomeChat === 'function') {
        window.showWelcomeChat();
    }
    
    // Limpiar contexto
    if (typeof window.clearContext === 'function') {
        window.clearContext();
    }
    
    // Resetear estado de saludo
    window.marcarSaludoComoHecho = false;
    if (typeof window.marcarSaludoComoHecho === 'function') {
        // Forzar reset
        window.yaSaludamosAlUsuario = false;
    }
    
    // Recargar historial
    loadHistoryList();
    
    // Scroll al inicio
    scrollToBottom();
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    setupEventListeners();
    initSettingsModal();
    loadSettingsToUI();
    observeNewUserBubbles();
    window.updateProfileInitial();
    
    if (typeof window.checkWelcomeChatOnLoad === 'function') {
        window.checkWelcomeChatOnLoad();
    }
    
    // Cargar última conversación activa al iniciar
    const activeId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    const conversations = getConversations();
    const lastConversation = activeId ? conversations.find(c => c.id === activeId) : null;

    if (lastConversation && lastConversation.messages && lastConversation.messages.length > 0) {
        // Hay conversación activa con mensajes, cargarla
        setTimeout(() => {
        loadConversation(lastConversation.id);
      }, 100);
    }
});

// ===== CONFIGURACIÓN DE EVENTOS PRINCIPALES =====

/**
 * Configura todos los event listeners del chat
 */
function setupEventListeners() {
    const sendBtn = document.getElementById('sendBtn');
    const thinkBtn = document.getElementById('thinkBtn');
    const searchBtn = document.getElementById('searchBtn');
    const newChatBtns = document.querySelectorAll('#newChatBtnDesktop, #newChatBtnMobile');
    const settingsBtns = document.querySelectorAll('#settingsBtnDesktop, #settingsBtnMobile');

    sendBtn.addEventListener('click', handleSendMessage);
    thinkBtn.addEventListener('click', () => handleModelToggle('think', thinkBtn));
    searchBtn.addEventListener('click', () => handleModelToggle('search', searchBtn));
    
    newChatBtns.forEach(btn => btn.addEventListener('click', handleNewChat));
    settingsBtns.forEach(btn => btn.addEventListener('click', openSettingsModal));
    // Delegación de eventos para edición de mensajes
    const messagesDynamic = document.getElementById('messagesDynamic');
    if (messagesDynamic) {
        messagesDynamic.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-message-user');
            if (editBtn) {
                e.preventDefault();
                editUserMessage(editBtn);
            }
        });
    }
}

// ===== MODAL DE CONFIGURACIÓN =====

let settingsModal, settingsOverlay, closeBtn;

/**
 * Inicializa el modal de configuración
 */
function initSettingsModal() {
    settingsOverlay = document.getElementById('settingsModalOverlay');
    settingsModal = document.getElementById('settingsModal');
    closeBtn = document.getElementById('settingsModalClose');
    
    if (!settingsOverlay || !settingsModal) return;
    
    if (closeBtn) closeBtn.addEventListener('click', closeSettingsModal);
    
    settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) closeSettingsModal();
    });
    
    initCustomSelects();
    initTabs();
    initTemperatureSlider();
    initSettingsControls();
}

/**
 * Abre el modal de configuración
 */
function openSettingsModal() {
    if (settingsOverlay) {
        settingsOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Cierra el modal de configuración
 */
function closeSettingsModal() {
    if (settingsOverlay) {
        settingsOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ===== CONTROLES DE CONFIGURACIÓN =====

/**
 * Inicializa los controles del modal (nombre, Enter to send)
 */
function initSettingsControls() {
    // Control de nombre de usuario
    const userNameInput = document.getElementById('userNameInput');
    const clearNameBtn = document.getElementById('clearUserNameBtn');
    const saveNameBtn = document.getElementById('saveUserNameBtn');
    
    if (userNameInput) {
        const savedName = localStorage.getItem('pera_user_name') || 'user0873837';
        userNameInput.value = savedName;
    }
    
    if (clearNameBtn) {
        clearNameBtn.addEventListener('click', () => {
            if (userNameInput) userNameInput.value = '';
        });
    }
    
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', () => {
            if (userNameInput) {
                let name = userNameInput.value.trim();
                if (!name) name = 'user0873837';
                
                if (typeof window.setUserName === 'function') {
                    window.setUserName(name);
                }
                
                // ✅ ACTUALIZAR EL SALUDO INMEDIATAMENTE
                if (typeof window.updateWelcomeGreeting === 'function') {
                    window.updateWelcomeGreeting();
                }
                
                // FORZAR RESET DEL CONTEXTO PARA QUE EL NUEVO NOMBRE HAGA EFECTO 
                if(typeof window.clearContext === 'function') {
                  window.clearContext();
                }
                
                saveNameBtn.textContent = '✓ Guardado';
                setTimeout(() => {
                    saveNameBtn.textContent = 'Guardar';
                }, 2000);
            }
        });
    }
    
    // Control de Enter para enviar
    const enterToSendCheckbox = document.getElementById('enterToSendCheckbox');
    if (enterToSendCheckbox) {
        const savedValue = localStorage.getItem('pera_enter_to_send') !== 'false';
        enterToSendCheckbox.checked = savedValue;
        
        if(typeof window.setEnterToSend === 'function') {
          window.setEnterToSend(savedValue);
        }
        
        enterToSendCheckbox.addEventListener('change', (e) => {
            const value = e.target.checked;
            localStorage.setItem('pera_enter_to_send', value);
            if (typeof window.setEnterToSend === 'function') {
                window.setEnterToSend(value);
            }
        });
    }
}

/**
 * Actualiza la inicial del perfil en el modal
 */
function updateProfileInitial() {
    const profileInitialEl = document.getElementById('profileInitial');
    if (!profileInitialEl) return;
    
    const userName = localStorage.getItem('pera_user_name') || 'user0873837';
    const initial = userName.charAt(0).toUpperCase();
    profileInitialEl.textContent = initial;
}

// ===== CUSTOM SELECTS =====

/**
 * Inicializa todos los selects personalizados
 */
function initCustomSelects() {
    initLanguageSelect();
    initPersonalitySelect();
    initModelSelect();
    initAccentColorSelect();
}

/**
 * Inicializa el selector de idiomas
 */
function initLanguageSelect() {
    const container = document.getElementById('languageSelectContainer');
    const trigger = document.getElementById('languageSelectTrigger');
    const dropdown = document.getElementById('languageSelectDropdown');
    
    if (!container || !trigger || !dropdown) return;
    
    // Esperar a que los idiomas estén cargados
    if (typeof window.isLanguagesLoaded === 'function' && !window.isLanguagesLoaded()) {
        trigger.querySelector('.custom-select-value').textContent = 'Cargando idiomas...';
        window.addEventListener('languagesReady', () => renderLanguageSelect());
        return;
    }
    
    renderLanguageSelect();
    
    function renderLanguageSelect() {
        const languages = typeof window.getLanguagesList === 'function' ? window.getLanguagesList() : [];
        
        if (languages.length === 0) {
            trigger.querySelector('.custom-select-value').textContent = 'Error al cargar idiomas';
            return;
        }
        
        // Actualizar contador
        const languageHint = document.getElementById('languageCountHint');
        if (languageHint) {
            languageHint.textContent = `${languages.length} idiomas disponibles`;
        }
        
        // Llenar dropdown
        dropdown.innerHTML = '';
        languages.forEach(lang => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.dataset.value = lang.code;
            option.innerHTML = `${lang.flag} ${lang.name}`;
            dropdown.appendChild(option);
        });
        
        const options = dropdown.querySelectorAll('.custom-select-option');
        
        // Seleccionar valor guardado
        const savedLanguage = localStorage.getItem('pera_language') || 'es';
        const savedOption = Array.from(options).find(opt => opt.dataset.value === savedLanguage);
        
        if (savedOption) {
            trigger.querySelector('.custom-select-value').textContent = savedOption.textContent;
            savedOption.classList.add('selected');
        } else if (options.length > 0) {
            trigger.querySelector('.custom-select-value').textContent = options[0].textContent;
            options[0].classList.add('selected');
        }
        
        // Eventos
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllCustomSelects();
            container.classList.toggle('open');
        });
        
        options.forEach(option => {
            option.addEventListener('click', () => {
                const value = option.dataset.value;
                trigger.querySelector('.custom-select-value').textContent = option.textContent;
                container.classList.remove('open');
                
                if (typeof window.setLanguage === 'function') {
                    window.setLanguage(value);
                }
                
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }
}

/**
 * Inicializa el selector de personalidad
 */
function initPersonalitySelect() {
    const container = document.getElementById('personalitySelectContainer');
    const trigger = document.getElementById('personalitySelectTrigger');
    const dropdown = document.getElementById('personalitySelectDropdown');
    const options = dropdown ? dropdown.querySelectorAll('.custom-select-option') : [];
    
    if (!container || !trigger) return;
    
    const personalityNames = {
        profesional: 'Profesional', amigable: 'Amigable',
        creativo: 'Creativo', divertido: 'Divertido', educativo: 'Educativo',
        sarcastica: 'Sarcástica', humana: 'Humana', rapida: 'Rápida'
    };
    
    const savedPersonality = localStorage.getItem('pera_personality') || 'profesional';
    const savedOption = Array.from(options).find(opt => opt.dataset.value === savedPersonality);
    
    if (savedOption) {
        const strongText = savedOption.querySelector('strong')?.textContent || personalityNames[savedPersonality];
        trigger.querySelector('.custom-select-value').textContent = strongText;
    } else {
        trigger.querySelector('.custom-select-value').textContent = personalityNames[savedPersonality];
    }
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllCustomSelects();
        container.classList.toggle('open');
    });
    
    options.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            const displayText = option.querySelector('strong')?.textContent || value;
            trigger.querySelector('.custom-select-value').textContent = displayText;
            container.classList.remove('open');
            
            if (typeof window.setPersonality === 'function') {
                window.setPersonality(value);
            }
            
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
}

/**
 * Inicializa el selector de modelos con carga dinámica
 */
async function initModelSelect() {
    const container = document.getElementById('modelSelectContainer');
    const trigger = document.getElementById('modelSelectTrigger');
    const dropdown = document.getElementById('modelSelectDropdown');
    
    if (!container || !trigger || !dropdown) return;
    
    await populateModelsDropdown(trigger, dropdown);
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllCustomSelects();
        container.classList.toggle('open');
    });
}

/**
 * Carga y renderiza los modelos disponibles
 */
async function populateModelsDropdown(trigger, dropdown) {
    const EIGHT_HOURS = 28800000;
    const lastFetch = localStorage.getItem('pera_models_last_fetch');
    const cachedModels = localStorage.getItem('pera_models_cache');
    
    let models = null;
    
    if (cachedModels && lastFetch && (Date.now() - lastFetch < EIGHT_HOURS)) {
        models = JSON.parse(cachedModels);
    } else {
        try {
            const response = await fetch('https://gen.pollinations.ai/v1/models');
            const data = await response.json();
            if (data && data.data && data.data.length > 0) {
                models = data;
                localStorage.setItem('pera_models_cache', JSON.stringify(models));
                localStorage.setItem('pera_models_last_fetch', Date.now());
            }
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    }
    
    if (!models || !models.data || models.data.length === 0) {
        trigger.querySelector('.custom-select-value').textContent = 'openai (default)';
        return;
    }
    
    dropdown.innerHTML = '';
    const savedModel = localStorage.getItem('pera_default_model') || 'openai';
    let selectedOption = null;
    
    models.data.forEach(model => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        if (model.id === savedModel) {
            option.classList.add('selected');
            selectedOption = option;
        }
        option.dataset.value = model.id;
        option.textContent = model.id;
        
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            trigger.querySelector('.custom-select-value').textContent = value;
            document.getElementById('modelSelectContainer').classList.remove('open');
            
            if (typeof window.setActiveModel === 'function') {
                window.setActiveModel(value);
            }
            
            dropdown.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
        
        dropdown.appendChild(option);
    });
    
    if (selectedOption) {
        trigger.querySelector('.custom-select-value').textContent = selectedOption.textContent;
    } else {
        trigger.querySelector('.custom-select-value').textContent = savedModel;
    }
}

/**
 * Inicializa el selector de color de acento
 */
function initAccentColorSelect() {
    const container = document.getElementById('accentColorSelectContainer');
    const trigger = document.getElementById('accentColorSelectTrigger');
    const dropdown = document.getElementById('accentColorSelectDropdown');
    const options = dropdown ? dropdown.querySelectorAll('.custom-select-option') : [];
    
    if (!container || !trigger) return;
    
    const colorNames = {
        '#333537': 'Google',
        '#0976E3': 'Azul',
        '#00c230': 'Verde',
        '#ffd60a': 'Amarillo',
        '#2b001d': 'Rosa',
        '#af6a00': 'Naranja'
    };
    
    const savedColor = localStorage.getItem('pera_accent_color') || '#333537';
    applyUserBubbleColor(savedColor);
    
    // Actualizar trigger con el color guardado
    const savedOption = Array.from(options).find(opt => opt.dataset.value === savedColor);
    if (savedOption) {
        const colorSpan = savedOption.querySelector('.color-preview').cloneNode(true);
        const textNode = savedOption.childNodes[1]?.textContent || colorNames[savedColor];
        trigger.querySelector('.custom-select-value').innerHTML = '';
        trigger.querySelector('.custom-select-value').appendChild(colorSpan);
        trigger.querySelector('.custom-select-value').appendChild(document.createTextNode(textNode));
    }
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllCustomSelects();
        container.classList.toggle('open');
    });
    
    options.forEach(option => {
        option.addEventListener('click', () => {
            const colorValue = option.dataset.value;
            const colorName = option.childNodes[1]?.textContent?.trim() || colorNames[colorValue];
            
            const colorSpan = option.querySelector('.color-preview').cloneNode(true);
            trigger.querySelector('.custom-select-value').innerHTML = '';
            trigger.querySelector('.custom-select-value').appendChild(colorSpan);
            trigger.querySelector('.custom-select-value').appendChild(document.createTextNode(colorName));
            
            container.classList.remove('open');
            localStorage.setItem('pera_accent_color', colorValue);
            applyUserBubbleColor(colorValue);
            
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
}

/**
 * Cierra todos los selects personalizados abiertos
 */
function closeAllCustomSelects() {
    document.querySelectorAll('.custom-select.open').forEach(select => {
        select.classList.remove('open');
    });
}

/**
 * Aplica el color de acento a las burbujas de usuario
 * @param {string} color - Color en formato hex
 */
function applyUserBubbleColor(color) {
    document.documentElement.style.setProperty('--user-bubble-color', color);
    
    const userBubbles = document.querySelectorAll('.message-user .bubble');
    userBubbles.forEach(bubble => {
        bubble.style.backgroundColor = color;
    });
}

/**
 * Observa nuevas burbujas para aplicarles el color dinámico
 */
function observeNewUserBubbles() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList && node.classList.contains('message-user')) {
                    const bubble = node.querySelector('.bubble');
                    if (bubble) {
                        const savedColor = localStorage.getItem('pera_accent_color') || '#333537';
                        bubble.style.backgroundColor = savedColor;
                    }
                }
            });
        });
    });
    
    const messagesContainer = document.getElementById('messagesDynamic');
    if (messagesContainer) {
        observer.observe(messagesContainer, { childList: true, subtree: true });
    }
}

// ===== TABS =====

/**
 * Inicializa los tabs del modal de configuración
 */
function initTabs() {
    const tabBtns = document.querySelectorAll('.settings-tab-btn');
    const tabPanes = document.querySelectorAll('.settings-tab-pane');
    
    if (tabBtns.length === 0) return;
  
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active-tab'));
            btn.classList.add('active-tab');
            
            tabPanes.forEach(pane => pane.classList.remove('active-pane'));
            const activePane = document.getElementById(`tab-${tabId}`);
            if (activePane) activePane.classList.add('active-pane');
            // Si el tab activo es history, cargar el historial
            if (tabId === 'history') {
              loadHistoryList();
            }
        });
    });
}

// ===== SLIDER DE TEMPERATURA =====

/**
 * Inicializa el slider de temperatura moderno
 */
function initTemperatureSlider() {
    const sliderTrack = document.getElementById('sliderTrack');
    const sliderFill = document.getElementById('sliderFill');
    const sliderThumb = document.getElementById('sliderThumb');
    const hiddenSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    
    if (!sliderTrack) return;
    
    let isDragging = false;
    
    function updateSliderFromValue(value) {
        const percent = value * 100;
        if (sliderFill) sliderFill.style.width = `${percent}%`;
        if (sliderThumb) sliderThumb.style.left = `${percent}%`;
        if (temperatureValue) temperatureValue.textContent = value;
        if (hiddenSlider) hiddenSlider.value = value;
        localStorage.setItem('pera_temperature', value);
    }
    
    function handleSliderMove(clientX) {
        if (!isDragging) return;
        const rect = sliderTrack.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percent = x / rect.width;
        const value = Math.round(percent * 10) / 10;
        updateSliderFromValue(value);
    }
    
    const savedTemp = localStorage.getItem('pera_temperature') || '0.7';
    updateSliderFromValue(parseFloat(savedTemp));
    
    sliderTrack.addEventListener('mousedown', (e) => {
        isDragging = true;
        handleSliderMove(e.clientX);
    });
    
    if (sliderThumb) {
        sliderThumb.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.preventDefault();
        });
    }
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) handleSliderMove(e.clientX);
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Touch events para móviles
    sliderTrack.addEventListener('touchstart', (e) => {
        isDragging = true;
        handleSliderMove(e.touches[0].clientX);
    });
    
    if (sliderThumb) {
        sliderThumb.addEventListener('touchstart', (e) => {
            isDragging = true;
            e.preventDefault();
        });
    }
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) handleSliderMove(e.touches[0].clientX);
    });
    
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
}

// ===== CARGA DE CONFIGURACIONES A UI =====

/**
 * Carga todas las configuraciones guardadas a la interfaz
 */
function loadSettingsToUI() {
    // Nombre de usuario
    const userName = localStorage.getItem('pera_user_name') || 'user0873837';
    const userNameInput = document.getElementById('userNameInput');
    if (userNameInput) userNameInput.value = userName;
    updateProfileInitial();
    
    // Enter to send
    const enterToSend = localStorage.getItem('pera_enter_to_send') !== 'false';
    const enterToSendCheckbox = document.getElementById('enterToSendCheckbox');
    if (enterToSendCheckbox) enterToSendCheckbox.checked = enterToSend;
    
    // Color de acento
    const accentColor = localStorage.getItem('pera_accent_color') || '#2C2C2E';
    applyUserBubbleColor(accentColor);
}

// ===== MANEJO DE MENSAJES =====

/**
 * Maneja el envío de un mensaje (con rate limit integrado)
 */
async function handleSendMessage() {
    const message = chatTextarea.value.trim();
    if (!message || isTyping) return;
    
    // Edición de mensaje NO aplica rate limit
    if (editingMessage) {
        await handleEditMessage(message);
        return;
    }
    
    // === RATE LIMIT CHECK ===
    const canSend = checkRateLimit();
    
    // Siempre mostrar la burbuja del usuario (visible para él)
    if (typeof window.hideWelcomeChat === 'function') {
        window.hideWelcomeChat();
    }
    
    messageArea.classList.add('sticky');
    
    const userBubble = createUserBubble(message);
    messagesDynamic.appendChild(userBubble);
    resetTextarea();
    scrollToBottom();
    
    // Si está bloqueado por rate limit
    if (!canSend) {
        const remainingTime = getRateLimitRemainingTime();
        console.log(`[Rate Limit] Bloqueado. Tiempo restante: ${remainingTime}`);
        
        // Mostrar nota de rate limit (reemplaza cualquier nota existente)
        const noticeElement = window.createRateLimitNotice();
        if (noticeElement) {
            messagesDynamic.appendChild(noticeElement);
            scrollToBottom();
        }
        return; // No llamar a la API
    }
    
    // === FLUJO NORMAL (con crédito disponible) ===
    const messagesWithContext = formatMessages(message);
    currentStreamingMessage = '';
    
    showTypingIndicator();
    
    try {
        await callPollinationsAPI(messagesWithContext, (chunk) => {
            updateStreamingMessage(chunk);
        });
        
        hideTypingIndicator();
        finalizeStreamingMessage();
        scrollToBottom();
        
        // Incrementar contador SOLO si la API respondió exitosamente
        incrementRateLimit();
        
        if (typeof window.marcarSaludoComoHecho === 'function' && localStorage.getItem('pera_user_name')) {
            window.marcarSaludoComoHecho();
        }
        
        addToContext({ role: 'assistant', content: currentStreamingMessage });
        
        // Guardar conversación en historial
        saveCurrentConversation();
        
    } catch (error) {
        hideTypingIndicator();
        
        const errorBubble = createBotBubble(`❌ Error: ${error.message}`);
        messagesDynamic.appendChild(errorBubble);
        scrollToBottom();
        
        // NO incrementar rate limit en caso de error
    }
}

/**
 * Maneja el toggle de modelos (think/search)
 * @param {string} type - 'think' o 'search'
 * @param {HTMLElement} button - Botón que disparó la acción
 */
function handleModelToggle(type, button) {
    if (typeof window.setActiveModel === 'function') {
        window.setActiveModel(type);
    }
    
    button.classList.toggle('active');
    
    const otherType = type === 'think' ? 'search' : 'think';
    const otherButton = document.getElementById(otherType + 'Btn');
    if (otherButton && otherButton.classList.contains('active')) {
        otherButton.classList.remove('active');
    }
}

/**
 * Maneja la creación de un nuevo chat
 * También elimina cualquier nota de rate limit visible
 */
function handleNewChat() {
    // Crear nueva conversación
    createNewConversation();
    
    // Eliminar nota de rate limit si existe
    const existingNotice = document.getElementById('rateLimitNotice');
    if (existingNotice) {
        existingNotice.remove();
    }
    
    if (typeof window.setActiveModel === 'function') {
        window.setActiveModel('openai');
    }
    
    const thinkBtn = document.getElementById('thinkBtn');
    const searchBtn = document.getElementById('searchBtn');
    if (thinkBtn) thinkBtn.classList.remove('active');
    if (searchBtn) searchBtn.classList.remove('active');
    
    if (!chatTextarea.matches(':focus')) {
        messageArea.classList.remove('sticky');
    }
}

// ===== FUNCIONES DE EDICIÓN =====

/**
 * Inicia la edición de un mensaje de usuario
 * @param {HTMLElement} button - Botón de editar
 */
function editUserMessage(button) {
    const userMessageDiv = button.closest('.message-user');
    const originalMessage = userMessageDiv.querySelector('.bubble').innerText;
    
    chatTextarea.value = originalMessage;
    chatTextarea.focus();
    adjustTextareaHeight();
    
    editingMessage = {
        element: userMessageDiv,
        originalText: originalMessage
    };
}

/**
 * Maneja la edición y reenvío de un mensaje
 * @param {string} newMessage - Nuevo contenido del mensaje
 */
async function handleEditMessage(newMessage) {
    if (!editingMessage) return;
    
    const bubble = editingMessage.element.querySelector('.bubble');
    bubble.innerHTML = marked.parse(newMessage.replace(/\n/g, '<br>'));
    
    const allMessages = Array.from(messagesDynamic.children);
    const currentIndex = allMessages.indexOf(editingMessage.element);
    
    for (let i = currentIndex + 1; i < allMessages.length; i++) {
        allMessages[i].remove();
    }
    
    if (typeof window.clearContext === 'function') {
        window.clearContext();
    }
    
    const remainingUserMessages = Array.from(messagesDynamic.children)
        .filter(msg => msg.classList.contains('message-user'))
        .map(msg => msg.querySelector('.bubble').innerText);
    
    remainingUserMessages.forEach(msg => {
        if (typeof window.addToContext === 'function') {
            window.addToContext({ role: 'user', content: msg });
        }
    });
    
    resetTextarea();
    editingMessage = null;
    
    const messagesWithContext = formatMessages(newMessage);
    currentStreamingMessage = '';
    
    showTypingIndicator();
    
    try {
        await callPollinationsAPI(messagesWithContext, (chunk) => {
            updateStreamingMessage(chunk);
        });
        
        hideTypingIndicator();
        finalizeStreamingMessage();
        
        if (typeof window.addToContext === 'function') {
            window.addToContext({ role: 'assistant', content: currentStreamingMessage });
        }
        
        // Actualizar conversación en historial después de editar
        saveCurrentConversation();
        
        scrollToBottom();
        
    } catch (error) {
        hideTypingIndicator();
        const errorBubble = createBotBubble(`❌ Error: ${error.message}`);
        messagesDynamic.appendChild(errorBubble);
        scrollToBottom();
    }
}

// ===== CONTROL DE BOTONES THINK Y SEARCH =====

/**
 * Maneja el estado visual de los botones de modelo (Think/Search)
 * @param {string} type - 'think' o 'search'
 * @param {HTMLElement} button - El botón que se está activando
 */
function handleModelToggle(type, button) {
    // Cambiar el modelo en la API
    if (typeof window.setActiveModel === 'function') {
        window.setActiveModel(type);
    }
    
    // Toggle visual del botón clickeado
    button.classList.toggle('active-btn');
    
    // Desactivar visualmente el otro botón
    const otherType = type === 'think' ? 'search' : 'think';
    const otherButton = document.getElementById(otherType + 'Btn');
    if (otherButton && otherButton.classList.contains('active-btn')) {
        otherButton.classList.remove('active-btn');
    }
}

// ===== EXPORTACIONES GLOBALES =====
window.updateProfileInitial = updateProfileInitial;