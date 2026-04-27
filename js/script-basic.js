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
let activeId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);  // ← Declarado aquí
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

// Actualizar tema si es la conversación activa (CORREGIDO - sin redeclarar)
if (activeId && conversation.id === activeId) {
    updateChatTheme(conversation.title);
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
            const savedColor = localStorage.getItem('pera_accent_color') || '#2C2C2E';
            bubbleDiv.style.backgroundColor = savedColor;
        }
        
        messageDiv.appendChild(bubbleDiv);
        
        // Añadir botones de acción
const actionsDiv = document.createElement('div');
actionsDiv.className = 'message-actions';

// Botón de copiar (todos los mensajes)
actionsDiv.innerHTML = `
    <button class="action-btn copy-btn" aria-label="Copiar mensaje" onclick="window.copyMessage(this)">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-iconid="446994" data-svgname="Copy"><path clip-rule="evenodd" d="m13.8 2.25h-.0321c-.8128-.00001-1.4685-.00001-1.9994.04336-.5466.04467-1.0267.13902-1.471.36537-.70557.35952-1.27925.9332-1.63877 1.63881-.22634.44421-.3207.92435-.36537 1.47099-.04337.53091-.04337 1.18651-.04336 1.99934v.00002.03211.45h-.45-.0321-.00003c-.81283-.00001-1.46843-.00001-1.99934.04336-.54663.04467-1.02678.13902-1.47099.36537-.70561.35952-1.27929.9332-1.63881 1.63877-.22634.4443-.3207.9244-.36537 1.471-.04337.5309-.04337 1.1866-.04336 1.9994v.0321 2.4.0321c-.00001.8128-.00001 1.4685.04336 1.9994.04467.5466.13903 1.0267.36537 1.471.35952.7056.9332 1.2792 1.63881 1.6388.44421.2263.92436.3207 1.47099.3653.53091.0434 1.18652.0434 1.99935.0434h.03212 2.4.0321c.8129 0 1.4685 0 1.9994-.0434.5466-.0446 1.0267-.139 1.471-.3653.7056-.3596 1.2792-.9332 1.6388-1.6388.2263-.4443.3207-.9244.3653-1.471.0434-.5309.0434-1.1865.0434-1.9994v-.0321-.45h.45.0321c.8129 0 1.4685 0 1.9994-.0434.5466-.0446 1.0267-.139 1.471-.3653.7056-.3596 1.2793-.9332 1.6388-1.6388.2263-.4443.3207-.9244.3653-1.471.0434-.5309.0434-1.1865.0434-1.9994v-.0321-2.4-.03212c0-.81283 0-1.46844-.0434-1.99935-.0446-.54664-.139-1.02678-.3653-1.47099-.3595-.70561-.9332-1.27929-1.6388-1.63881-.4443-.22635-.9244-.3207-1.471-.36537-.5309-.04337-1.1865-.04337-1.9994-.04336h-.0321zm1.95 12h.45c.8525 0 1.4467-.0006 1.9093-.0384.4539-.0371.7147-.1062.9122-.2068.4233-.2158.7675-.56.9833-.9833.1006-.1975.1697-.4583.2068-.9122.0378-.4626.0384-1.0568.0384-1.9093v-2.4c0-.85245-.0006-1.44669-.0384-1.90932-.0371-.45388-.1062-.71464-.2068-.91216-.2158-.42336-.56-.76757-.9833-.98328-.1975-.10064-.4583-.16978-.9122-.20686-.4626-.0378-1.0568-.03838-1.9093-.03838h-2.4c-.8525 0-1.4467.00058-1.9093.03838-.4539.03708-.7147.10622-.9122.20686-.4233.21571-.7675.55992-.98326.98328-.10064.19752-.16977.45828-.20686.91216-.0378.46263-.03838 1.05687-.03838 1.90932v.45h.45.0321c.8129-.00001 1.4685-.00001 1.9994.04336.5466.04467 1.0267.13902 1.471.36537.7056.35952 1.2792.9332 1.6388 1.63877.2263.4443.3207.9244.3653 1.471.0434.5309.0434 1.1865.0434 1.9994v.0321zm-10.77148-4.25476c.19752-.10064.45829-.16978.91216-.20686.46263-.0378 1.05687-.03838 1.90932-.03838h2.4c.8525 0 1.4467.00058 1.9093.03838.4539.03708.7147.10622.9122.20686.4233.21576.7675.55996.9833.98326.1006.1975.1697.4583.2068.9122.0378.4626.0384 1.0568.0384 1.9093v2.4c0 .8525-.0006 1.4467-.0384 1.9093-.0371.4539-.1062.7147-.2068.9122-.2158.4233-.56.7675-.9833.9833-.1975.1006-.4583.1697-.9122.2068-.4626.0378-1.0568.0384-1.9093.0384h-2.4c-.85245 0-1.44669-.0006-1.90932-.0384-.45387-.0371-.71464-.1062-.91216-.2068-.42336-.2158-.76757-.56-.98328-.9833-.10064-.1975-.16977-.4583-.20686-.9122-.0378-.4626-.03838-1.0568-.03838-1.9093v-2.4c0-.8525.00058-1.4467.03838-1.9093.03709-.4539.10622-.7147.20686-.9122.21571-.4233.55992-.7675.98328-.98326z" fill="currentColor" fill-rule="evenodd"></path></svg>
    </button>
`;

