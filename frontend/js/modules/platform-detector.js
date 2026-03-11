// ===================================================================================
//          PLATFORM DETECTOR 1.0 - DETECÇÃO DE AMBIENTE (ELECTRON vs WEB)
//          Gerencia visibilidade de elementos específicos da plataforma
// ===================================================================================

/**
 * Detecta se está rodando em Electron ou navegador web
 * @returns {boolean} true se Electron, false se navegador web
 */
function isElectronApp() {
    return typeof window.require !== 'undefined' && 
           typeof window.require('electron') !== 'undefined';
}

/**
 * Detecta se está em modo desenvolvimento (npm run dev)
 * @returns {boolean} true se em desenvolvimento
 */
function isDevMode() {
    return window.location.hostname === 'localhost' && 
           window.location.port === '5173';
}

/**
 * Detecta se está em modo web (servidor remoto ou arquivo local via servidor)
 * @returns {boolean} true se em modo web
 */
function isWebMode() {
    return !isElectronApp();
}

/**
 * Inicializa a detecção de plataforma e aplica estilos/comportamentos específicos
 */
function initPlatformDetection() {
    const isElectron = isElectronApp();
    const isWeb = isWebMode();
    
    // Adiciona classe ao body para facilitar seletores CSS
    if (isElectron) {
        document.body.classList.add('platform-electron');
        console.log("✓ Plataforma detectada: ELECTRON");
    } else {
        document.body.classList.add('platform-web');
        console.log("✓ Plataforma detectada: WEB");
    }
    
    // Oculta botões de controle na versão web
    if (isWeb) {
        hideWindowControls();
    }
    
    // Inicializa listeners de Electron se disponível
    if (isElectron) {
        initElectronControls();
    }
    
    return {
        isElectron,
        isWeb,
        isDev: isDevMode()
    };
}

/**
 * Oculta os botões de controle de janela (minimizar, maximizar, fechar)
 */
function hideWindowControls() {
    const windowControls = document.querySelector('.window-controls');
    if (windowControls) {
        windowControls.style.display = 'none';
        console.log("✓ Botões de controle ocultados (modo WEB)");
    }
}

/**
 * Mostra os botões de controle de janela (para Electron)
 */
function showWindowControls() {
    const windowControls = document.querySelector('.window-controls');
    if (windowControls) {
        windowControls.style.display = 'flex';
        console.log("✓ Botões de controle visíveis (modo ELECTRON)");
    }
}

/**
 * Inicializa os controles de janela do Electron
 */
function initElectronControls() {
    try {
        const { ipcRenderer } = require('electron');
        
        // Minimizar
        const minBtn = document.getElementById('minBtn');
        if (minBtn) {
            minBtn.addEventListener('click', () => {
                ipcRenderer.send('minimize-app');
            });
        }
        
        // Maximizar/Restaurar
        const maxBtn = document.getElementById('maxBtn');
        if (maxBtn) {
            maxBtn.addEventListener('click', () => {
                ipcRenderer.send('maximize-app');
            });
        }
        
        // Fechar
        const closeBtn = document.getElementById('closeBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                ipcRenderer.send('close-app');
            });
        }
        
        console.log("✓ Controles de Electron inicializados");
    } catch (err) {
        console.warn("⚠️ Erro ao inicializar controles de Electron:", err);
    }
}

/**
 * Detecta mudanças de plataforma em tempo real (útil para hot reload)
 * @param {Function} callback - Função chamada quando a plataforma é detectada
 */
function onPlatformDetected(callback) {
    document.addEventListener('DOMContentLoaded', () => {
        const platformInfo = initPlatformDetection();
        if (callback) callback(platformInfo);
    });
}

// Inicializa automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlatformDetection);
} else {
    initPlatformDetection();
}

console.log("Platform Detector carregado");
