/**
 * ============================================
 * API-CONFIG.JS
 * Configuración y comunicación con Pollinations.ai
 * ============================================
 */

// ===== CONFIGURACIÓN PRINCIPAL =====
const API_CONFIG = {
    // 🔐 IMPORTANTE: Esta API key debe moverse al backend en producción
    apiKey: "sk_ZkpCEOhkuwM4oFOeKpWJzqeInHM9aUjT",
    
    // URLs base
    baseURL: 'https://gen.pollinations.ai',
    
    // Modelos disponibles
    models: {
        base: 'openai',
        reasoning: 'perplexity-reasoning',
        search: 'gemini-search'
    },
    
    // Endpoints
    endpoints: {
        chat: '/v1/chat/completions',
        image: '/image',
        text: '/text',
        models: '/v1/models'
    },
    
    // Configuración por defecto
    defaultOptions: {
        temperature: 0.7,
        stream: true
    },
    
    // Headers para autenticación
    getHeaders: function() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
    }
};

// ===== ESTADO GLOBAL DEL MODELO =====
let currentModel = localStorage.getItem('pera_default_model') || 'openai';

/**
 * Cambia el modelo activo
 * @param {string} modelTypeOrKey - Puede ser 'think', 'search' o nombre directo del modelo
 * @returns {string} - El nuevo modelo activo
 */
function setActiveModel(modelTypeOrKey) {
    // Si es un nombre de modelo directo (no 'think' ni 'search')
    if (modelTypeOrKey !== 'think' && modelTypeOrKey !== 'search') {
        currentModel = modelTypeOrKey === 'base' ? API_CONFIG.models.base : modelTypeOrKey;
        localStorage.setItem('pera_default_model', currentModel);
        return currentModel;
    }
    
    // Toggle para modo 'think' (razonamiento)
    if (modelTypeOrKey === 'think') {
        currentModel = (currentModel === API_CONFIG.models.reasoning) 
            ? API_CONFIG.models.base 
            : API_CONFIG.models.reasoning;
    }
    
    // Toggle para modo 'search' (búsqueda web)
    if (modelTypeOrKey === 'search') {
        currentModel = (currentModel === API_CONFIG.models.search) 
            ? API_CONFIG.models.base 
            : API_CONFIG.models.search;
    }
    
    localStorage.setItem('pera_default_model', currentModel);
    return currentModel;
}

/**
 * Obtiene la temperatura actual desde localStorage
 * @returns {number} - Valor de temperatura (0-1)
 */
function getCurrentTemperature() {
    const savedTemp = localStorage.getItem('pera_temperature');
    return savedTemp ? parseFloat(savedTemp) : API_CONFIG.defaultOptions.temperature;
}

/**
 * Llama a la API de Pollinations con streaming
 * @param {Array} messages - Array de mensajes con rol y contenido
 * @param {Function} onChunk - Callback para cada fragmento de respuesta
 * @param {Object} options - Opciones adicionales (temperatura, etc.)
 * @returns {Promise<boolean>} - True si la llamada fue exitosa
 */
async function callPollinationsAPI(messages, onChunk, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    // Obtener temperatura desde localStorage
    const temperature = options.temperature || getCurrentTemperature();
    
    try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.chat}`, {
            method: 'POST',
            headers: API_CONFIG.getHeaders(),
            body: JSON.stringify({
                model: currentModel,
                messages: messages,
                stream: true,
                temperature: temperature
            }),
            signal: controller.signal
        });

        // Manejar errores de respuesta
        if (!response.ok) {
            let errorMsg = `Error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error?.message || errorMsg;
            } catch (e) {
                // Si no se puede parsear JSON, usar mensaje por defecto
            }
            throw new Error(errorMsg);
        }

        // Procesar stream de datos
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content && onChunk) onChunk(content);
                    } catch (e) {
                        // Ignorar líneas mal formadas
                    }
                }
            }
        }
        
        clearTimeout(timeoutId);
        return true;
        
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('⏱️ Tiempo de espera agotado');
        }
        throw error;
    }
}

// ===== EXPORTACIONES GLOBALES =====
window.API_CONFIG = API_CONFIG;
window.setActiveModel = setActiveModel;
window.callPollinationsAPI = callPollinationsAPI;
window.getCurrentTemperature = getCurrentTemperature;