// Botones exclusivos del bot (compartir + PDF)
if (msg.role === 'assistant') {
    actionsDiv.innerHTML += `
        <button class="action-btn share-btn" aria-label="Compartir mensaje" onclick="window.shareMessage(this)">
            <svg width="21" height="21" viewBox="0 0 24 24" id="share" xmlns="http://www.w3.org/2000/svg" data-iconid="304536" data-svgname="Share">
                <rect id="Rectangle_3" data-name="Rectangle 3" width="24" height="24" fill="none"></rect>
                <path id="Rectangle" d="M12,4V0l8,7-8,7V10S0,9.069,0,14.737C0,3.4,12,4,12,4Z" transform="translate(2 5)" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="1.5"></path>
            </svg>
        </button>
        <button class="action-btn pdf-btn" aria-label="Descargar como PDF" onclick="window.exportBubbleToPDF(this)">
            <svg fill="currentColor" width="21" height="21" viewBox="0 0 14 14" role="img" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" data-iconid="443790" data-svgname="Gui file pdf"><path d="M 4.234349,9.6879554 C 4.4938196,9.4431464 4.9332679,9.2025734 5.5411662,8.9723137 5.8161804,8.4287305 6.0893538,7.8296366 6.3047315,7.2976563 6.1230948,6.9183603 6.005958,6.5183992 5.956119,6.1067981 5.769105,4.5611761 7.5191644,4.6760298 7.2529534,6.1156781 7.2019354,6.3915766 7.0800472,6.7787926 6.8903069,7.2680799 7.1658742,7.758509 7.5273418,8.1278228 7.8152859,8.3720059 8.2090215,8.3091279 8.7691072,8.244371 9.1633588,8.3022399 c 1.0477512,0.153936 0.9146642,1.3077747 -0.016098,1.3077747 -0.4870406,0 -1.0968907,-0.379554 -1.4787289,-0.6715131 -0.5848385,0.1074861 -1.210123,0.2730991 -1.7479227,0.4630231 -0.171654,0.33071 -0.402282,0.7514464 -0.6077507,1.0474584 -0.8573489,1.23565 -1.987318,0.09633 -1.0785101,-0.7610244 z m 0.8991575,0.04225 C 4.9438399,9.8258694 4.6766714,9.9905614 4.5326072,10.149139 4.309457,10.394795 4.4563574,10.588035 4.7258834,10.324292 4.8586021,10.194373 5.0196475,9.9550154 5.1335065,9.7302074 Z M 8.4641816,8.8287301 C 8.6403296,8.9477089 8.882266,9.0715504 9.1473352,9.0765964 9.4566069,9.0823564 9.4301955,8.8807051 9.0858562,8.8301293 8.9359726,8.8080673 8.7198946,8.8076953 8.4641816,8.8287493 Z M 6.2533085,8.7330307 C 6.4994075,8.6508139 7.0300978,8.5273405 7.1631112,8.4961777 7.1487832,8.4809257 6.7671287,8.0884076 6.6416663,7.871888 6.5415473,8.1240278 6.2604179,8.7177811 6.2533085,8.7330307 Z M 6.4893881,5.7453683 C 6.4464761,5.9664557 6.5108261,6.3222508 6.5861181,6.540502 6.6709141,6.3628804 6.7768161,5.9360297 6.7337925,5.7268769 6.6908445,5.5180559 6.5365005,5.5026953 6.4893879,5.7453689 Z M 7.640148,1.26517 C 7.49432,1.11934 7.20625,1 7,1 L 2.5,1 C 2.29375,1 2.125,1.16875 2.125,1.375 l 0,11.25 C 2.125,12.83125 2.29375,13 2.5,13 l 9,0 c 0.20625,0 0.375,-0.16875 0.375,-0.375 l 0,-6.75 c 0,-0.20625 -0.11932,-0.49432 -0.265148,-0.64015 L 7.640148,1.26517 Z M 11.125,12.25 l -8.25,0 0,-10.5 4.115133,0 c 0.03417,0.006 0.09853,0.0323 0.12668,0.0525 l 3.955734,3.95571 c 0.02018,0.0281 0.04683,0.0925 0.05245,0.12668 l 0,6.36513 z M 11.5,1 9.25,1 C 9.04375,1 8.99432,1.11932 9.140148,1.26515 l 2.46968,2.46968 C 11.75568,3.88068 11.875,3.83125 11.875,3.625 l 0,-2.25 C 11.875,1.16875 11.70625,1 11.5,1 Z"></path></svg>
        </button>
    `;
}

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
    
    // Actualizar tema del header
    updateChatTheme(conversation.title);
    scrollToBottom();
    
    // Recargar historial para actualizar estado activo
    loadHistoryList();
}

