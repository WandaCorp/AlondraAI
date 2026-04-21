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
                    <svg width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" data-iconid="433390" data-svgname="Copy o">
                      <g fill="none" fill-rule="evenodd">
                      <path d="m0 0h32v32h-32z"></path>
                      <path d="m27 0c2.7614237 0 5 2.23857625 5 5v14c0 2.7614237-2.2385763 5-5 5h-3v3.3333333c0 2.5057364-1.9748757 4.5502158-4.4530532 4.6618646l-.2136135.0048021h-14.66666663c-2.50573637 0-4.55021581-1.9748757-4.66186456-4.4530532l-.00480211-.2136135v-14.6666666c0-2.5057364 1.97487565-4.55021584 4.4530532-4.66186459l.21361347-.00480211h3.33333333v-3c0-2.76142375 2.2385763-5 5-5zm-19 10h-3.33333333c-1.41611475 0-2.57441514 1.1038344-2.66142033 2.4980225l-.00524634.1686442v14.6666666c0 1.4161148 1.10383444 2.5744152 2.49802247 2.6614204l.1686442.0052463h14.66666663c1.4161148 0 2.5744152-1.1038344 2.6614204-2.4980225l.0052463-.1686442v-3.3333333h-9c-2.7614237 0-5-2.2385763-5-5zm19-8h-14c-1.5976809 0-2.9036609 1.24891996-2.9949073 2.82372721l-.0050927.17627279v14c0 1.5976809 1.24892 2.9036609 2.8237272 2.9949073l.1762728.0050927h14c1.5976809 0 2.9036609-1.24892 2.9949073-2.8237272l.0050927-.1762728v-14c0-1.59768088-1.24892-2.90366088-2.8237272-2.99490731z" fill="currentColor" fill-rule="nonzero"></path></g>
                    </svg>
                </button>
            </div>
            <pre><code class="hljs language-${validLang}">${highlighted}</code></pre>
        </div>
    `;
};

marked.setOptions({
    renderer: renderer,
    breaks: true,
    gfm: true,
    highlight: function(code, lang) {
        // 1. Verifica si se especificó un lenguaje y si highlight.js lo soporta
        if (lang && hljs.getLanguage(lang)) {
            try {
                // 2. Si sí, úsalo para resaltar el código específicamente
                return hljs.highlight(code, { language: lang }).value;
            } catch (error) {
                console.warn(`Error resaltando el lenguaje "${lang}":`, error);
            }
        }
        // 3. Si no hay lenguaje o hubo un error, recurre a la detección automática
        //    Este es tu "plan de respaldo".
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
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-iconid="446994" data-svgname="Copy"><path clip-rule="evenodd" d="m13.8 2.25h-.0321c-.8128-.00001-1.4685-.00001-1.9994.04336-.5466.04467-1.0267.13902-1.471.36537-.70557.35952-1.27925.9332-1.63877 1.63881-.22634.44421-.3207.92435-.36537 1.47099-.04337.53091-.04337 1.18651-.04336 1.99934v.00002.03211.45h-.45-.0321-.00003c-.81283-.00001-1.46843-.00001-1.99934.04336-.54663.04467-1.02678.13902-1.47099.36537-.70561.35952-1.27929.9332-1.63881 1.63877-.22634.4443-.3207.9244-.36537 1.471-.04337.5309-.04337 1.1866-.04336 1.9994v.0321 2.4.0321c-.00001.8128-.00001 1.4685.04336 1.9994.04467.5466.13903 1.0267.36537 1.471.35952.7056.9332 1.2792 1.63881 1.6388.44421.2263.92436.3207 1.47099.3653.53091.0434 1.18652.0434 1.99935.0434h.03212 2.4.0321c.8129 0 1.4685 0 1.9994-.0434.5466-.0446 1.0267-.139 1.471-.3653.7056-.3596 1.2792-.9332 1.6388-1.6388.2263-.4443.3207-.9244.3653-1.471.0434-.5309.0434-1.1865.0434-1.9994v-.0321-.45h.45.0321c.8129 0 1.4685 0 1.9994-.0434.5466-.0446 1.0267-.139 1.471-.3653.7056-.3596 1.2793-.9332 1.6388-1.6388.2263-.4443.3207-.9244.3653-1.471.0434-.5309.0434-1.1865.0434-1.9994v-.0321-2.4-.03212c0-.81283 0-1.46844-.0434-1.99935-.0446-.54664-.139-1.02678-.3653-1.47099-.3595-.70561-.9332-1.27929-1.6388-1.63881-.4443-.22635-.9244-.3207-1.471-.36537-.5309-.04337-1.1865-.04337-1.9994-.04336h-.0321zm1.95 12h.45c.8525 0 1.4467-.0006 1.9093-.0384.4539-.0371.7147-.1062.9122-.2068.4233-.2158.7675-.56.9833-.9833.1006-.1975.1697-.4583.2068-.9122.0378-.4626.0384-1.0568.0384-1.9093v-2.4c0-.85245-.0006-1.44669-.0384-1.90932-.0371-.45388-.1062-.71464-.2068-.91216-.2158-.42336-.56-.76757-.9833-.98328-.1975-.10064-.4583-.16978-.9122-.20686-.4626-.0378-1.0568-.03838-1.9093-.03838h-2.4c-.8525 0-1.4467.00058-1.9093.03838-.4539.03708-.7147.10622-.9122.20686-.4233.21571-.7675.55992-.98326.98328-.10064.19752-.16977.45828-.20686.91216-.0378.46263-.03838 1.05687-.03838 1.90932v.45h.45.0321c.8129-.00001 1.4685-.00001 1.9994.04336.5466.04467 1.0267.13902 1.471.36537.7056.35952 1.2792.9332 1.6388 1.63877.2263.4443.3207.9244.3653 1.471.0434.5309.0434 1.1865.0434 1.9994v.0321zm-10.77148-4.25476c.19752-.10064.45829-.16978.91216-.20686.46263-.0378 1.05687-.03838 1.90932-.03838h2.4c.8525 0 1.4467.00058 1.9093.03838.4539.03708.7147.10622.9122.20686.4233.21576.7675.55996.9833.98326.1006.1975.1697.4583.2068.9122.0378.4626.0384 1.0568.0384 1.9093v2.4c0 .8525-.0006 1.4467-.0384 1.9093-.0371.4539-.1062.7147-.2068.9122-.2158.4233-.56.7675-.9833.9833-.1975.1006-.4583.1697-.9122.2068-.4626.0378-1.0568.0384-1.9093.0384h-2.4c-.85245 0-1.44669-.0006-1.90932-.0384-.45387-.0371-.71464-.1062-.91216-.2068-.42336-.2158-.76757-.56-.98328-.9833-.10064-.1975-.16977-.4583-.20686-.9122-.0378-.4626-.03838-1.0568-.03838-1.9093v-2.4c0-.8525.00058-1.4467.03838-1.9093.03709-.4539.10622-.7147.20686-.9122.21571-.4233.55992-.7675.98328-.98326z" fill="currentColor" fill-rule="evenodd"></path></svg>
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
    if (message) {
    const htmlContent = marked.parse(message);
    bubbleDiv.innerHTML = htmlContent;
    // Renderizar matemáticas
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
}
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    actionsDiv.innerHTML = `
        <button class="action-btn copy-btn" aria-label="Copiar mensaje" onclick="window.copyMessage(this)">
           <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-iconid="446994" data-svgname="Copy"><path clip-rule="evenodd" d="m13.8 2.25h-.0321c-.8128-.00001-1.4685-.00001-1.9994.04336-.5466.04467-1.0267.13902-1.471.36537-.70557.35952-1.27925.9332-1.63877 1.63881-.22634.44421-.3207.92435-.36537 1.47099-.04337.53091-.04337 1.18651-.04336 1.99934v.00002.03211.45h-.45-.0321-.00003c-.81283-.00001-1.46843-.00001-1.99934.04336-.54663.04467-1.02678.13902-1.47099.36537-.70561.35952-1.27929.9332-1.63881 1.63877-.22634.4443-.3207.9244-.36537 1.471-.04337.5309-.04337 1.1866-.04336 1.9994v.0321 2.4.0321c-.00001.8128-.00001 1.4685.04336 1.9994.04467.5466.13903 1.0267.36537 1.471.35952.7056.9332 1.2792 1.63881 1.6388.44421.2263.92436.3207 1.47099.3653.53091.0434 1.18652.0434 1.99935.0434h.03212 2.4.0321c.8129 0 1.4685 0 1.9994-.0434.5466-.0446 1.0267-.139 1.471-.3653.7056-.3596 1.2792-.9332 1.6388-1.6388.2263-.4443.3207-.9244.3653-1.471.0434-.5309.0434-1.1865.0434-1.9994v-.0321-.45h.45.0321c.8129 0 1.4685 0 1.9994-.0434.5466-.0446 1.0267-.139 1.471-.3653.7056-.3596 1.2793-.9332 1.6388-1.6388.2263-.4443.3207-.9244.3653-1.471.0434-.5309.0434-1.1865.0434-1.9994v-.0321-2.4-.03212c0-.81283 0-1.46844-.0434-1.99935-.0446-.54664-.139-1.02678-.3653-1.47099-.3595-.70561-.9332-1.27929-1.6388-1.63881-.4443-.22635-.9244-.3207-1.471-.36537-.5309-.04337-1.1865-.04337-1.9994-.04336h-.0321zm1.95 12h.45c.8525 0 1.4467-.0006 1.9093-.0384.4539-.0371.7147-.1062.9122-.2068.4233-.2158.7675-.56.9833-.9833.1006-.1975.1697-.4583.2068-.9122.0378-.4626.0384-1.0568.0384-1.9093v-2.4c0-.85245-.0006-1.44669-.0384-1.90932-.0371-.45388-.1062-.71464-.2068-.91216-.2158-.42336-.56-.76757-.9833-.98328-.1975-.10064-.4583-.16978-.9122-.20686-.4626-.0378-1.0568-.03838-1.9093-.03838h-2.4c-.8525 0-1.4467.00058-1.9093.03838-.4539.03708-.7147.10622-.9122.20686-.4233.21571-.7675.55992-.98326.98328-.10064.19752-.16977.45828-.20686.91216-.0378.46263-.03838 1.05687-.03838 1.90932v.45h.45.0321c.8129-.00001 1.4685-.00001 1.9994.04336.5466.04467 1.0267.13902 1.471.36537.7056.35952 1.2792.9332 1.6388 1.63877.2263.4443.3207.9244.3653 1.471.0434.5309.0434 1.1865.0434 1.9994v.0321zm-10.77148-4.25476c.19752-.10064.45829-.16978.91216-.20686.46263-.0378 1.05687-.03838 1.90932-.03838h2.4c.8525 0 1.4467.00058 1.9093.03838.4539.03708.7147.10622.9122.20686.4233.21576.7675.55996.9833.98326.1006.1975.1697.4583.2068.9122.0378.4626.0384 1.0568.0384 1.9093v2.4c0 .8525-.0006 1.4467-.0384 1.9093-.0371.4539-.1062.7147-.2068.9122-.2158.4233-.56.7675-.9833.9833-.1975.1006-.4583.1697-.9122.2068-.4626.0378-1.0568.0384-1.9093.0384h-2.4c-.85245 0-1.44669-.0006-1.90932-.0384-.45387-.0371-.71464-.1062-.91216-.2068-.42336-.2158-.76757-.56-.98328-.9833-.10064-.1975-.16977-.4583-.20686-.9122-.0378-.4626-.03838-1.0568-.03838-1.9093v-2.4c0-.8525.00058-1.4467.03838-1.9093.03709-.4539.10622-.7147.20686-.9122.21571-.4233.55992-.7675.98328-.98326z" fill="currentColor" fill-rule="evenodd"></path></svg>
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
            const htmlContent = marked.parse(currentStreamingMessage);
            bubble.innerHTML = htmlContent;
            
            // Envolver fórmulas largas en un contenedor con scroll
            const displays = bubble.querySelectorAll('.katex-display');
              displays.forEach(display => {
               if (display.scrollWidth > display.clientWidth) {
               display.style.overflowX = 'auto';
              }
            });
            
            // Renderizar matemáticas después de actualizar el DOM
            setTimeout(() => {
                if (typeof renderMathInElement !== 'undefined') {
                    renderMathInElement(bubble, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\(', right: '\\)', display: false},
                            {left: '\\[', right: '\\]', display: true}
                        ]
                    });
                }
            }, 10);
        }
        
        const actionsDiv = streamingMsg.querySelector('.message-actions');
        if (actionsDiv) {
            actionsDiv.innerHTML = `
                <button class="action-btn copy-btn" aria-label="Copiar mensaje" onclick="window.copyMessage(this)">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-iconid="446994" data-svgname="Copy"><path clip-rule="evenodd" d="m13.8 2.25h-.0321c-.8128-.00001-1.4685-.00001-1.9994.04336-.5466.04467-1.0267.13902-1.471.36537-.70557.35952-1.27925.9332-1.63877 1.63881-.22634.44421-.3207.92435-.36537 1.47099-.04337.53091-.04337 1.18651-.04336 1.99934v.00002.03211.45h-.45-.0321-.00003c-.81283-.00001-1.46843-.00001-1.99934.04336-.54663.04467-1.02678.13902-1.47099.36537-.70561.35952-1.27929.9332-1.63881 1.63877-.22634.4443-.3207.9244-.36537 1.471-.04337.5309-.04337 1.1866-.04336 1.9994v.0321 2.4.0321c-.00001.8128-.00001 1.4685.04336 1.9994.04467.5466.13903 1.0267.36537 1.471.35952.7056.9332 1.2792 1.63881 1.6388.44421.2263.92436.3207 1.47099.3653.53091.0434 1.18652.0434 1.99935.0434h.03212 2.4.0321c.8129 0 1.4685 0 1.9994-.0434.5466-.0446 1.0267-.139 1.471-.3653.7056-.3596 1.2792-.9332 1.6388-1.6388.2263-.4443.3207-.9244.3653-1.471.0434-.5309.0434-1.1865.0434-1.9994v-.0321-.45h.45.0321c.8129 0 1.4685 0 1.9994-.0434.5466-.0446 1.0267-.139 1.471-.3653.7056-.3596 1.2793-.9332 1.6388-1.6388.2263-.4443.3207-.9244.3653-1.471.0434-.5309.0434-1.1865.0434-1.9994v-.0321-2.4-.03212c0-.81283 0-1.46844-.0434-1.99935-.0446-.54664-.139-1.02678-.3653-1.47099-.3595-.70561-.9332-1.27929-1.6388-1.63881-.4443-.22635-.9244-.3207-1.471-.36537-.5309-.04337-1.1865-.04337-1.9994-.04336h-.0321zm1.95 12h.45c.8525 0 1.4467-.0006 1.9093-.0384.4539-.0371.7147-.1062.9122-.2068.4233-.2158.7675-.56.9833-.9833.1006-.1975.1697-.4583.2068-.9122.0378-.4626.0384-1.0568.0384-1.9093v-2.4c0-.85245-.0006-1.44669-.0384-1.90932-.0371-.45388-.1062-.71464-.2068-.91216-.2158-.42336-.56-.76757-.9833-.98328-.1975-.10064-.4583-.16978-.9122-.20686-.4626-.0378-1.0568-.03838-1.9093-.03838h-2.4c-.8525 0-1.4467.00058-1.9093.03838-.4539.03708-.7147.10622-.9122.20686-.4233.21571-.7675.55992-.98326.98328-.10064.19752-.16977.45828-.20686.91216-.0378.46263-.03838 1.05687-.03838 1.90932v.45h.45.0321c.8129-.00001 1.4685-.00001 1.9994.04336.5466.04467 1.0267.13902 1.471.36537.7056.35952 1.2792.9332 1.6388 1.63877.2263.4443.3207.9244.3653 1.471.0434.5309.0434 1.1865.0434 1.9994v.0321zm-10.77148-4.25476c.19752-.10064.45829-.16978.91216-.20686.46263-.0378 1.05687-.03838 1.90932-.03838h2.4c.8525 0 1.4467.00058 1.9093.03838.4539.03708.7147.10622.9122.20686.4233.21576.7675.55996.9833.98326.1006.1975.1697.4583.2068.9122.0378.4626.0384 1.0568.0384 1.9093v2.4c0 .8525-.0006 1.4467-.0384 1.9093-.0371.4539-.1062.7147-.2068.9122-.2158.4233-.56.7675-.9833.9833-.1975.1006-.4583.1697-.9122.2068-.4626.0378-1.0568.0384-1.9093.0384h-2.4c-.85245 0-1.44669-.0006-1.90932-.0384-.45387-.0371-.71464-.1062-.91216-.2068-.42336-.2158-.76757-.56-.98328-.9833-.10064-.1975-.16977-.4583-.20686-.9122-.0378-.4626-.03838-1.0568-.03838-1.9093v-2.4c0-.8525.00058-1.4467.03838-1.9093.03709-.4539.10622-.7147.20686-.9122.21571-.4233.55992-.7675.98328-.98326z" fill="currentColor" fill-rule="evenodd"></path></svg>
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
        button.innerHTML = '<svg fill="currentColor" width="21" height="21" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" data-iconid="313685" data-svgname="Check solid"><path d="M 28.28125 6.28125 L 11 23.5625 L 3.71875 16.28125 L 2.28125 17.71875 L 10.28125 25.71875 L 11 26.40625 L 11.71875 25.71875 L 29.71875 7.71875 Z"></path></svg>';
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
        button.innerHTML = '<svg fill="currentColor" width="21" height="21" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" data-iconid="313685" data-svgname="Check solid"><path d="M 28.28125 6.28125 L 11 23.5625 L 3.71875 16.28125 L 2.28125 17.71875 L 10.28125 25.71875 L 11 26.40625 L 11.71875 25.71875 L 29.71875 7.71875 Z"></path></svg>';
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
        document.documentElement.style.setProperty('--bg-primary', '#0F0F0F');
    }
}

/**
 * Muestra el mensaje de bienvenida
 */
function showWelcomeChat() {
    if (welcomeContainer && welcomeContainer.style.display !== 'flex') {
        welcomeContainer.style.display = 'flex';
        document.documentElement.style.setProperty('--bg-primary', '#000000');
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
        const userName = localStorage.getItem('pera_user_name') || 'user0873837';
        greetingEl.textContent = `Bienvenido, ${userName}.`;
    }
}

// ===== RATE LIMIT NOTICE =====
/**
 * Crea la nota visual de rate limit (centrada, con botón Entendido)
 * Reemplaza cualquier nota anterior existente para evitar duplicados
 * @returns {HTMLElement} - Elemento DOM de la nota
 */
function createRateLimitNotice() {
    // Eliminar nota existente si hay
    const existingNotice = document.getElementById('rateLimitNotice');
    if (existingNotice) {
        existingNotice.remove();
    }
    
    const noticeDiv = document.createElement('div');
    noticeDiv.className = 'message-ia rate-limit-notice';
    noticeDiv.id = 'rateLimitNotice';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'bubble bot-bubble rate-limit-bubble';
  
    bubbleDiv.innerHTML = `
        <h4>
        <svg fill="currentColor" width="20" height="20" viewBox="0 0 32 32" id="Outlined" xmlns="http://www.w3.org/2000/svg" data-iconid="418569" data-svgname="Outlined warning alert">
           <title></title>
            <g id="Fill">
             <path d="M29.68,25.6l-11-21.92a3,3,0,0,0-5.44,0L2.32,25.6A3,3,0,0,0,5,30H27a3,3,0,0,0,2.72-4.4Zm-1.84,1.91A1,1,0,0,1,27,28H5a1,1,0,0,1-.88-.49,1,1,0,0,1,0-1l11-21.93h0a1,1,0,0,1,1.86,0l11,21.93A1,1,0,0,1,27.84,27.51Z"></path>
             <rect height="9" width="2" x="15" y="11"></rect>
             <circle cx="16" cy="24" r="2"></circle>
            </g>
        </svg>
        Alta demanda
        </h4>
        <p style="margin: 0; line-height: 1.5;">
            Alondra está presentando un uso intensivo en estos momentos. Por favor inténtelo nuevamente más tarde.
        </p>
        <button class="rate-limit-acknowledge-btn">
            ¡De acuerdo!
        </button>
    `;
    
    noticeDiv.appendChild(bubbleDiv);
    
    // Evento del botón Entendido
    const acknowledgeBtn = bubbleDiv.querySelector('.rate-limit-acknowledge-btn');
    if (acknowledgeBtn) {
        acknowledgeBtn.addEventListener('click', () => {
            // Limpiar UI como handleNewChat() pero SIN resetear contador
            if (typeof window.clearContext === 'function') {
                window.clearContext();
            }
            
            const messagesDynamic = document.getElementById('messagesDynamic');
            if (messagesDynamic) {
                messagesDynamic.innerHTML = '';
            }
            
            if (typeof window.showWelcomeChat === 'function') {
                window.showWelcomeChat();
            }
            
            const thinkBtn = document.getElementById('thinkBtn');
            const searchBtn = document.getElementById('searchBtn');
            if (thinkBtn) thinkBtn.classList.remove('active');
            if (searchBtn) searchBtn.classList.remove('active');
            
            const chatTextarea = document.getElementById('chatTextarea');
            if (chatTextarea && !chatTextarea.matches(':focus')) {
                const messageArea = document.getElementById('messageArea');
                if (messageArea) messageArea.classList.remove('sticky');
            }
            
            // Eliminar la nota
            noticeDiv.remove();
        });
    }
    
    return noticeDiv;
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
window.createRateLimitNotice = createRateLimitNotice;