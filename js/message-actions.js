/**
 * ============================================
 * MESSAGE-ACTIONS.JS
 * Funciones para compartir y exportar PDF
 * ============================================
 */

/**
 * Comparte el texto de un mensaje del bot usando Web Share API
 * Con fallback a portapapeles si el navegador no soporta compartir
 * @param {HTMLElement} button - Botón que disparó la acción
 */
window.shareMessage = async function(button) {
    const messageDiv = button.closest('.message-ia');
    const bubble = messageDiv.querySelector('.bubble');
    const text = bubble.textContent || bubble.innerText;
    
    // Datos para compartir
    const shareData = {
        title: 'Alondra AI - Respuesta',
        text: text,
        url: window.location.href
    };
    
    // Verificar si Web Share API está disponible
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
            // Feedback visual: check
            showActionFeedback(button, 'shared');
        } catch (err) {
            // Usuario canceló o error -> silencio
            if (err.name !== 'AbortError') {
                // Error real -> fallback a copiar
                fallbackCopy(text, button);
            }
        }
    } else {
        // Fallback: copiar al portapapeles
        fallbackCopy(text, button);
    }
};

/**
 * Fallback: copia el texto al portapapeles
 * @param {string} text - Texto a copiar
 * @param {HTMLElement} button - Botón para feedback visual
 */
function fallbackCopy(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        showActionFeedback(button, 'copied');
    }).catch(() => {
        // Silencio si falla
    });
}

/**
 * Exporta el contenido renderizado de una burbuja a PDF
 * Usando jsPDF y html2canvas para preservar el Markdown renderizado
 * @param {HTMLElement} button - Botón que disparó la acción
 */
window.exportBubbleToPDF = async function(button) {
    const messageDiv = button.closest('.message-ia');
    const bubble = messageDiv.querySelector('.bubble');
    
    // Feedback visual: mostrar "Generando..."
    showActionFeedback(button, 'generating');
    
    try {
        // Cargar html2canvas dinámicamente si no está disponible
        if (typeof html2canvas === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }
        
        // Clonar la burbuja para no modificar el DOM visible
        const clone = bubble.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.maxWidth = '700px';
        clone.style.width = '700px';
        clone.style.padding = '20px';
        clone.style.backgroundColor = '#FFFFFF';
        clone.style.color = '#333333';
        clone.style.fontFamily = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        clone.style.fontSize = '17px';
        clone.style.lineHeight = '1.8';
        clone.style.borderRadius = '12px';
        document.body.appendChild(clone);
        
        // Capturar con html2canvas
        const canvas = await html2canvas(clone, {
            backgroundColor: '#FFFFFF',
            scale: 2, // Mayor calidad
            logging: false
        });
        
        // Limpiar el clon
        document.body.removeChild(clone);
        
        // Crear PDF con jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = 190; // Ancho A4 con márgenes
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Si la imagen es más alta que una página, dividir
        let heightLeft = imgHeight;
        let position = 10; // Margen superior
        
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdf.internal.pageSize.height - 20);
        
        while (heightLeft > 0) {
            position = heightLeft - imgHeight + 10;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdf.internal.pageSize.height - 20);
        }
        
        // Descargar
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        pdf.save(`alondra-ai-respuesta-${timestamp}.pdf`);
        
        // Feedback: éxito
        showActionFeedback(button, 'downloaded');
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        showActionFeedback(button, 'error');
    }
};

/**
 * Carga un script dinámicamente
 * @param {string} src - URL del script
 * @returns {Promise}
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Muestra feedback visual temporal en el botón
 * @param {HTMLElement} button - Botón clickeado
 * @param {string} type - Tipo de feedback ('shared', 'copied', 'generating', 'downloaded', 'error')
 */
function showActionFeedback(button, type) {
    const originalHTML = button.innerHTML;
    const originalTitle = button.getAttribute('aria-label') || '';
    
    const feedbackMap = {
        'shared': {
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            label: '¡Compartido!',
            duration: 1500
        },
        'copied': {
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            label: '¡Copiado!',
            duration: 1500
        },
        'generating': {
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
            label: 'Generando...',
            duration: 0 // No resetear automáticamente
        },
        'downloaded': {
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            label: '¡PDF listo!',
            duration: 2000
        },
        'error': {
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            label: 'Error',
            duration: 2000
        }
    };
    
    const feedback = feedbackMap[type];
    if (!feedback) return;
    
    // Aplicar feedback
    button.innerHTML = feedback.icon;
    button.setAttribute('aria-label', feedback.label);
    button.style.color = type === 'error' ? '#f87171' : '#4ade80';
    
    // Resetear después de la duración (si no es 0)
    if (feedback.duration > 0) {
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.setAttribute('aria-label', originalTitle);
            button.style.color = '';
        }, feedback.duration);
    }
}