/**
 * Actualiza el título del tema en el header según la conversación activa
 * @param {string} theme - Tema a mostrar (opcional, si no se pasa, usa el de la conversación activa)
 */
function updateChatTheme(theme) {
    const themeElement = document.getElementById('alondraChatTheme');
    if (!themeElement) return;
    
    let finalTheme = 'Nuevo Chat'; // Por defecto
    
    if (theme) {
        finalTheme = theme;
    } else {
        // Intentar obtener el tema de la conversación activa
        const activeId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
        const conversations = getConversations();
        const activeConversation = activeId ? conversations.find(c => c.id === activeId) : null;
        
        if (activeConversation && activeConversation.title) {
            finalTheme = activeConversation.title;
        }
    }
    
    // Truncar texto de forma inteligente según el ancho del contenedor
    themeElement.textContent = truncateTextToFit(finalTheme, themeElement);
}

/**
 * Trunca un texto para que quepa en el contenedor, de forma inteligente
 * @param {string} text - Texto a truncar
 * @param {HTMLElement} element - Elemento donde se mostrará
 * @returns {string} - Texto truncado
 */
function truncateTextToFit(text, element) {
    if (!element || !text) return text;
    
    // Guardar el texto original para calcular
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'nowrap';
    tempSpan.style.fontSize = window.getComputedStyle(element).fontSize;
    tempSpan.style.fontWeight = window.getComputedStyle(element).fontWeight;
    tempSpan.style.fontFamily = window.getComputedStyle(element).fontFamily;
    tempSpan.textContent = text;
    document.body.appendChild(tempSpan);
    
    const textWidth = tempSpan.offsetWidth;
    const containerWidth = element.parentElement?.offsetWidth || 300;
    document.body.removeChild(tempSpan);
    
    // Si el texto cabe, devolverlo completo
    if (textWidth <= containerWidth - 20) { // 20px de margen
        return text;
    }
    
    // Truncar inteligentemente (preferir palabras completas)
    let truncated = text;
    let ellipsis = '...';
    let maxLength = Math.floor((containerWidth - 20) / (textWidth / text.length));
    
    if (maxLength < 5) maxLength = 5;
    
    // Intentar truncar en un espacio en blanco
    let lastSpace = text.lastIndexOf(' ', maxLength - 3);
    if (lastSpace > 5) {
        truncated = text.substring(0, lastSpace) + ellipsis;
    } else {
        truncated = text.substring(0, maxLength - 3) + ellipsis;
    }
    
    return truncated;
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
    // Actualizar tema del header (Nuevo Chat por defecto)
    updateChatTheme('Nuevo Chat');
    
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
        updateChatTheme(lastConversation.title);
      }, 100);
    }
});

