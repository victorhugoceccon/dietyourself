import { PrismaClient } from '@prisma/client'
import { ensureDefaultExercicios, ensureDefaultDivisoes } from '../server/utils/personalDefaults.js'

const prisma = new PrismaClient()

async function loadDefaults() {
  try {
    console.log('🚀 Carregando exercícios e divisões padrões para usuários de teste...\n')

    // Buscar todos os personais
    const personais = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'PERSONAL' },
          { roles: { contains: 'PERSONAL' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    if (personais.length === 0) {
      console.log('⚠️ Nenhum personal trainer encontrado.')
      return
    }

    for (const personal of personais) {
      console.log(`\n📋 Processando: ${personal.email} (${personal.name || 'Sem nome'})`)
      
      try {
        // Verificar se já tem exercícios
        const exerciciosCount = await prisma.exercicio.count({
          where: { personalId: personal.id }
        })

        if (exerciciosCount === 0) {
          console.log('  📝 Criando exercícios padrões...')
          await ensureDefaultExercicios(personal.id)
          console.log('  ✅ Exercícios padrões criados!')
        } else {
          console.log(`  ✅ Já possui ${exerciciosCount} exercícios`)
        }

        // Verificar se já tem divisões
        const divisoesCount = await prisma.divisaoTreino.count({
          where: { personalId: personal.id }
        })

        if (divisoesCount === 0) {
          console.log('  📝 Criando divisões de treino padrões...')
          await ensureDefaultDivisoes(personal.id)
          console.log('  ✅ Divisões padrões criadas!')
        } else {
          console.log(`  ✅ Já possui ${divisoesCount} divisões de treino`)
        }
      } catch (error) {
        console.error(`  ❌ Erro ao processar ${personal.email}:`, error.message)
      }
    }

    console.log('\n✅ Processo concluído!')
  } catch (error) {
    console.error('❌ Erro ao carregar padrões:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

loadDefaults()
  .then(() => {
    console.log('✨ Script executado com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  })

