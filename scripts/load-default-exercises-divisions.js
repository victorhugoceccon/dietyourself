import { PrismaClient } from '@prisma/client'
import { ensureDefaultExercicios, ensureDefaultDivisoes } from '../server/utils/personalDefaults.js'

const prisma = new PrismaClient()

async function loadDefaults() {
  try {
    const email = 'victorhugoceccon@gmail.com'
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, roles: true }
    })

    if (!user) {
      console.log('❌ Usuário não encontrado:', email)
      return
    }

    console.log('✅ Usuário encontrado:', user)

    // Verificar se tem role de PERSONAL
    let isPersonal = false
    
    // Verificar role principal
    if (user.role === 'PERSONAL') {
      isPersonal = true
    }
    
    // Verificar roles múltiplas
    if (user.roles) {
      try {
        const roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles
        if (Array.isArray(roles) && roles.includes('PERSONAL')) {
          isPersonal = true
        }
      } catch (e) {
        console.warn('Erro ao parsear roles:', e)
      }
    }

    if (!isPersonal) {
      console.log('⚠️ Usuário não possui role de PERSONAL. Adicionando role PERSONAL...')
      
      // Adicionar role PERSONAL
      const currentRoles = user.roles ? (typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles) : []
      if (!currentRoles.includes('PERSONAL')) {
        currentRoles.push('PERSONAL')
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          roles: JSON.stringify(currentRoles),
          role: 'PERSONAL' // Definir como role principal também
        }
      })
      
      console.log('✅ Role PERSONAL adicionada!')
    }

    console.log('📋 Criando exercícios padrões...')
    await ensureDefaultExercicios(user.id)
    console.log('✅ Exercícios padrões criados!')

    console.log('📋 Criando divisões de treino padrões...')
    await ensureDefaultDivisoes(user.id)
    console.log('✅ Divisões de treino padrões criadas!')

    // Verificar o que foi criado
    const exerciciosCount = await prisma.exercicio.count({
      where: { personalId: user.id }
    })
    
    const divisoesCount = await prisma.divisaoTreino.count({
      where: { personalId: user.id }
    })

    console.log('\n📊 Resumo:')
    console.log(`  - Exercícios criados: ${exerciciosCount}`)
    console.log(`  - Divisões criadas: ${divisoesCount}`)

    if (divisoesCount > 0) {
      const divisoes = await prisma.divisaoTreino.findMany({
        where: { personalId: user.id },
        include: {
          itens: {
            include: {
              exercicio: {
                select: { nome: true }
              }
            }
          }
        }
      })

      console.log('\n📋 Divisões criadas:')
      divisoes.forEach(div => {
        console.log(`  - ${div.nome} (${div.itens.length} exercícios)`)
      })
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

loadDefaults()


