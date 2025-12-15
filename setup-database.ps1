# Script PowerShell para configurar o banco de dados PostgreSQL

Write-Host "🔍 Procurando PostgreSQL..." -ForegroundColor Cyan

# Tentar encontrar psql nos caminhos comuns
$pgPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $pgPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        Write-Host "✅ PostgreSQL encontrado em: $path" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL não encontrado nos caminhos comuns." -ForegroundColor Red
    Write-Host ""
    Write-Host "Opções:" -ForegroundColor Yellow
    Write-Host "1. Adicione o PostgreSQL ao PATH do sistema"
    Write-Host "2. Execute manualmente: psql -U postgres -c 'CREATE DATABASE dietyourself;'"
    Write-Host "3. Use o pgAdmin para criar o banco 'dietyourself'"
    Write-Host ""
    Write-Host "Depois de criar o banco, execute: npm run db:migrate"
    exit 1
}

# Solicitar senha do PostgreSQL
Write-Host ""
$pgPassword = Read-Host "Digite a senha do usuário 'postgres' (ou pressione Enter se não tiver senha)"

if ($pgPassword) {
    $env:PGPASSWORD = $pgPassword
}

# Tentar criar o banco
Write-Host ""
Write-Host "📦 Criando banco de dados 'dietyourself'..." -ForegroundColor Cyan

$createDbCommand = "CREATE DATABASE dietyourself;"
try {
    & $psqlPath -U postgres -c $createDbCommand 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Banco de dados criado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Agora execute: npm run db:migrate" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  O banco pode já existir ou houve um erro. Verifique as mensagens acima." -ForegroundColor Yellow
        Write-Host "   Se o banco já existe, você pode prosseguir com: npm run db:migrate" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro ao criar banco de dados: $_" -ForegroundColor Red
    Write-Host "   Tente criar manualmente usando pgAdmin ou psql" -ForegroundColor Yellow
}


