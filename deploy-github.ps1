# Script para Deploy do MoniMax no GitHub
# Usuário: maxsouza123
# Repositório: monimax-sistema

Write-Host "🚀 Iniciando deploy do MoniMax no GitHub..." -ForegroundColor Green
Write-Host ""

# Atualizar PATH do Git
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verificar se Git está instalado
Write-Host "📋 Verificando instalação do Git..." -ForegroundColor Cyan
git --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git não encontrado! Por favor, instale o Git primeiro." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Git instalado!" -ForegroundColor Green
Write-Host ""

# Verificar se já existe repositório Git
if (Test-Path ".git") {
    Write-Host "📁 Repositório Git já existe" -ForegroundColor Yellow
} else {
    Write-Host "📁 Inicializando repositório Git..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Repositório inicializado!" -ForegroundColor Green
}
Write-Host ""

# Adicionar todos os arquivos
Write-Host "📦 Adicionando arquivos ao Git..." -ForegroundColor Cyan
git add .
Write-Host "✅ Arquivos adicionados!" -ForegroundColor Green
Write-Host ""

# Verificar status
Write-Host "📊 Status dos arquivos:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Fazer commit
Write-Host "💾 Criando commit..." -ForegroundColor Cyan
git commit -m "🎉 Commit inicial: Sistema MoniMax completo com documentação"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Nenhuma alteração para commitar ou commit já existe" -ForegroundColor Yellow
}
Write-Host ""

# Verificar se já existe remote
$remoteExists = git remote | Select-String "origin"
if ($remoteExists) {
    Write-Host "🔗 Remote 'origin' já existe. Removendo..." -ForegroundColor Yellow
    git remote remove origin
}

# Adicionar remote do GitHub
Write-Host "🔗 Conectando ao GitHub..." -ForegroundColor Cyan
git remote add origin https://github.com/maxsouza123/monimax-sistema.git
Write-Host "✅ Conectado ao repositório: maxsouza123/monimax-sistema" -ForegroundColor Green
Write-Host ""

# Renomear branch para main
Write-Host "🌿 Configurando branch principal..." -ForegroundColor Cyan
git branch -M main
Write-Host "✅ Branch configurada como 'main'" -ForegroundColor Green
Write-Host ""

# Push para o GitHub
Write-Host "🚀 Enviando código para o GitHub..." -ForegroundColor Cyan
Write-Host "⚠️ Você precisará fazer login no GitHub!" -ForegroundColor Yellow
Write-Host ""
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 SUCESSO! Projeto enviado para o GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Acesse seu repositório em:" -ForegroundColor Cyan
    Write-Host "   https://github.com/maxsouza123/monimax-sistema" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erro ao enviar para o GitHub" -ForegroundColor Red
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "  1. Você não criou o repositório no GitHub ainda" -ForegroundColor White
    Write-Host "  2. Credenciais incorretas" -ForegroundColor White
    Write-Host "  3. Repositório já existe com conteúdo" -ForegroundColor White
    Write-Host ""
    Write-Host "Soluções:" -ForegroundColor Yellow
    Write-Host "  1. Crie o repositório em: https://github.com/new" -ForegroundColor White
    Write-Host "  2. Use um Personal Access Token como senha" -ForegroundColor White
    Write-Host "  3. Se o repo já existe, use: git push -f origin main" -ForegroundColor White
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
