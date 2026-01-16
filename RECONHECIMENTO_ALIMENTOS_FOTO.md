# Reconhecimento de Alimentos por Foto

## 📸 Funcionalidade

Sistema que permite ao paciente tirar uma foto de um prato de comida e receber automaticamente:
- Identificação dos alimentos presentes
- Cálculo de calorias totais
- Distribuição de macronutrientes (proteína, carboidrato, gordura)
- Registro automático no tracking diário

## 🎯 Onde Encaixa no App

1. **Dashboard Nutricional** (`NutritionDashboard.jsx`)
   - Botão "Adicionar refeição por foto" no header
   - Permite registrar alimentos extras não planejados

2. **Página de Dieta** (`DietaMobileView.jsx`)
   - Botão flutuante para registrar refeições não planejadas
   - Facilita o registro durante as refeições

## 🏗️ Arquitetura

### Frontend
- Componente `PhotoMealCapture.jsx` com:
  - Preview da câmera
  - Botão de captura
  - Loading durante processamento
  - Exibição de resultados
  - Opção de confirmar ou refazer

### Backend
- Rota `/api/photo-meals/analyze` que:
  - Recebe foto em base64
  - Valida se é um prato de comida
  - Usa OpenAI Vision API para identificar alimentos
  - Calcula calorias e macros
  - Salva no banco como `PhotoMeal`

### Validação
- O agente IA é instruído a:
  - **APENAS** processar pratos de comida
  - Rejeitar qualquer outra coisa (pessoas, objetos, animais, etc.)
  - Retornar mensagem clara quando não for comida

## 📊 Modelo de Dados

### PhotoMeal
```prisma
model PhotoMeal {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  // Foto original
  photoUrl      String   // base64 da foto
  
  // Análise da IA
  alimentos     String   // JSON: [{ nome, quantidade, kcal, macros }]
  totalKcal     Float
  totalProtein  Float
  totalCarbs    Float
  totalFat      Float
  
  // Metadados
  consumedDate  DateTime @default(now())
  mealName      String?  // Nome da refeição (ex: "Almoço extra")
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## 🔄 Fluxo de Uso

1. Usuário clica em "Adicionar refeição por foto"
2. Abre modal com preview da câmera
3. Usuário posiciona o prato e tira foto
4. Foto é enviada para `/api/photo-meals/analyze`
5. Backend valida se é comida (se não for, retorna erro)
6. IA identifica alimentos e calcula valores
7. Resultado é exibido para confirmação
8. Usuário confirma e refeição é salva
9. Dashboard é atualizado automaticamente

## 🛠️ Tecnologias

- **OpenAI Vision API**: Para análise de imagens
- **React**: Componente de câmera
- **Prisma**: Modelo PhotoMeal
- **Express**: Rota de processamento

## 📝 Prompt da IA

O prompt enviado para OpenAI inclui:
- Instrução para identificar apenas pratos de comida
- Rejeitar qualquer outra coisa
- Calcular calorias e macros com precisão
- Retornar estrutura JSON padronizada

## ⚠️ Validações

- Foto deve ser de um prato de comida
- Se não for comida, retorna erro específico
- Limite de tamanho de foto (5MB)
- Rate limiting para evitar abuso

## 🚀 Próximos Passos

1. Executar migração do Prisma
2. Configurar OpenAI API Key no .env
3. Testar com diferentes tipos de pratos
4. Ajustar prompt conforme necessário
5. Adicionar histórico de refeições por foto