// ===== CONFIGURACIÓN DE EVENTOS PRINCIPALES =====

/**
 * Configura todos los event listeners del chat usando delegación de eventos
 */
function setupEventListeners() {
    // Usar delegación de eventos en el documento (nunca se reemplaza)
    document.body.addEventListener('click', (e) => {
        // Botón Enviar
        const sendBtn = e.target.closest('#sendBtn');
        if (sendBtn) {
            e.preventDefault();
            handleSendMessage();
            return;
        }
        
        // Botón Pensar
        const thinkBtn = e.target.closest('#thinkBtn');
        if (thinkBtn) {
            e.preventDefault();
            handleModelToggle('think', thinkBtn);
            return;
        }
        
        // Botón Buscar
        const searchBtn = e.target.closest('#searchBtn');
        if (searchBtn) {
            e.preventDefault();
            handleModelToggle('search', searchBtn);
            return;
        }
        
        // Botones Nuevo Chat (desktop y móvil)
        const newChatBtn = e.target.closest('#newChatBtnDesktop, #newChatBtnMobile');
        if (newChatBtn) {
            e.preventDefault();
            handleNewChat();
            return;
        }
        
        // Botones Configuración (desktop y móvil)
        const settingsBtn = e.target.closest('#settingsBtnDesktop, #settingsBtnMobile');
        if (settingsBtn) {
            e.preventDefault();
            openSettingsModal();
            return;
        }
    });
    
    // Delegación de eventos para edición de mensajes (esto ya estaba bien)
    const messagesDynamic = document.getElementById('messagesDynamic');
    if (messagesDynamic) {
        // Eliminar listener anterior si existe (para evitar duplicados)
        messagesDynamic.removeEventListener('click', window._editMessageHandler);
        
        // Crear handler y guardar referencia
        window._editMessageHandler = (e) => {
            const editBtn = e.target.closest('.edit-message-user');
            if (editBtn) {
                e.preventDefault();
                editUserMessage(editBtn);
            }
        };
        
        messagesDynamic.addEventListener('click', window._editMessageHandler);
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
        const savedName = localStorage.getItem('pera_user_name') || 'User';
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
                if (!name) name = 'User';
                
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
    
    const userName = localStorage.getItem('pera_user_name') || 'User';
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
        '#2C2C2E': 'Predeterminada',
        '#0976E3': 'Azul',
        '#00c230': 'Verde',
        '#ffd60a': 'Amarillo',
        '#2b001d': 'Rosa',
        '#af6a00': 'Naranja'
    };
    
    const savedColor = localStorage.getItem('pera_accent_color') || '#2C2C2E';
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
                        const savedColor = localStorage.getItem('pera_accent_color') || '#2C2C2E';
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
    const userName = localStorage.getItem('pera_user_name') || 'User';
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