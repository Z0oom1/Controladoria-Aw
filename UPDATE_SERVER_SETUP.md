# Configuração do Servidor de Atualizações - Controladoria AW

## Visão Geral

O Controladoria AW agora suporta **auto-update automático** usando `electron-updater`. Este documento explica como configurar o servidor de atualizações.

## Fluxo de Atualização

1. **Verificação**: A aplicação verifica por atualizações a cada 1 hora
2. **Download**: Se houver atualização, o arquivo é baixado em background
3. **Notificação**: Usuário recebe notificação quando atualização está pronta
4. **Instalação**: Usuário clica em "Instalar Agora" e a aplicação se reinicia com a nova versão

## Configuração do Servidor

### Opção 1: Servidor Genérico (Recomendado)

O `electron-updater` está configurado para usar o provedor **generic**, que funciona com qualquer servidor HTTP/HTTPS.

**Estrutura de diretórios esperada:**

```
https://seu-servidor.com/updates/
├── latest.yml
├── Controladoria-AW-3.6.9-x64.exe
├── Controladoria-AW-3.6.9-ia32.exe
└── Controladoria-AW-3.6.9-portable.exe
```

### Opção 2: GitHub Releases

Se preferir usar GitHub, altere a configuração em `package.json`:

```json
"publish": {
  "provider": "github",
  "owner": "seu-usuario",
  "repo": "seu-repo"
}
```

### Opção 3: AWS S3

Para usar S3, altere:

```json
"publish": {
  "provider": "s3",
  "bucket": "seu-bucket",
  "region": "us-east-1"
}
```

## Geração do Arquivo `latest.yml`

Após fazer o build, você precisa criar um arquivo `latest.yml` no servidor. Este arquivo contém informações sobre a versão mais recente.

### Exemplo de `latest.yml`:

```yaml
version: 3.6.10
files:
  - url: Controladoria-AW-3.6.10-x64.exe
    sha512: (hash-sha512-do-arquivo)
    size: 123456789
  - url: Controladoria-AW-3.6.10-ia32.exe
    sha512: (hash-sha512-do-arquivo)
    size: 123456789
  - url: Controladoria-AW-3.6.10-portable.exe
    sha512: (hash-sha512-do-arquivo)
    size: 123456789
path: Controladoria-AW-3.6.10-x64.exe
sha512: (hash-sha512-do-arquivo)
releaseDate: '2024-03-11T10:00:00.000Z'
```

## Script para Gerar Hashes

```bash
# Windows PowerShell
(Get-FileHash "Controladoria-AW-3.6.10-x64.exe" -Algorithm SHA512).Hash

# Linux/Mac
sha512sum Controladoria-AW-3.6.10-x64.exe
```

## Configuração da URL no Código

Atualize a URL do servidor em `package.json`:

```json
"publish": {
  "provider": "generic",
  "url": "https://seu-servidor.com/updates/"
}
```

## Processo de Build e Deploy

### 1. Atualizar Versão

```bash
# Editar package.json
"version": "3.6.10"
```

### 2. Build da Aplicação

```bash
npm install
npm run build:win
```

Os arquivos compilados estarão em `dist/`:
- `Controladoria-AW-3.6.10-x64.exe` (instalador 64-bit)
- `Controladoria-AW-3.6.10-ia32.exe` (instalador 32-bit)
- `Controladoria-AW-3.6.10-portable.exe` (versão portável)

### 3. Fazer Upload para o Servidor

```bash
# Exemplo com SCP
scp dist/Controladoria-AW-*.exe usuario@seu-servidor.com:/var/www/updates/

# Ou com FTP/SFTP
```

### 4. Gerar e Fazer Upload de `latest.yml`

```bash
# Gerar hashes
sha512sum dist/Controladoria-AW-*.exe > hashes.txt

# Criar latest.yml com as informações
# (ver exemplo acima)

# Fazer upload
scp latest.yml usuario@seu-servidor.com:/var/www/updates/
```

## Testando as Atualizações

### Em Desenvolvimento

1. Altere a URL em `package.json` para apontar para seu servidor de testes
2. Execute `npm run dev`
3. A aplicação verificará atualizações a cada 1 hora
4. Para forçar verificação, abra o DevTools e execute:

```javascript
const { ipcRenderer } = require('electron');
ipcRenderer.send('check-for-updates');
```

### Em Produção

1. Instale a versão atual
2. Coloque uma nova versão no servidor
3. Reinicie a aplicação ou aguarde 1 hora
4. Você verá uma notificação de atualização disponível

## Segurança

### HTTPS Obrigatório

Sempre use HTTPS para servir as atualizações:

```json
"publish": {
  "provider": "generic",
  "url": "https://seu-servidor.com/updates/"
}
```

### Verificação de Assinatura

Para adicionar assinatura de código (opcional, recomendado):

1. Gere um certificado de assinatura
2. Configure em `package.json`:

```json
"win": {
  "certificateFile": "caminho/para/certificado.pfx",
  "certificatePassword": "sua-senha"
}
```

## Troubleshooting

### Atualização não aparece

1. Verifique se `latest.yml` está no servidor
2. Verifique se os hashes SHA512 estão corretos
3. Verifique se a URL em `package.json` está correta
4. Verifique os logs: `~/.config/Controladoria AW/logs/main.log`

### Erro ao baixar

1. Verifique se os arquivos `.exe` estão no servidor
2. Verifique permissões CORS do servidor
3. Verifique se a conexão de rede está funcionando

### Instalação falha

1. Verifique se o usuário tem permissão de escrita no diretório de instalação
2. Desative antivírus temporariamente (pode bloquear instalação)
3. Tente a versão portável como alternativa

## Referências

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [Electron Builder](https://www.electron.build/)
- [NSIS Installer](https://nsis.sourceforge.io/)

## Suporte

Para dúvidas ou problemas, entre em contato com o desenvolvedor.
