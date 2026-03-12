// ===================================================================================
//          WILSON CORE 2.4.3 - ARQUIVO PRINCIPAL MODULAR
//          Carrega todos os módulos na ordem correta
// ===================================================================================

/*
    ORDEM DE CARREGAMENTO (IMPORTANTE):
    
    1. Validators      - Funções básicas de validação (não depende de nada)
    2. Config          - Configuração e Socket.IO (usa Validators)
    3. Data-Sync       - Sincronização de dados (usa Config)
    4. Notifications   - Sistema de notificações (usa Config e Data-Sync)
    5. UI-Navigation   - Navegação e UI (usa Data-Sync)
    6. Patio           - Gestão de pátio (usa Validators, Data-Sync, Notifications)
    7. Cadastros       - CRUD de cadastros (usa Validators, Data-Sync, Notifications)
    8. Mapas-Cegos     - Gestão de mapas (usa Data-Sync, Notifications)
    9. Materia-Prima   - Pesagem (usa Data-Sync, Notifications)
    10. Carregamento   - Controle de carregamento (usa Data-Sync)
    11. Relatorios     - Geração de relatórios (usa Data-Sync)
    12. Dashboard      - Dashboard inteligente (usa Data-Sync)
    13. Users          - Gestão de usuários (usa Data-Sync, Notifications)
    14. Products       - Catálogo de produtos (usa Data-Sync)
    
    NOTA: Este arquivo assume que os scripts serão carregados via tags <script>
    no HTML na ordem especificada. Para usar módulos ES6 (import/export), 
    será necessário refatorar todos os arquivos.
*/

// ===================================================================================
//          INICIALIZAÇÃO DO SISTEMA
// ===================================================================================

// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("===================================================");
    console.log("   WILSON CORE 2.4.3 - SISTEMA MODULARIZADO      ");
    console.log("===================================================");
    
    console.log("✓ Validators carregado");
    console.log("✓ Config carregado");
    console.log("✓ Data-Sync carregado");
    console.log("✓ Notifications carregado");
    console.log("✓ UI-Navigation carregado");
    console.log("✓ Patio carregado");
    console.log("✓ Cadastros carregado (se disponível)");
    console.log("✓ Mapas-Cegos carregado (se disponível)");
    console.log("✓ Materia-Prima carregado (se disponível)");
    console.log("✓ Carregamento carregado (se disponível)");
    console.log("✓ Relatorios carregado (se disponível)");
    console.log("✓ Dashboard carregado (se disponível)");
    console.log("✓ Users carregado (se disponível)");
    console.log("✓ Products carregado (se disponível)");
    
    console.log("===================================================");
    console.log("   Inicializando Sistema...                       ");
    console.log("===================================================");
    
    // Inicializa a interface baseada em permissões
    initRoleBasedUI();

    // Define a última visualização ou padrão
    let lastView = localStorage.getItem('aw_last_view') || 'patio';
    
    // Redireciona almoxarifado se a última visualização foi cadastros
    if (lastView === 'cadastros' && typeof userSubType !== 'undefined' && userSubType === 'ALM') {
        lastView = 'patio';
    }

    // Navega para a visualização inicial
    if (typeof loggedUser !== 'undefined' && loggedUser) {
        navTo(lastView, null);
    }

    // Inicializa o relógio no header
    const clockEl = document.getElementById('serverTime');
    if (clockEl) {
        setInterval(() => {
            const now = new Date();
            clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    }
    
    // Carrega dados do servidor
    loadDataFromServer();
    
    // Verifica modal de primeiro acesso
    setTimeout(() => {
        try {
            const pending = sessionStorage.getItem('must_change_pw');
            if (pending) {
                const logged = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
                if (logged && logged.username === pending) {
                    document.getElementById('modalFirstAccess') && (document.getElementById('modalFirstAccess').style.display = 'flex');
                }
            }
        } catch (e) { 
            console.warn("Erro ao verificar primeiro acesso:", e);
        }
    }, 800);
    
});

function closeFirstAccessModal() {
    document.getElementById('modalFirstAccess').style.display = 'none';
}

async function saveFirstAccessPassword() {
    const p1 = document.getElementById('newPw1').value;
    const p2 = document.getElementById('newPw2').value;
    if (p1.length < 4) return alert('Senha muito curta.');
    if (p1 !== p2) return alert('Senhas não conferem.');

    const u = usersData.find(x => x.username === loggedUser.username);
    if (u) {
        u.password = p1; // Em produção, usar hash
        u.isTempPassword = false;
        saveAll();
    }
    sessionStorage.removeItem('must_change_pw');
    closeFirstAccessModal();
    alert('Senha atualizada.');
    location.reload();
}

