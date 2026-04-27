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
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-iconid="446994" data-svgname="Copy"><path clip-rule="evenodd" d="m13.8 2.25h-.0321c-.8128-.00001-1.4685-.00001-1.9994.04336-.5466.04467-1.0267.13902-1.471.36537-.70557.35952-1.27925.9332-1.63877 1.63881-.22634.44421-.3207.92435-.36537 1.47099-.04337.53091-.04337 1.18651-.04336 1.99934v.00002.03211.45h-.45-.0321-.00003c-.81283-.00001-1.46843-.00001-1.99934.04336-.54663.04467-1.02678.13902-1.47099.36537-.70561.35952-1.27929.9332-1.63881 1.63877-.22634.4443-.3207.9244-.36537 1.471-.04337.5309-.04337 1.1866-.04336 1.9994v.0321 2.4.0321c-.00001.8128-.00001 1.4685.04336 1.9994.04467.5466.13903 1.0267.36537 1.471.35952.7056.9332 1.2792 1.63881 1.6388.44421.2263.92436.3207 1.47099.3653.53091.0434 1.18652.0434 1.99935.0434h.03212 2.4.0321c.8129 0 1.4685 0 1.9994-.0434.5466-.0446 1.0267-.139 1.471-.3653.7056-.3596 1.2792-.9332 1.6388-1.6388.2263-.4443.3207-.9244.3653-1.471.0434-.5309.0434-1.1865.0434-1.9994v-.0321-.45h.45.0321c.8129 0 1.4685 0 1.9994-.0434.5466-.0446 1.0267-.139 1.471-.3653.7056-.3596 1.2793-.9332 1.6388-1.6388.2263-.4443.3207-.9244.3653-1.471.0434-.5309.0434-1.1865.0434-1.9994v-.0321-2.4-.03212c0-.81283 0-1.46844-.0434-1.99935-.0446-.54664-.139-1.02678-.3653-1.47099-.3595-.70561-.9332-1.27929-1.6388-1.63881-.4443-.22635-.9244-.3207-1.471-.36537-.5309-.04337-1.1865-.04337-1.9994-.04336h-.0321zm1.95 12h.45c.8525 0 1.4467-.0006 1.9093-.0384.4539-.0371.7147-.1062.9122-.2068.4233-.2158.7675-.56.9833-.9833.1006-.1975.1697-.4583.2068-.9122.0378-.4626.0384-1.0568.0384-1.9093v-2.4c0-.85245-.0006-1.44669-.0384-1.90932-.0371-.45388-.1062-.71464-.2068-.91216-.2158-.42336-.56-.76757-.9833-.98328-.1975-.10064-.4583-.16978-.9122-.20686-.4626-.0378-1.0568-.03838-1.9093-.03838h-2.4c-.8525 0-1.4467.00058-1.9093.03838-.4539.03708-.7147.10622-.9122.20686-.4233.21571-.7675.55992-.98326.98328-.10064.19752-.16977.45828-.20686.91216-.0378.46263-.03838 1.05687-.03838 1.90932v.45h.45.0321c.8129-.00001 1.4685-.00001 1.9994.04336.5466.04467 1.0267.13902 1.471.36537.7056.35952 1.2792.9332 1.6388 1.63877.2263.4443.3207.9244.3653 1.471.0434.5309.0434 1.1865.0434 1.9994v.0321zm-10.77148-4.25476c.19752-.10064.45829-.16978.91216-.20686.46263-.0378 1.05687-.03838 1.90932-.03838h2.4c.8525 0 1.4467.00058 1.9093.03838.4539.03708.7147.10622.9122.20686.4233.21576.7675.55996.9833.98326.1006.1975.1697.4583.2068.9122.0378.4626.0384 1.0568.0384 1.9093v2.4c0 .8525-.0006 1.4467-.0384 1.9093-.0371.4539-.1062.7147-.2068.9122-.2158.4233-.56.7675-.9833.9833-.1975.1006-.4583.1697-.9122.2068-.4626.0378-1.0568.0384-1.9093.0384h-2.4c-.85245 0-1.44669-.0006-1.90932-.0384-.45387-.0371-.71464-.1062-.91216-.2068-.42336-.2158-.76757-.56-.98328-.9833-.10064-.1975-.16977-.4583-.20686-.9122-.0378-.4626-.03838-1.0568-.03838-1.9093v-2.4c0-.8525.00058-1.4467.03838-1.9093.03709-.4539.10622-.7147.20686-.9122.21571-.4233.55992-.7675.98328-.98326z" fill="currentColor" fill-rule="evenodd"></path></svg>
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
        const userName = localStorage.getItem('pera_user_name') || 'User';
        greetingEl.textContent = `Hola, ${userName}.`;
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
        Cuota superada
        </h4>
        <p style="margin: 0; line-height: 1.5;">
            Haz superado tu cuota de 5 mensajes por hora. Se reestablecera en 1 hora.
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
            updateChatTheme('Nuevo Chat');
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