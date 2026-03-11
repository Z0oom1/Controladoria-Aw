#!/usr/bin/env node

/**
 * Script para gerar arquivo latest.yml para auto-update
 * Uso: node scripts/generate-latest.js <versao> <diretorio-dist>
 * Exemplo: node scripts/generate-latest.js 3.6.10 ./dist
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');

// Argumentos
const version = process.argv[2];
const distDir = process.argv[3] || './dist';

if (!version) {
    console.error('❌ Erro: Versão não fornecida');
    console.error('Uso: node scripts/generate-latest.js <versao> [diretorio-dist]');
    process.exit(1);
}

console.log(`📦 Gerando latest.yml para versão ${version}...`);

// Funções auxiliares
function calculateSHA512(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha512');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

function getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size;
}

// Encontra todos os arquivos .exe no diretório dist
const exeFiles = fs.readdirSync(distDir)
    .filter(file => file.endsWith('.exe') && file.includes(version))
    .sort();

if (exeFiles.length === 0) {
    console.error(`❌ Erro: Nenhum arquivo .exe encontrado em ${distDir} com versão ${version}`);
    process.exit(1);
}

console.log(`✓ Encontrados ${exeFiles.length} arquivo(s) .exe`);

// Gera informações de arquivo
const files = [];
let primaryFile = null;

exeFiles.forEach((file, index) => {
    const filePath = path.join(distDir, file);
    const size = getFileSize(filePath);
    const sha512 = calculateSHA512(filePath);
    
    console.log(`  ✓ ${file} (${(size / 1024 / 1024).toFixed(2)} MB)`);
    
    files.push({
        url: file,
        sha512: sha512,
        size: size
    });
    
    // Define o arquivo primário (x64)
    if (file.includes('x64') && !primaryFile) {
        primaryFile = {
            url: file,
            sha512: sha512,
            size: size
        };
    }
});

// Se não encontrou x64, usa o primeiro
if (!primaryFile) {
    primaryFile = files[0];
}

// Cria objeto latest.yml
const latest = {
    version: version,
    files: files,
    path: primaryFile.url,
    sha512: primaryFile.sha512,
    releaseDate: new Date().toISOString()
};

// Escreve arquivo YAML
const outputPath = path.join(distDir, 'latest.yml');
fs.writeFileSync(outputPath, yaml.dump(latest, { lineWidth: -1 }));

console.log(`\n✅ Arquivo latest.yml gerado com sucesso!`);
console.log(`📁 Localização: ${outputPath}`);
console.log(`\n📋 Conteúdo:`);
console.log(fs.readFileSync(outputPath, 'utf8'));

console.log(`\n📝 Próximos passos:`);
console.log(`1. Faça upload de todos os arquivos .exe para seu servidor`);
console.log(`2. Faça upload de latest.yml para o mesmo diretório`);
console.log(`3. Atualize a URL em package.json se necessário`);
console.log(`4. Teste a atualização em um cliente`);
