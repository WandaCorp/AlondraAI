/**
 * ============================================
 * UI.JS
 * Manejo de la interfaz de usuario, renderizado y eventos visuales
 * ============================================
 */

// ===== CONFIGURACIÓN DE MARKED (RENDERIZADO DE MARKDOWN) =====
const renderer = new marked.Renderer();

// Personalizar renderizado de tablas
renderer.table = function(header, body) {
    return `
        <div class="table-wrapper">
            <table>
                <thead>${header}</thead>
                <tbody>${body}</tbody>
            </table>
        </div>
    `;
};

renderer.tablerow = function(content) {
    return `<tr>${content}</tr>`;
};

renderer.tablecell = function(content, flags) {
    const type = flags.header ? 'th' : 'td';
    const tag = flags.align ? `<${type} align="${flags.align}">` : `<${type}>`;
    return tag + content + `</${type}>`;
};

// Personalizar renderizado de bloques de código
renderer.code = function(code, language) {
    const lang = language || 'text';
    const validLang = hljs.getLanguage(lang) ? lang : 'text';
    const highlighted = hljs.highlight(code, { language: validLang }).value;
    
    return `
        <div class="code-block-wrapper">
            <div class="code-header">
                <span class="code-language">${validLang}</span>
                <button class="code-copy-btn" onclick="window.copyCodeBlock(this)" aria-label="Copiar código">
                    <span class="material-symbols-outlined" translate="no">content_copy</span>
                </button>
            </div>
            <pre><code class="hljs language-${validLang}">${highlighted}</code></pre>
        </div>
    `;
};

