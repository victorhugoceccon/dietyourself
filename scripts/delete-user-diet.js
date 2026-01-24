import prisma from '../server/config/database.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const email = process.argv[2]

if (!email) {
  console.error('❌ Por favor, forneça o email do usuário')
  console.log('Uso: node scripts/delete-user-diet.js <email>')
  process.exit(1)
}

async function deleteUserDiet() {
  try {
    console.log(`🔍 Procurando usuário com email: ${email}`)
    
    // Buscar o usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.error(`❌ Usuário com email ${email} não encontrado`)
      process.exit(1)
    }

    console.log(`✅ Usuário encontrado: ${user.name || user.email} (ID: ${user.id})`)

    // Deletar dieta
    const result = await prisma.dieta.deleteMany({
      where: { userId: user.id }
    })

    if (result.count > 0) {
      console.log(`✅ Dieta deletada com sucesso! (${result.count} registro(s) removido(s))`)
    } else {
      console.log(`ℹ️  Nenhuma dieta encontrada para o usuário ${email}`)
    }

    console.log('✅ Processo concluído!')
  } catch (error) {
    console.error('❌ Erro ao deletar dieta:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

deleteUserDiet()
