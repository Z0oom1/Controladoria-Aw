const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

// Verifica se estamos rodando pelo comando 'npm run dev'
const isDev = process.env.npm_lifecycle_event === "dev";

// --- CONFIGURAÇÃO DE REDE ---
// Coloque aqui o MESMO IP que você colocou no arquivo frontend/js/config.js
const SERVER_IP = "localhost"; // <--- ALTERE AQUI PARA O SEU IP
const SERVER_PORT = 2006;
const VITE_PORT = 5173;

// --- CONFIGURAÇÃO DE AUTO-UPDATE ---
autoUpdater.checkForUpdatesAndNotify();

// Log de atualizações
autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";

app.disableHardwareAcceleration();

// Armazena a janela principal para uso em listeners
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        autoHideMenuBar: true,
        backgroundColor: '#1a1a1a',
        icon: path.join(__dirname, 'Imgs', 'logo.png'),
        webPreferences: {
            nodeIntegration: true, // Necessário para sua arquitetura atual
            contextIsolation: false,
            webSecurity: false // Permite carregar recursos locais e remotos misturados
        }
    });

    if (isDev) {
        // --- MODO DESENVOLVIMENTO (Vite + Hot Reload) ---
        console.log(`⚡ Modo DEV: Carregando via Vite na porta ${VITE_PORT}`);
        
        // No modo dev, usamos o localhost do Vite
        mainWindow.loadURL(`http://localhost:${VITE_PORT}/pages/login.html`);
        
        // Abre o Inspecionar Elemento para ajudar no debug
        mainWindow.webContents.openDevTools({ mode: 'detach' });

    } else {
        // --- MODO PRODUÇÃO / REDE ---
        // Aqui está a mudança: Tentamos carregar do IP do Servidor primeiro.
        // Isso é útil se você quiser servir a interface pelo servidor Node.
        // Se falhar (offline), carregamos o arquivo local.
        
        const serverUrl = `http://${SERVER_IP}:${SERVER_PORT}/`;
        console.log(`🚀 Tentando conectar ao servidor: ${serverUrl}`);

        mainWindow.loadURL(serverUrl).catch((err) => {
            console.log("⚠️ Servidor não encontrado ou offline. Carregando arquivos locais.");
            // Fallback: Carrega o arquivo físico do computador
            mainWindow.loadFile(path.join(__dirname, 'pages', 'login.html'));
        });
    }

    // --- SEUS CONTROLES DE JANELA (Mantidos) ---
    ipcMain.on('minimize-app', () => mainWindow.minimize());
    
    ipcMain.on('maximize-app', () => {
        mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
    });

    ipcMain.on('close-app', () => mainWindow.close());

    // --- LISTENERS DE AUTO-UPDATE ---
    ipcMain.on('check-for-updates', () => {
        console.log("🔍 Verificando atualizações...");
        autoUpdater.checkForUpdates();
    });

    ipcMain.on('install-update', () => {
        console.log("🔄 Instalando atualização...");
        autoUpdater.quitAndInstall();
    });

    mainWindow.on('closed', () => {
        ipcMain.removeAllListeners('minimize-app');
        ipcMain.removeAllListeners('maximize-app');
        ipcMain.removeAllListeners('close-app');
        ipcMain.removeAllListeners('check-for-updates');
        ipcMain.removeAllListeners('install-update');
    });
}

// --- EVENTOS DE AUTO-UPDATE ---
autoUpdater.on('checking-for-update', () => {
    console.log('🔍 Verificando atualizações...');
});

autoUpdater.on('update-available', (info) => {
    console.log('📦 Atualização disponível:', info.version);
    if (mainWindow) {
        mainWindow.webContents.send('update-available', info);
    }
});

autoUpdater.on('update-not-available', (info) => {
    console.log('✓ Sistema está atualizado. Versão:', info.version);
});

autoUpdater.on('error', (err) => {
    console.error('❌ Erro ao verificar atualizações:', err);
    if (mainWindow) {
        mainWindow.webContents.send('update-error', err);
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
    
    if (mainWindow) {
        mainWindow.webContents.send('download-progress', progressObj);
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ Atualização baixada. Versão:', info.version);
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded', info);
    }
});

app.whenReady().then(() => {
    createWindow();

    // Verifica atualizações a cada 1 hora (3600000 ms)
    setInterval(() => {
        autoUpdater.checkForUpdates();
    }, 3600000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
