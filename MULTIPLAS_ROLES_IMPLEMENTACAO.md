# Sistema de Múltiplas Roles - Implementação Completa

## ✅ O que foi implementado

### 1. Utilitários de Role (`src/utils/roleUtils.js`)
Criado arquivo com funções para trabalhar com múltiplas roles:
- `getUserRoles(user)` - Obtém todas as roles do usuário (suporta role única ou array JSON)
- `hasRole(user, role)` - Verifica se o usuário tem uma role específica
- `hasAnyRole(user, requiredRoles)` - Verifica se tem qualquer uma das roles necessárias
- `hasAllRoles(user, requiredRoles)` - Verifica se tem todas as roles necessárias
- `getCurrentRole(user)` - Obtém a role atual (do localStorage ou primeira disponível)
- `setCurrentRole(role)` - Define a role atual no localStorage
- `getRoleInfo(role)` - Obtém informações sobre uma role (nome, path, ícone, cor)

### 2. Componente RoleSelector (`src/components/RoleSelector.jsx` + `.css`)
- Dropdown no header mostrando todas as roles disponíveis
- Alterna entre roles e salva no localStorage
- Navega automaticamente para a área correspondente
- Mostra apenas se o usuário tiver múltiplas roles
- Design responsivo e suporte a dark mode

### 3. Atualização do Nutricionista
- Usa `hasAnyRole` para verificar acesso (permite ADMIN ou NUTRICIONISTA)
- Integrado com RoleSelector no header

### 4. Atualização do roleRedirect
- Agora aceita objeto de usuário completo
- Usa `getCurrentRole` para determinar para onde redirecionar

## 📋 Próximos Passos para Completar

### 1. Atualizar Schema do Banco de Dados
Adicionar campo `roles` no schema do Prisma:

```prisma
model User {
  // ... campos existentes
  role        String   @default("PACIENTE") // Role principal (compatibilidade)
  roles       String?  // JSON array: ["ADMIN", "NUTRICIONISTA", "PERSONAL", "PACIENTE"]
  // ...
}
```

Depois executar:
```bash
npx prisma migrate dev --name add_multiple_roles
npx prisma generate
```

### 2. Atualizar Backend
- Modificar rotas de autenticação para retornar `roles` quando disponível
- Atualizar middleware para verificar múltiplas roles usando `hasAnyRole`
- Criar endpoint para atualizar roles de um usuário (apenas admin)

### 3. Atualizar Outros Componentes Frontend
- ✅ Nutricionista - Atualizado
- ⏳ Admin - Atualizar para usar `hasAnyRole(['ADMIN'])`
- ⏳ Personal - Atualizar para usar `hasAnyRole(['PERSONAL', 'ADMIN'])`
- ⏳ Paciente - Atualizar para usar `hasAnyRole(['PACIENTE'])`

### 4. Adicionar RoleSelector nos Outros Componentes
- Adicionar `<RoleSelector user={user} />` no header de Admin, Personal e Paciente

## 🎯 Como Usar

### Para um usuário com múltiplas roles:

1. **No banco de dados**, adicione o campo `roles` como JSON:
   ```sql
   UPDATE users SET roles = '["ADMIN", "NUTRICIONISTA", "PERSONAL", "PACIENTE"]' WHERE email = 'usuario@exemplo.com';
   ```

2. **No frontend**, o RoleSelector aparecerá automaticamente no header
3. **O usuário pode alternar** entre as roles clicando no seletor
4. **A navegação** acontece automaticamente para a área correspondente

### Compatibilidade
- ✅ Funciona com role única (campo `role`) - compatibilidade total
- ✅ Funciona com múltiplas roles (campo `roles` JSON)
- ✅ Se não tiver múltiplas roles, o seletor não aparece

## 📝 Exemplo de Uso

```javascript
import { hasAnyRole, getUserRoles, getCurrentRole } from '../utils/roleUtils'

// Verificar se usuário tem acesso
if (hasAnyRole(user, ['NUTRICIONISTA', 'ADMIN'])) {
  // Permitir acesso
}

// Obter todas as roles
const roles = getUserRoles(user) // ['ADMIN', 'NUTRICIONISTA', 'PERSONAL', 'PACIENTE']

// Obter role atual
const currentRole = getCurrentRole(user) // 'ADMIN'
```








