// ===================================================================================
//          ELECTRON AUTO-UPDATER 1.0 - GERENCIAMENTO DE ATUALIZAÇÕES
//          Verifica e instala atualizações automaticamente
// ===================================================================================

let updateAvailable = false;
let updateDownloaded = false;

/**
 * Inicializa o sistema de auto-update do Electron
 * Deve ser chamado apenas em ambiente Electron
 */
function initElectronUpdater() {
    // Verifica se está em ambiente Electron
    if (typeof window.require === 'undefined') {
        console.log("⚠️ Auto-updater: Não está em ambiente Electron, ignorando");
        return;
    }

    try {
        const { ipcRenderer } = require('electron');
        
        console.log("✓ Inicializando sistema de auto-update...");
        
        // Listener: Atualização disponível
        ipcRenderer.on('update-available', (event, info) => {
            console.log("📦 Atualização disponível:", info.version);
            updateAvailable = true;
            showUpdateNotification(info.version, 'available');
        });
        
        // Listener: Atualização baixada e pronta para instalar
        ipcRenderer.on('update-downloaded', (event, info) => {
            console.log("✅ Atualização baixada:", info.version);
            updateDownloaded = true;
            showUpdateNotification(info.version, 'downloaded');
        });
        
        // Listener: Erro ao baixar atualização
        ipcRenderer.on('update-error', (event, error) => {
            console.error("❌ Erro ao baixar atualização:", error);
            showUpdateNotification(null, 'error');
        });
        
        // Listener: Progresso do download
        ipcRenderer.on('download-progress', (event, progress) => {
            console.log(`📥 Download: ${Math.round(progress.percent)}%`);
            updateDownloadProgress(progress.percent);
        });
        
        // Solicita ao processo principal para verificar atualizações
        ipcRenderer.send('check-for-updates');
        
        console.log("✓ Sistema de auto-update inicializado");
        
    } catch (err) {
        console.error("❌ Erro ao inicializar auto-updater:", err);
    }
}

/**
 * Mostra notificação de atualização para o usuário
 * @param {string} version - Versão da atualização
 * @param {string} status - Status: 'available', 'downloaded', 'error'
 */
function showUpdateNotification(version, status) {
    // Cria container de notificação se não existir
    let notifContainer = document.getElementById('update-notification');
    if (!notifContainer) {
        notifContainer = document.createElement('div');
        notifContainer.id = 'update-notification';
        notifContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1a1a1a;
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 350px;
            border-left: 4px solid #b91c1c;
            font-family: 'Inter', sans-serif;
        `;
        document.body.appendChild(notifContainer);
    }
    
    let message = '';
    let icon = '';
    let actionButton = '';
    
    switch(status) {
        case 'available':
            message = `Atualização ${version} disponível! Será baixada automaticamente.`;
            icon = '📦';
            break;
        case 'downloaded':
            message = `Atualização ${version} pronta para instalar!`;
            icon = '✅';
            actionButton = `
                <button onclick="installUpdate()" style="
                    background: #b91c1c;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                    width: 100%;
                    font-weight: 600;
                ">Instalar Agora</button>
                <button onclick="dismissUpdateNotification()" style="
                    background: transparent;
                    color: #888;
                    border: none;
                    padding: 8px 16px;
                    cursor: pointer;
                    margin-top: 5px;
                    width: 100%;
                ">Instalar Depois</button>
            `;
            break;
        case 'error':
            message = 'Erro ao verificar atualizações. Tente novamente mais tarde.';
            icon = '❌';
            break;
    }
    
    notifContainer.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="font-size: 1.5rem;">${icon}</div>
            <div style="flex: 1;">
                <p style="margin: 0 0 8px 0; font-weight: 600;">${status === 'downloaded' ? 'Atualização Pronta' : 'Atualização Disponível'}</p>
                <p style="margin: 0; font-size: 0.9rem; color: #ccc;">${message}</p>
                ${actionButton}
            </div>
        </div>
    `;
    
    notifContainer.style.display = 'block';
}

/**
 * Atualiza a barra de progresso do download
 * @param {number} percent - Percentual do download (0-100)
 */
function updateDownloadProgress(percent) {
    const notifContainer = document.getElementById('update-notification');
    if (notifContainer && notifContainer.querySelector('.progress-bar')) {
        const progressBar = notifContainer.querySelector('.progress-bar');
        progressBar.style.width = percent + '%';
    }
}

/**
 * Instala a atualização baixada
 */
function installUpdate() {
    try {
        const { ipcRenderer } = require('electron');
        console.log("🔄 Instalando atualização...");
        ipcRenderer.send('install-update');
    } catch (err) {
        console.error("❌ Erro ao instalar atualização:", err);
        alert('Erro ao instalar atualização. Por favor, tente novamente.');
    }
}

/**
 * Descarta a notificação de atualização
 */
function dismissUpdateNotification() {
    const notifContainer = document.getElementById('update-notification');
    if (notifContainer) {
        notifContainer.style.display = 'none';
    }
}

/**
 * Verifica manualmente por atualizações (pode ser chamado pelo usuário)
 */
function checkForUpdatesManually() {
    try {
        const { ipcRenderer } = require('electron');
        console.log("🔍 Verificando atualizações manualmente...");
        ipcRenderer.send('check-for-updates');
    } catch (err) {
        console.error("❌ Erro ao verificar atualizações:", err);
    }
}

// Inicializa automaticamente se em Electron
if (typeof window.require !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initElectronUpdater);
    } else {
        initElectronUpdater();
    }
}

console.log("Electron Updater carregado");
