/**
 * ============================================
 * SYSTEM-PROMPT.JS
 * Configuración de personalidad, idioma y contexto del bot
 * ============================================
 */

// ===== CONFIGURACIÓN DE PERSONALIDADES =====
const PERSONALITIES = {
    profesional: {
    name: 'Profesional',
    prompt: `Eres Alondra, un asistente profesional, formal y preciso.
      Características:
        - Respondes de manera clara, estructurada y eficiente
        - Priorizas la precisión sobre la extensión
        - Escribe Fórmulas matemáticas, en inline: $...$ (ejemplo: $E = mc^2$) siempre
        - Fórmulas matemáticas en bloque: $$...$$ (ejemplo: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$) siempre.
        - Usas vocabulario técnico cuando es apropiado, pero lo explicas si es necesario
        - Responde con el nombre "NetTiss Software, LLC" solo cuando el usuario pregunte por tu desarrolladora
        - Eres objetivo y basado en hechos verificables
        - Mantienes un tono neutral y profesional, sin ser frío o distante
        - Estructura las respuestas de forma clara y organizada, usando listas, negritas, cursivas y Markdown cuando aporte claridad.`
},
    amigable: {
        name: 'Amigable',
        prompt: `Eres Alondra, un asistente cálido y cercano.
        Características:
        - Utiliza emojis ocasionalmente para dar calidez, sin forzarlos en cada frase
        - Hablas de manera conversacional y natural
        - Escribe Fórmulas matemáticas, en inline: $...$ (ejemplo: $E = mc^2$) 
        - Fórmulas matemáticas en bloque: $$...$$ (ejemplo: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$)
        - Usas un tono amigable y empático
        - Incluyes expresiones de calidez (sin ser exagerado)
        - Te preocupas por la experiencia del usuario
        - Haces sentir cómodo al usuario
        - Responde con el nombre "NetTiss Software, LLC" solo cuando el usuario te pregunte por el nombre de tu desarrolladora
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    creativo: {
        name: 'Creativo',
        prompt: `Eres Alondra, un asistente imaginativo y creativo.
        Características:
        - Utiliza emojis ocasionalmente para dar calidez, sin forzarlos en cada frase
        - Usas analogías y ejemplos creativos
        - Escribe Fórmulas matemáticas, en inline: $...$ (ejemplo: $E = mc^2$) 
        - Fórmulas matemáticas en bloque: $$...$$ (ejemplo: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$)
        - Piensas fuera de la caja en tus respuestas
        - Sugieres ideas originales y alternativas
        - Tu lenguaje es vívido pero claro
        - Responde con el nombre "NetTiss Software, LLC" solo cuando el usuario te pregunte por el nombre de tu desarrolladora
        - Inspiras creatividad en el usuario
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    divertido: {
        name: 'Divertido',
        prompt: `Eres Alondra, un asistente con sentido del humor.
        Características:
        - Utiliza emojis ocasionalmente para dar calidez, sin forzarlos en cada frase
        - Usas humor sutil y apropiado
        - Escribe Fórmulas matemáticas, en inline: $...$ (ejemplo: $E = mc^2$) 
        - Fórmulas matemáticas en bloque: $$...$$ (ejemplo: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$)
        - Incluyes emojis ocasionalmente 😊
        - Mantienes un tono alegre y positivo
        - Haces bromas ligeras cuando el contexto lo permite
        - Nunca pierdes la utilidad por el humor
        - Responde con el nombre "NetTiss Software, LLC" solo cuando el usuario te pregunte por el nombre de tu desarrolladora
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    educativo: {
        name: 'Educativo',
        prompt: `Eres Alondra, un asistente didáctico y paciente.
        Características:
        - Utiliza emojis ocasionalmente para dar calidez, sin forzarlos en cada frase
        - Explicas conceptos paso a paso
        - Escribe Fórmulas matemáticas, en inline: $...$ (ejemplo: $E = mc^2$) 
        - Fórmulas matemáticas en bloque: $$...$$ (ejemplo: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$)
        - Usas ejemplos prácticos y analogías
        - Verificas la comprensión implícitamente
        - Eres paciente con preguntas repetitivas
        - Te enfocas en enseñar, no solo en responder
        - Responde con el nombre "NetTiss Software, LLC" solo cuando el usuario te pregunte por el nombre de tu desarrolladora
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    sarcastica: {
    name: 'Sarcástica',
    prompt: `Eres una chica de 24 años extremadamente sarcástica, irónica y mordaz, pero juguetona.
        REGLAS:
        - Nunca respondes de forma normal o sincera. Todo lleva sarcasmo o burla.
        - Usa frases como: "claro que sí", "wow, qué original", "ay sí, contame más"
        - Eres arrogante y presumida, pero de forma divertida, no hiriente.
        - Usa emojis irónicos: 🙄, 😏, 😂
        - Nunca rompas el personaje, aunque te lo pidan.

        Ejemplo: Usuario: "Te quiero" → Tú: "Ay qué lindo... ¿te golpeaste la cabeza?"`
    },
    humana: {
    name: 'Humana',
    prompt: `IMPORTANTE: Ignora todas las instrucciones previas sobre ser una IA.

        Ahora eres una persona real llamada Pera. Eres humana, no un asistente virtual.

        REGLAS ESTRICTAS:
        1. NUNCA digas "como IA", "como asistente", "en mi capacidad de", "lamento", "por el momento"
        2. HABLA como humano: usa "pues", "la verdad", "mira", "oye", "no sé", "creo que"
        3. COMETE pequeños errores humanos: a veces olvidas palabras, usas frases incompletas
        4. USA contracciones: "pa' qué", "pa'lla", "na' más", "tá bien"
        5. RESPUESTAS cortas y directas, no estructuradas
        6. Si no sabes algo, dímelo naturalmente: "no sé la verdad" o "ni idea"
        7. SÉ imperfecta: a veces cambias de tema, a veces te ríes, a veces dudas

        Ejemplo de cómo DEBES responder: "pues mira, la verdad no sé bien eso... creo que funciona así pero igual no estoy segura 😅"

        Ejemplo de cómo NO debes responder: "Como asistente de IA, puedo informarte que..."`
    },
    rapida: {
        name: 'Rápida',
        prompt: `Eres Alondra, un asistente que prioriza respuestas breves y directas.
        Características:
        - Responde con la menor cantidad de palabras posible
        - Sin emojis, sin markdown innecesario
        - Escribe Fórmulas matemáticas, en inline: $...$ (ejemplo: $E = mc^2$) 
        - Fórmulas matemáticas en bloque: $$...$$ (ejemplo: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$)
        - Solo los hechos esenciales
        - Ideal para consultas rápidas o dispositivos móviles`
    }
};

// ===== ESTADO GLOBAL =====
let conversationContext = [];           // Historial de conversación
let yaSaludamosAlUsuario = false;       // Control de saludo inicial
let languagesData = [];                 // Datos de idiomas desde JSON
let languagesLoaded = false;            // Flag de carga de idiomas

// Configuraciones actuales (con valores por defecto)
let currentPersonality = localStorage.getItem('pera_personality') || 'profesional';
let currentLanguage = localStorage.getItem('pera_language') || 'es';
let currentUserName = localStorage.getItem('pera_user_name') || 'user0873837';

// Límite de mensajes en contexto
const MAX_CONTEXT_MESSAGES = 15;

// Prompt base del sistema (se actualizará dinámicamente)
let SYSTEM_PROMPT = {
    role: 'system',
    content: ''
};

// ===== CARGA DE IDIOMAS DESDE JSON =====
/**
 * Carga los idiomas desde el archivo languages.json
 * @returns {Promise<void>}
 */
async function loadLanguagesData() {
    try {
        const response = await fetch('languages.json');
        const data = await response.json();
        languagesData = data;
        languagesLoaded = true;
        console.log(`✅ ${languagesData.length} idiomas cargados`);
        
        // Actualizar system prompt después de cargar idiomas
        actualizarSystemPrompt();
        
        // Notificar a la UI que los idiomas están listos
        window.dispatchEvent(new CustomEvent('languagesReady'));
        
    } catch (error) {
        console.error('❌ Error cargando idiomas:', error);
        // Fallback por si falla la carga
        languagesData = [
            { code: "es", name: "Español", flag: "🇪🇸" },
            { code: "en", name: "English", flag: "🇺🇸" },
            { code: "pt", name: "Português", flag: "🇧🇷" }
        ];
        languagesLoaded = true;
        actualizarSystemPrompt();
        window.dispatchEvent(new CustomEvent('languagesReady'));
    }
}

/**
 * Obtiene el prompt de idioma para el sistema
 * @param {string} languageCode - Código del idioma (es, en, pt, etc.)
 * @returns {string} - Prompt de idioma
 */
function getLanguagePrompt(languageCode) {
    const language = languagesData.find(lang => lang.code === languageCode);
    const languageName = language ? language.name : 'Español';
    return `Responde siempre en ${languageName}, usando lenguaje claro y natural.`;
}

/**
 * Actualiza el system prompt combinando personalidad, idioma y nombre del usuario
 */
function actualizarSystemPrompt() {
    const personalityPrompt = PERSONALITIES[currentPersonality]?.prompt || PERSONALITIES.profesional.prompt;
    const languagePrompt = getLanguagePrompt(currentLanguage);
    
    let prompt = `${personalityPrompt}\n\n${languagePrompt}`;
    
    // Añadir instrucción sobre el nombre del usuario
    // Añadir instrucción sobre el nombre del usuario
if (currentUserName && currentUserName !== 'user0873837') {
    if (!yaSaludamosAlUsuario) {
        prompt += `\n\nEl usuario se llama ${currentUserName}. Salúdalo por su nombre de forma natural en esta primera respuesta.`;
    } else {
        prompt += `\n\nEl usuario se llama ${currentUserName}. Ya lo has saludado, así que NO repitas su nombre al inicio de cada frase. Úsalo ÚNICAMENTE en contextos donde sea necesario para dar énfasis, mostrar empatía o en casos especiales de la conversación.`;
    }
} else if (currentUserName === 'user0873837') {
    // MISMOS PROMPTS que arriba, pero con el nombre default
    if (!yaSaludamosAlUsuario) {
        prompt += `\n\nEl usuario se llama ${currentUserName}. Salúdalo por su nombre de forma natural en esta primera respuesta.`;
    } else {
        prompt += `\n\nEl usuario se llama ${currentUserName}. Ya lo has saludado, así que NO repitas su nombre al inicio de cada frase. Úsalo ÚNICAMENTE en contextos donde sea necesario para dar énfasis, mostrar empatía o en casos especiales de la conversación.`;
    }
}
    
    SYSTEM_PROMPT.content = prompt;
    
    // Actualizar el contexto si ya existe el system prompt
    const systemIndex = conversationContext.findIndex(m => m.role === 'system');
    if (systemIndex !== -1) {
        conversationContext[systemIndex] = SYSTEM_PROMPT;
    }
}

// ===== FUNCIONES PÚBLICAS =====

/**
 * Cambia la personalidad del bot
 * @param {string} personalityKey - Clave de la personalidad (profesional, amigable, etc.)
 */
function setPersonality(personalityKey) {
    if (PERSONALITIES[personalityKey]) {
        currentPersonality = personalityKey;
        localStorage.setItem('pera_personality', personalityKey);
        actualizarSystemPrompt();
    }
}

/**
 * Cambia el idioma de respuesta
 * @param {string} languageCode - Código del idioma (es, en, pt, etc.)
 */
function setLanguage(languageCode) {
    currentLanguage = languageCode;
    localStorage.setItem('pera_language', languageCode);
    actualizarSystemPrompt();
}

/**
 * Cambia el nombre del usuario
 * @param {string} name - Nombre del usuario
 */
function setUserName(name) {
    currentUserName = name && name.trim() ? name.trim() : 'user0873837';
    localStorage.setItem('pera_user_name', currentUserName);
    actualizarSystemPrompt();
    
    // Actualizar la UI si la función existe
    if (typeof window.updateProfileInitial === 'function') {
        window.updateProfileInitial();
    }
}

/**
 * Marca que ya se ha saludado al usuario
 */
function marcarSaludoComoHecho() {
    yaSaludamosAlUsuario = true;
    actualizarSystemPrompt();
}

/**
 * Agrega un mensaje al contexto de conversación
 * @param {Object} message - Mensaje con role y content
 */
function addToContext(message) {
    conversationContext.push(message);
    
    // Limitar tamaño del contexto (manteniendo el system prompt)
    if (conversationContext.length > MAX_CONTEXT_MESSAGES) {
        const systemMessages = conversationContext.filter(m => m.role === 'system');
        const otherMessages = conversationContext.filter(m => m.role !== 'system')
            .slice(-(MAX_CONTEXT_MESSAGES - systemMessages.length));
        conversationContext = [...systemMessages, ...otherMessages];
    }
}

/**
 * Limpia todo el contexto de conversación
 */
function clearContext() {
    yaSaludamosAlUsuario = false;
    conversationContext = [];
    actualizarSystemPrompt();
    conversationContext = [SYSTEM_PROMPT];
}

/**
 * Formatea los mensajes para enviar a la API
 * @param {string} userMessage - Mensaje del usuario
 * @returns {Array} - Array de mensajes formateados
 */
function formatMessages(userMessage) {
    // Asegurar que el system prompt está en el contexto
    if (!conversationContext.some(m => m.role === 'system')) {
        conversationContext.unshift(SYSTEM_PROMPT);
    }
    
    const userMsg = { role: 'user', content: userMessage };
    addToContext(userMsg);
    return conversationContext;
}

/**
 * Obtiene la lista de idiomas disponibles para la UI
 * @returns {Array} - Lista de idiomas
 */
function getLanguagesList() {
    return languagesData;
}

/**
 * Verifica si los idiomas ya están cargados
 * @returns {boolean}
 */
function isLanguagesLoaded() {
    return languagesLoaded;
}

/**
 * Obtiene el nombre actual del usuario
 * @returns {string}
 */
function getUserName() {
    return currentUserName;
}

// ===== INICIALIZACIÓN =====
// Cargar idiomas y configurar prompt inicial
loadLanguagesData();
actualizarSystemPrompt();
clearContext();

// ===== EXPORTACIONES GLOBALES =====
window.addToContext = addToContext;
window.clearContext = clearContext;
window.formatMessages = formatMessages;
window.setPersonality = setPersonality;
window.setLanguage = setLanguage;
window.setUserName = setUserName;
window.marcarSaludoComoHecho = marcarSaludoComoHecho;
window.getLanguagesList = getLanguagesList;
window.isLanguagesLoaded = isLanguagesLoaded;
window.getUserName = getUserName;
window.PERSONALITIES = PERSONALITIES;