// ===================================================================================
//          VARIÁVEIS GLOBAIS AUXILIARES
// ===================================================================================

const today = getBrazilTime().split('T')[0];

console.log("Main.js carregado - Aguardando DOMContentLoaded...");


// ===================================================================================
//          FUNÇÕES DE BACKUP, RESTORE E RESET DE DADOS
// ===================================================================================

/**
 * Faz download de todos os dados do servidor em formato JSON
 */
async function backupData() {
    try {
        showLoading();
        
        // Coleta todos os dados do servidor
        const response = await fetch(`${API_URL}/api/sync?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Falha ao conectar ao servidor");
        
        const allData = await response.json();
        
        // Cria um objeto com timestamp
        const backup = {
            timestamp: new Date().toISOString(),
            data: allData
        };
        
        // Converte para JSON e faz download
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_controladoria_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        hideLoading();
        alert('✅ Backup realizado com sucesso!');
        
        // Após o backup, executa o script de importação de produtos
        console.log("Iniciando importação de produtos...");
        await executeProductImport();
        
    } catch (error) {
        hideLoading();
        console.error("Erro ao fazer backup:", error);
        alert(`❌ Erro ao fazer backup: ${error.message}`);
    }
}

/**
 * Executa o script de importação de produtos via API do servidor
 */
async function executeProductImport() {
    try {
        showLoading();
        
        // Faz uma requisição ao servidor para executar o script de importação
        const response = await fetch(`${API_URL}/api/import-products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'import' })
        });
        
        if (!response.ok) {
            // Se a rota não existir, tenta executar via comando direto
            console.warn("Rota de importação não disponível. Tente executar manualmente: node corrigir_importacao.js");
            hideLoading();
            alert('⚠️ Para importar os produtos, execute no servidor:\n\nnode corrigir_importacao.js');
            return;
        }
        
        const result = await response.json();
        hideLoading();
        
        alert(`✅ Importação concluída!\n\n${result.message || 'Produtos importados com sucesso.'}`);
        
        // Recarrega os dados
        await loadDataFromServer();
        refreshCurrentView();
        
    } catch (error) {
        hideLoading();
        console.error("Erro ao executar importação:", error);
        alert('⚠️ Para importar os produtos, execute no servidor:\n\nnode corrigir_importacao.js');
    }
}

/**
 * Restaura dados de um arquivo JSON de backup
 */
async function restoreData(fileInput) {
    try {
        if (!fileInput.files || !fileInput.files[0]) return;
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                showLoading();
                
                const content = JSON.parse(e.target.result);
                const dataToRestore = content.data || content; // Compatibilidade com backups antigos
                
                // Confirma a restauração
                if (!confirm('⚠️ Isso vai APAGAR todos os dados atuais e restaurar o backup. Tem certeza?')) {
                    hideLoading();
                    return;
                }
                
                // Envia os dados para o servidor restaurar
                const response = await fetch(`${API_URL}/api/restore`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToRestore)
                });
                
                if (!response.ok) throw new Error("Falha ao restaurar no servidor");
                
                // Atualiza os dados locais
                await loadDataFromServer();
                
                hideLoading();
                alert('✅ Dados restaurados com sucesso!');
                refreshCurrentView();
                
            } catch (error) {
                hideLoading();
                console.error("Erro ao restaurar:", error);
                alert(`❌ Erro ao restaurar: ${error.message}`);
            }
        };
        
        reader.readAsText(file);
        
    } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        alert(`❌ Erro ao processar arquivo: ${error.message}`);
    }
}

/**
 * Apaga todos os dados do sistema com confirmação dupla
 */
async function clearAllData() {
    try {
        // Primeira confirmação
        if (!confirm('⚠️ ATENÇÃO: Isso vai APAGAR TODOS OS DADOS do sistema!\n\nTem certeza?')) {
            return;
        }
        
        // Segunda confirmação para garantir
        if (!confirm('🚨 ÚLTIMA CHANCE: Todos os dados serão perdidos permanentemente!\n\nDeseja continuar?')) {
            return;
        }
        
        showLoading();
        
        // Faz a requisição para resetar no servidor
        const response = await fetch(`${API_URL}/api/reset`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error("Falha ao resetar no servidor");
        
        // Limpa o localStorage também
        localStorage.clear();
        
        hideLoading();
        alert('✅ Todos os dados foram apagados com sucesso!');
        
        // Recarrega a página
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
    } catch (error) {
        hideLoading();
        console.error("Erro ao limpar dados:", error);
        alert(`❌ Erro ao limpar dados: ${error.message}`);
    }
}
