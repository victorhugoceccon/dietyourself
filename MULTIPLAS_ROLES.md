# Sistema de Múltiplas Roles - Proposta de Implementação

## Objetivo
Permitir que um usuário tenha múltiplas roles (ADMIN, NUTRICIONISTA, PERSONAL, PACIENTE) e possa visualizar todas as páginas correspondentes.

## Solução Proposta

### 1. Modificação do Schema do Banco de Dados
- Alterar o campo `role` de `String` para `String[]` (array) ou usar JSON
- Manter compatibilidade com dados existentes

### 2. Componente de Seletor de Role
- Criar um componente `RoleSelector` que aparece no header
- Permite alternar entre as roles disponíveis do usuário
- Salva a role selecionada no localStorage como `currentRole`

### 3. Modificação das Verificações de Role
- Criar função `hasRole(user, role)` que verifica se o usuário tem a role
- Modificar todas as verificações para usar essa função
- Permitir acesso se o usuário tiver qualquer uma das roles necessárias

### 4. Dashboard Principal
- Criar um componente `Dashboard` que mostra cards para cada role disponível
- Permite navegação rápida entre as diferentes áreas
- Mostra apenas as áreas que o usuário tem acesso

## Implementação

### Passo 1: Atualizar Schema do Prisma
```prisma
model User {
  // ... outros campos
  role        String   @default("PACIENTE") // Role principal (compatibilidade)
  roles       String?  // JSON array de roles: ["ADMIN", "NUTRICIONISTA", "PERSONAL", "PACIENTE"]
  // ...
}
```

### Passo 2: Criar Utilitários de Role
- `hasRole(user, role)` - verifica se usuário tem a role
- `getUserRoles(user)` - retorna array de roles do usuário
- `canAccess(user, requiredRoles)` - verifica se pode acessar baseado em roles

### Passo 3: Criar Componente RoleSelector
- Dropdown no header mostrando roles disponíveis
- Alterna entre roles e salva no localStorage
- Atualiza a interface baseado na role selecionada

### Passo 4: Modificar Componentes Existentes
- Atualizar verificações de role em todos os componentes
- Usar `hasRole` em vez de comparação direta
- Permitir acesso se tiver qualquer role necessária

### Passo 5: Criar Dashboard Principal
- Componente que mostra cards para cada área disponível
- Navegação rápida entre áreas
- Visualização unificada de todas as funcionalidades