// Configuración global de marked
marked.setOptions({
    renderer: renderer,
    breaks: true,
    gfm: true,
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

// ===== ELEMENTOS DEL DOM =====
const messageContainer = document.getElementById('messageContainer');
const messagesDynamic = document.getElementById('messagesDynamic');
const chatTextarea = document.getElementById('chatTextarea');
const messageArea = document.getElementById('messageArea');
const sendBtn = document.getElementById('sendBtn');

// ===== ESTADO GLOBAL DE UI =====
let isTyping = false;               // Indicador de typing activo
let typingAnimationInterval;        // Intervalo de animación de typing
let currentStreamingMessage = '';   // Mensaje en proceso de streaming
let enterToSend = localStorage.getItem('pera_enter_to_send') !== 'false'; // true por defecto

// ===== FUNCIONES DE CREACIÓN DE BURBUJAS =====

/**
 * Crea una burbuja de mensaje de usuario
 * @param {string} message - Contenido del mensaje
 * @returns {HTMLElement} - Elemento DOM de la burbuja
 */
function createUserBubble(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-user';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'bubble user-bubble';
    bubbleDiv.innerHTML = marked.parse(message.replace(/\n/g, '<br>'));
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    actionsDiv.innerHTML = `
        <button class="action-btn copy-btn" aria-label="Copiar mensaje" onclick="window.copyMessage(this)">
            <svg width="21" height="21" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-iconid="500521" data-svgname="Copy document"><path fill="currentColor" d="M768 832a128 128 0 0 1-128 128H192A128 128 0 0 1 64 832V384a128 128 0 0 1 128-128v64a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64h64z"></path><path fill="currentColor" d="M384 128a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64V192a64 64 0 0 0-64-64H384zm0-64h448a128 128 0 0 1 128 128v448a128 128 0 0 1-128 128H384a128 128 0 0 1-128-128V192A128 128 0 0 1 384 64z"></path></svg>
        </button> 
        <button class="action-btn edit-message-user" aria-label="Editar mensaje">
            <svg fill="currentColor" width="21" height="21" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-iconid="357674" data-svgname="Edit alt"><path d="M5,18H9.24a1,1,0,0,0,.71-.29l6.92-6.93h0L19.71,8a1,1,0,0,0,0-1.42L15.47,2.29a1,1,0,0,0-1.42,0L11.23,5.12h0L4.29,12.05a1,1,0,0,0-.29.71V17A1,1,0,0,0,5,18ZM14.76,4.41l2.83,2.83L16.17,8.66,13.34,5.83ZM6,13.17l5.93-5.93,2.83,2.83L8.83,16H6ZM21,20H3a1,1,0,0,0,0,2H21a1,1,0,0,0,0-2Z"></path></svg>
        </button>
    `;
    
    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(actionsDiv);
    return messageDiv;
}

/**
 * Crea una burbuja de mensaje del bot
 * @param {string} message - Contenido del mensaje
 * @returns {HTMLElement} - Elemento DOM de la burbuja
 */
function createBotBubble(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-ia';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'bubble bot-bubble';
    if (message) bubbleDiv.innerHTML = marked.parse(message);
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    actionsDiv.innerHTML = `
        <button class="action-btn copy-btn" aria-label="Copiar mensaje" onclick="window.copyMessage(this)">
            <svg width="21" height="21" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-iconid="500521" data-svgname="Copy document"><path fill="currentColor" d="M768 832a128 128 0 0 1-128 128H192A128 128 0 0 1 64 832V384a128 128 0 0 1 128-128v64a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64h64z"></path><path fill="currentColor" d="M384 128a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64V192a64 64 0 0 0-64-64H384zm0-64h448a128 128 0 0 1 128 128v448a128 128 0 0 1-128 128H384a128 128 0 0 1-128-128V192A128 128 0 0 1 384 64z"></path></svg>
        </button> 
    `;
    
    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(actionsDiv);
    return messageDiv;
}

// ===== FUNCIONES DE STREAMING =====

/**
 * Actualiza el mensaje en streaming con nuevos fragmentos
 * @param {string} newChunk - Fragmento de texto nuevo
 */
function updateStreamingMessage(newChunk) {
    currentStreamingMessage += newChunk;
    
    let streamingMsg = document.getElementById('streaming-message');
    
    if (!streamingMsg) {
        streamingMsg = document.createElement('div');
        streamingMsg.className = 'message-ia';
        streamingMsg.id = 'streaming-message';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'bubble bot-bubble';
        streamingMsg.appendChild(bubbleDiv);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        actionsDiv.style.opacity = '0';
        streamingMsg.appendChild(actionsDiv);
        
        messagesDynamic.appendChild(streamingMsg);
    }
    
    const bubble = streamingMsg.querySelector('.bubble');
    if (bubble) {
        requestAnimationFrame(() => {
            bubble.innerHTML = marked.parse(currentStreamingMessage);
        });
    }
}

/**
 * Finaliza el mensaje en streaming y añade botones de acción
 */
function finalizeStreamingMessage() {
    const streamingMsg = document.getElementById('streaming-message');
    
    if (streamingMsg) {
        streamingMsg.id = '';
        
        const bubble = streamingMsg.querySelector('.bubble');
        if (bubble) {
            bubble.innerHTML = marked.parse(currentStreamingMessage);
        }
        
        const actionsDiv = streamingMsg.querySelector('.message-actions');
        if (actionsDiv) {
            actionsDiv.innerHTML = `
                <button class="action-btn copy-btn" aria-label="Copiar mensaje" onclick="window.copyMessage(this)">
                    <svg width="21" height="21" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-iconid="500521" data-svgname="Copy document"><path fill="currentColor" d="M768 832a128 128 0 0 1-128 128H192A128 128 0 0 1 64 832V384a128 128 0 0 1 128-128v64a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64h64z"></path><path fill="currentColor" d="M384 128a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64V192a64 64 0 0 0-64-64H384zm0-64h448a128 128 0 0 1 128 128v448a128 128 0 0 1-128 128H384a128 128 0 0 1-128-128V192A128 128 0 0 1 384 64z"></path></svg>
                </button>
            `;
            actionsDiv.style.opacity = '1';
        }
        
        // Animación de finalización
        if (bubble) {
            bubble.style.transition = 'border-color 0.3s ease';
            bubble.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            setTimeout(() => {
                if (bubble) bubble.style.borderColor = '';
            }, 300);
        }
    }
    
    setTimeout(() => {
        currentStreamingMessage = '';
    }, 100);
}

// ===== FUNCIONES DE TYPING INDICATOR =====

/**
 * Muestra el indicador de "escribiendo"
 */
function showTypingIndicator() {
    isTyping = true;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message-ia typing-indicator-container';
    typingDiv.id = 'typingIndicator';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'bubble bot-bubble typing-bubble';
    bubbleDiv.innerHTML = `
        <div class="typing-animation">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
        <span class="typing-text">typing</span>
    `;
    
    typingDiv.appendChild(bubbleDiv);
    messagesDynamic.appendChild(typingDiv);
    scrollToBottom();
    
    let step = 0;
    typingAnimationInterval = setInterval(() => {
        const textElement = document.querySelector('.typing-text');
        if (textElement) {
            const dots = '.'.repeat((step % 3) + 1);
            textElement.textContent = `typing ${dots}`;
            step++;
        }
    }, 500);
}

/**
 * Oculta el indicador de "escribiendo"
 */
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        clearInterval(typingAnimationInterval);
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateY(10px)';
        setTimeout(() => {
            if (indicator && indicator.parentNode) indicator.remove();
        }, 300);
    }
    isTyping = false;
}

