// Script para apagar dieta na VPS - pode ser rodado remotamente
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteDiet() {
  const email = process.argv[2] || 'maria@teste.com'
  
  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log(`❌ Usuário ${email} não encontrado`)
      return
    }

    console.log('✅ Usuário encontrado:', user.email, '(ID:', user.id, ')')

    // Apagar refeições consumidas primeiro
    const deletedMeals = await prisma.consumedMeal.deleteMany({
      where: { userId: user.id }
    })
    console.log(`🗑️  Refeições consumidas apagadas: ${deletedMeals.count}`)

    // Apagar dieta do usuário
    const deleted = await prisma.dieta.deleteMany({
      where: { userId: user.id }
    })

    console.log('✅ Dieta apagada! Total de registros apagados:', deleted.count)
    console.log('')
    console.log('Agora você pode gerar uma nova dieta para testar!')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteDiet()
