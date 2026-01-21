/**
 * Script Node.js para deletar todos os treinos de um usuário
 * 
 * Uso: node scripts/delete-user-workouts.js <email>
 * Exemplo: node scripts/delete-user-workouts.js paciente@Teste.com
 */

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
  console.log('Uso: node scripts/delete-user-workouts.js <email>')
  console.log('Exemplo: node scripts/delete-user-workouts.js paciente@Teste.com')
  process.exit(1)
}

async function deleteUserWorkouts() {
  try {
    console.log(`🔍 Buscando usuário com email: ${email}`)
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      console.error(`❌ Usuário com email ${email} não encontrado`)
      process.exit(1)
    }

    console.log(`✅ Usuário encontrado: ${user.name || user.email} (ID: ${user.id})`)

    // Contar treinos antes
    const prescricoesCount = await prisma.prescricaoTreino.count({
      where: { pacienteId: user.id }
    })

    const treinosExecutadosCount = await prisma.treinoExecutado.count({
      where: { pacienteId: user.id }
    })

    console.log(`📊 Treinos encontrados:`)
    console.log(`   - Prescrições: ${prescricoesCount}`)
    console.log(`   - Treinos executados: ${treinosExecutadosCount}`)

    if (prescricoesCount === 0 && treinosExecutadosCount === 0) {
      console.log('✅ Nenhum treino encontrado para deletar')
      process.exit(0)
    }

    // Deletar treinos executados primeiro
    if (treinosExecutadosCount > 0) {
      const deletedTreinosExecutados = await prisma.treinoExecutado.deleteMany({
        where: { pacienteId: user.id }
      })
      console.log(`✅ ${deletedTreinosExecutados.count} treino(s) executado(s) deletado(s)`)
    }

    // Deletar prescrições de treino (isso vai deletar automaticamente as divisões e itens em cascata)
    if (prescricoesCount > 0) {
      const deletedPrescricoes = await prisma.prescricaoTreino.deleteMany({
        where: { pacienteId: user.id }
      })
      console.log(`✅ ${deletedPrescricoes.count} prescrição(ões) de treino deletada(s)`)
    }

    // Verificar se foi deletado
    const prescricoesRemaining = await prisma.prescricaoTreino.count({
      where: { pacienteId: user.id }
    })

    const treinosExecutadosRemaining = await prisma.treinoExecutado.count({
      where: { pacienteId: user.id }
    })

    if (prescricoesRemaining === 0 && treinosExecutadosRemaining === 0) {
      console.log('✅ Todos os treinos foram deletados com sucesso!')
    } else {
      console.warn(`⚠️  Ainda restam ${prescricoesRemaining} prescrições e ${treinosExecutadosRemaining} treinos executados`)
    }

  } catch (error) {
    console.error('❌ Erro ao deletar treinos:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

deleteUserWorkouts()