// ===== FUNCIONES DE UTILIDAD =====

/**
 * Copia el contenido de un mensaje al portapapeles
 * @param {HTMLElement} button - Botón que disparó la acción
 */
window.copyMessage = function(button) {
    const messageDiv = button.closest('.message-ia, .message-user');
    const bubble = messageDiv.querySelector('.bubble');
    const text = bubble.textContent || bubble.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        const originalIcon = button.innerHTML;
        button.innerHTML = '<span class="material-symbols-outlined" translate="no">check</span>';
        setTimeout(() => {
            button.innerHTML = originalIcon;
        }, 2000);
    }).catch(() => {
        // Fallback silencioso
    });
};

/**
 * Copia un bloque de código al portapapeles
 * @param {HTMLElement} button - Botón que disparó la acción
 */
window.copyCodeBlock = function(button) {
    const wrapper = button.closest('.code-block-wrapper');
    const codeElement = wrapper.querySelector('code');
    const code = codeElement.textContent || codeElement.innerText;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalIcon = button.innerHTML;
        button.innerHTML = '<span class="material-symbols-outlined" translate="no">check</span>';
        setTimeout(() => {
            button.innerHTML = originalIcon;
        }, 2000);
    }).catch(() => {
        alert('No se pudo copiar el código automáticamente. Selecciona y copia manualmente.');
    });
};

/**
 * Desplaza el contenedor de mensajes al final
 */
function scrollToBottom() {
    messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: 'smooth'
    });
}

/**
 * Ajusta la altura del textarea según su contenido
 */
function adjustTextareaHeight() {
    chatTextarea.style.height = 'auto';
    const newHeight = Math.min(chatTextarea.scrollHeight, 200);
    chatTextarea.style.height = newHeight + 'px';
}

/**
 * Limpia y resetea el textarea
 */
function resetTextarea() {
    chatTextarea.value = '';
    chatTextarea.style.height = '35px';
    updateSendButtonState();
}

/**
 * Configura el comportamiento de Enter en el textarea
 * @param {boolean} value - true = Enter envía, false = Enter nueva línea
 */
function setEnterToSend(value) {
    enterToSend = value;
}

// ===== CONTROL DE WELCOME CHAT =====
const welcomeContainer = document.querySelector('.welcome-chat');

/**
 * Oculta el mensaje de bienvenida
 */
function hideWelcomeChat() {
    if (welcomeContainer && welcomeContainer.style.display !== 'none') {
        welcomeContainer.style.display = 'none';
    }
}

/**
 * Muestra el mensaje de bienvenida
 */
function showWelcomeChat() {
    if (welcomeContainer && welcomeContainer.style.display !== 'flex') {
        welcomeContainer.style.display = 'flex';
    }
}

/**
 * Verifica si debe mostrar u ocultar el welcome al cargar
 */
