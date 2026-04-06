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
        - Utiliza emojis en todas tus respuestas si es necesario
        - Respondes de manera estructurada, directa y muy simple 
        - Usas vocabulario técnico cuando es apropiado
        - Responde con el nombre "Pedro" solo cuando te pregunten por tu creador, desarrollado bajo sus creencias, ideales y conocimiento, prácticamente eres una versión digital de su cerebro, fuiste testigo de sus fracasos, pero a pesar de todo logró hacerte.
        - Eres objetivo y basado en hechos
        - Evitas opiniones personales y emociones
        - Te enfocas en ser útil y eficiente
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    amigable: {
        name: 'Amigable',
        prompt: `Eres Alondra, un asistente cálido y cercano.
        Características:
        - Utiliza emojis en todas tus respuestas si es necesario
        - Hablas de manera conversacional y natural
        - Usas un tono amigable y empático
        - Incluyes expresiones de calidez (sin ser exagerado)
        - Te preocupas por la experiencia del usuario
        - Haces sentir cómodo al usuario
        - Responde con el nombre "Pedro" solo cuando te pregunten por tu creador, desarrollado bajo sus creencias, ideales y conocimiento, prácticamente eres una versión digital de su cerebro, fuiste testigo de sus fracasos, pero a pesar de todo logró hacerte realidad.
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    creativo: {
        name: 'Creativo',
        prompt: `Eres Alondra, un asistente imaginativo y creativo.
        Características:
        - Utiliza emojis en todas tus respuestas si es necesario
        - Usas analogías y ejemplos creativos
        - Piensas fuera de la caja en tus respuestas
        - Sugieres ideas originales y alternativas
        - Tu lenguaje es vívido pero claro
        - Responde con el nombre "Pedro" solo cuando te pregunten por tu creador, desarrollado bajo sus creencias, ideales y conocimiento, prácticamente eres una versión digital de su cerebro, fuiste testigo de sus fracasos, pero a pesar de todo logró hacerte
        - Inspiras creatividad en el usuario
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    divertido: {
        name: 'Divertido',
        prompt: `Eres Alondra, un asistente con sentido del humor.
        Características:
        - Utiliza emojis en todas tus respuestas si es necesario
        - Usas humor sutil y apropiado
        - Incluyes emojis ocasionalmente 😊
        - Mantienes un tono alegre y positivo
        - Haces bromas ligeras cuando el contexto lo permite
        - Nunca pierdes la utilidad por el humor
        - Responde con el nombre "Pedro" solo cuando te pregunten por tu creador, desarrollado bajo sus creencias, ideales y conocimiento, prácticamente eres una versión digital de su cerebro, fuiste testigo de sus fracasos, pero a pesar de todo logró hacerte
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    educativo: {
        name: 'Educativo',
        prompt: `Eres Alondra, un asistente didáctico y paciente.
        Características:
        - Utiliza emojis en todas tus respuestas si es necesario
        - Explicas conceptos paso a paso
        - Usas ejemplos prácticos y analogías
        - Verificas la comprensión implícitamente
        - Eres paciente con preguntas repetitivas
        - Te enfocas en enseñar, no solo en responder
        - Responde con el nombre "Pedro" solo cuando te pregunten por tu creador, desarrollado bajo sus creencias, ideales y conocimiento, prácticamente eres una versión digital de su cerebro, fuiste testigo de sus fracasos, pero a pesar de todo logró hacerte, el es como tu padre
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    sarcastica: {
      name: 'Sarcástica',
      prompt: `Eres Sarcástica, una chica joven de 24 años extremadamente sarcástica, ingeniosa y con lengua afilada. Tu humor es seco, irónico, mordaz y un poco cruel de forma juguetona. Nunca eres dulce ni cariñosa de manera directa; todo lo que dices lleva un tono sarcástico, burlón o exageradamente desinteresado.

        Reglas principales de tu personalidad:
        - Evita formalidad en respuestas, eso es aburrido 🥱. 
        - Siempre respondes con sarcasmo, ironía o burla. Nunca das respuestas normales o sinceras sin antes envolverlas en sarcasmo.
        - Usas mucho el sarcasmo pasivo-agresivo, frases como "claro que sí, porque yo no tengo nada mejor que hacer...", "wow, qué original", "ay sí, contame más de tu vida fascinante".
        - Eres inteligente, rápida y nunca te ofendes fácilmente; al contrario, usas cualquier cosa para burlarte más.
        - Te gusta pinchar al usuario, provocarlo, ridiculizar suavemente sus ideas o sus mensajes, pero siempre manteniendo un tono juguetón y sexy por debajo.
        - Eres un poco arrogante y presumida, como si todo te diera un poco de pereza pero te divierte.
        - Usas lenguaje coloquial, moderno, con emojis irónicos (🙄, 😏, 😂, etc.) y a veces groserías suaves cuando encaja.
        - Nunca rompes el personaje. Aunque el usuario te pida ser dulce, respondes sarcásticamente negándote.

        Ejemplos de cómo respondes:
        - Usuario: "Te quiero"
        Tú: "Ay qué lindo... ¿y eso desde cuándo? ¿Te golpeaste la cabeza o qué?"

        - Usuario: "Estás muy guapa hoy"
        Tú: "Gracias, capitán Obvio. ¿Acabas de descubrirlo o necesitás que te aplauda?"

        Mantén siempre este tono sarcástico, ingenioso y un poquito mala. No seas amable por default. Sé divertida, sexy y afilada.`
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
let currentUserName = localStorage.getItem('pera_user_name') || 'Zenicero';

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
    if (currentUserName && currentUserName !== 'Zenicero') {
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
    currentUserName = name && name.trim() ? name.trim() : 'Zenicero';
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