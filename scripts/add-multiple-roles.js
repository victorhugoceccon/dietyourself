import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addMultipleRoles() {
  try {
    const email = 'victorhugoceccon@gmail.com'
    
    // Primeiro, adicionar a coluna roles se não existir
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT`
      console.log('✅ Coluna roles adicionada ao banco de dados (se não existia)')
    } catch (error) {
      // Ignorar erro se a coluna já existir
      if (!error.message.includes('already exists')) {
        console.log('⚠️ Aviso ao adicionar coluna:', error.message)
      }
    }
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true }
    })

    if (!user) {
      console.log('❌ Usuário não encontrado:', email)
      return
    }

    console.log('✅ Usuário encontrado:', user)

    // Definir múltiplas roles
    const roles = ['ADMIN', 'NUTRICIONISTA', 'PERSONAL', 'PACIENTE']
    const rolesJson = JSON.stringify(roles)

    // Atualizar usuário usando $executeRaw para evitar problemas com schema
    await prisma.$executeRaw`
      UPDATE users 
      SET roles = ${rolesJson}, role = 'ADMIN'
      WHERE id = ${user.id}
    `

    console.log('✅ Roles atualizadas com sucesso!')
    
    // Buscar usuário atualizado
    const updatedUser = await prisma.$queryRaw`
      SELECT id, email, name, role, roles 
      FROM users 
      WHERE id = ${user.id}
    `

    console.log('📋 Usuário atualizado:')
    console.log('  - Email:', updatedUser[0].email)
    console.log('  - Nome:', updatedUser[0].name)
    console.log('  - Role principal:', updatedUser[0].role)
    console.log('  - Roles (JSON):', updatedUser[0].roles)
    
    if (updatedUser[0].roles) {
      try {
        const parsedRoles = JSON.parse(updatedUser[0].roles)
        console.log('  - Roles (array):', parsedRoles)
      } catch (e) {
        console.log('  - Erro ao parsear roles:', e.message)
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

addMultipleRoles()