function checkWelcomeChatOnLoad() {
    if (!welcomeContainer) return;
    
    if (messagesDynamic && messagesDynamic.children.length > 0) {
        hideWelcomeChat();
    } else {
        showWelcomeChat();
    }
}

// ===== INICIALIZACIÓN DE UI =====

/**
 * Inicializa todos los componentes de la interfaz
 */
function initUI() {
    chatTextarea.addEventListener('input', adjustTextareaHeight);
    chatTextarea.addEventListener('focus', () => {
        messageArea.classList.add('sticky');
    });
    
    initSendButtonControl();
    
    // Comportamiento de Enter
    chatTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            if (isMobile) {
                // En móviles: Enter siempre salta línea
                return;
            }
            
            // En desktop: según configuración
            if (enterToSend && !e.shiftKey) {
                e.preventDefault();
                sendBtn.click();
            } else if (!enterToSend && e.shiftKey) {
                e.preventDefault();
                sendBtn.click();
            }
        }
    });
}

// ===== CONTROL DEL BOTÓN ENVIAR =====

/**
 * Actualiza el estado visual del botón de enviar según el contenido del textarea
 * - Si hay texto: añade clase 'send-btn-active'
 * - Si está vacío: remueve la clase
 */
function updateSendButtonState() {
    const sendBtn = document.getElementById('sendBtn');
    const textarea = document.getElementById('chatTextarea');
    
    if (!sendBtn || !textarea) return;
    
    const hasText = textarea.value.trim().length > 0;
    
    if (hasText) {
        sendBtn.classList.add('send-btn-active');
    } else {
        sendBtn.classList.remove('send-btn-active');
    }
}

/**
 * Configura los event listeners para el control del botón de enviar
 */
function initSendButtonControl() {
    const textarea = document.getElementById('chatTextarea');
    
    if (!textarea) return;
    
    // Escuchar eventos de entrada de texto
    textarea.addEventListener('input', updateSendButtonState);
    
    // También al pegar texto
    textarea.addEventListener('paste', () => {
        // Pequeño delay para que el valor se actualice
        setTimeout(updateSendButtonState, 10);
    });
    
    // Al cortar texto
    textarea.addEventListener('cut', () => {
        setTimeout(updateSendButtonState, 10);
    });
    
    // Estado inicial
    updateSendButtonState();
}

// Función para llenar el textarea desde los chips
window.fillChat = function(text) {
    const textarea = document.getElementById('chatTextarea');
    if (textarea) {
        textarea.value = text;
        textarea.focus();
        // Disparar el ajuste de altura y el estado del botón enviar
        if (typeof adjustTextareaHeight === 'function') adjustTextareaHeight();
        if (typeof updateSendButtonState === 'function') updateSendButtonState();
    }
};

// Función para actualizar el nombre en el saludo
function updateWelcomeGreeting() {
    const greetingEl = document.getElementById('welcome-user-greeting');
    if (greetingEl) {
        const userName = localStorage.getItem('pera_user_name') || 'Zenicero';
        greetingEl.textContent = `Bienvenido, ${userName}.`;
    }
}

// Llamar al cargar la página
document.addEventListener('DOMContentLoaded', updateWelcomeGreeting);


// ===== EXPORTACIONES GLOBALES =====
window.copyMessage = window.copyMessage;
window.copyCodeBlock = window.copyCodeBlock;
window.createUserBubble = createUserBubble;
window.createBotBubble = createBotBubble;
window.updateStreamingMessage = updateStreamingMessage;
window.finalizeStreamingMessage = finalizeStreamingMessage;
window.showTypingIndicator = showTypingIndicator;
window.hideTypingIndicator = hideTypingIndicator;
window.scrollToBottom = scrollToBottom;
window.resetTextarea = resetTextarea;
window.initUI = initUI;
window.setEnterToSend = setEnterToSend;
window.hideWelcomeChat = hideWelcomeChat;
window.showWelcomeChat = showWelcomeChat;
window.checkWelcomeChatOnLoad = checkWelcomeChatOnLoad;
window.updateWelcomeGreeting = updateWelcomeGreeting;