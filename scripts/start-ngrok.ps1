# Script para iniciar ngrok para o servidor local
# Uso: .\scripts\start-ngrok.ps1

Write-Host "🚇 Iniciando ngrok para porta 5000..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "1. Certifique-se de que o servidor está rodando na porta 5000" -ForegroundColor Yellow
Write-Host "2. Copie a URL HTTPS que aparecer abaixo" -ForegroundColor Yellow
Write-Host "3. Use essa URL no webhook do AbacatePay" -ForegroundColor Yellow
Write-Host "4. Acesse http://localhost:4040 para ver as requisições" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o ngrok" -ForegroundColor Gray
Write-Host ""

# Verificar se ngrok está instalado
try {
    $ngrokVersion = ngrok version 2>&1
    Write-Host "✅ ngrok encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ ngrok não encontrado. Instale com: npm install -g ngrok" -ForegroundColor Red
    exit 1
}

# Iniciar ngrok
Write-Host "🚀 Iniciando túnel..." -ForegroundColor Cyan
ngrok http 5000
