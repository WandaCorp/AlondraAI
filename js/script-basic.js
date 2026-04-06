/**
 * ============================================
 * SCRIPT-BASIC.JS
 * Orquestación principal, eventos y lógica del chat
 * ============================================
 */

// ===== VARIABLES GLOBALES =====
let editingMessage = null;  // Mensaje en edición

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
    const communityBtn = document.getElementById('communityBtn');

    sendBtn.addEventListener('click', handleSendMessage);
    thinkBtn.addEventListener('click', () => handleModelToggle('think', thinkBtn));
    searchBtn.addEventListener('click', () => handleModelToggle('search', searchBtn));
    
    newChatBtns.forEach(btn => btn.addEventListener('click', handleNewChat));
    settingsBtns.forEach(btn => btn.addEventListener('click', openSettingsModal));
    
    if (communityBtn) {
        communityBtn.addEventListener('click', () => {
            window.open('https://chat.whatsapp.com/FmTPOf2J4ICKSqez5U12Zi?mode=gi_t', '_blank');
        });
    }
    
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
        const savedName = localStorage.getItem('pera_user_name') || 'Zenicero';
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
                if (!name) name = 'Zenicero';
                
                if (typeof window.setUserName === 'function') {
                    window.setUserName(name);
                }
                
                // ✅ ACTUALIZAR EL SALUDO INMEDIATAMENTE
                if (typeof window.updateWelcomeGreeting === 'function') {
                    window.updateWelcomeGreeting();
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
    
    const userName = localStorage.getItem('pera_user_name') || 'Zenicero';
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
        sarcastica: 'Sarcástica', humana: 'Humana'
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
        '#0A84FF': 'Predeterminado',
        '#2C2C2E': 'Gris',
        '#00c230': 'Verde',
        '#ffd60a': 'Amarillo',
        '#2b001d': 'Rosa',
        '#af6a00': 'Naranja'
    };
    
    const savedColor = localStorage.getItem('pera_accent_color') || '#0A84FF';
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
    const userName = localStorage.getItem('pera_user_name') || 'Zenicero';
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
 * Maneja el envío de un mensaje
 */
async function handleSendMessage() {
    const message = chatTextarea.value.trim();
    if (!message || isTyping) return;
    
    if (editingMessage) {
        await handleEditMessage(message);
        return;
    }
    
    if (typeof window.hideWelcomeChat === 'function') {
        window.hideWelcomeChat();
    }
    
    messageArea.classList.add('sticky');
    
    const userBubble = createUserBubble(message);
    messagesDynamic.appendChild(userBubble);
    resetTextarea();
    scrollToBottom();
    
    const messagesWithContext = formatMessages(message);
    currentStreamingMessage = '';
    
    showTypingIndicator();
    
    try {
        await callPollinationsAPI(messagesWithContext, (chunk) => {
            updateStreamingMessage(chunk);
        });
        
        hideTypingIndicator();
        finalizeStreamingMessage();
        
        if (typeof window.marcarSaludoComoHecho === 'function' && localStorage.getItem('pera_user_name')) {
            window.marcarSaludoComoHecho();
        }
        
        addToContext({ role: 'assistant', content: currentStreamingMessage });
        scrollToBottom();
        
    } catch (error) {
        hideTypingIndicator();
        
        const errorBubble = createBotBubble(`❌ Error: ${error.message}`);
        messagesDynamic.appendChild(errorBubble);
        scrollToBottom();
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
 */
function handleNewChat() {
    if (typeof window.clearContext === 'function') {
        window.clearContext();
    }
    
    messagesDynamic.innerHTML = '';
    
    if (typeof window.setActiveModel === 'function') {
        window.setActiveModel('openai');
    }
    
    if (typeof window.showWelcomeChat === 'function') {
        window.showWelcomeChat();
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
window.editingMessage = editingMessage;