/**
 * Script para listar todos os usuários do banco de dados
 * 
 * Uso: node scripts/list-users.js
 */

import prisma from '../server/config/database.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env') })

async function listUsers() {
  try {
    console.log('🔍 Listando usuários...\n')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados')
      return
    }

    console.log(`✅ ${users.length} usuário(s) encontrado(s):\n`)
    
    for (const user of users) {
      console.log(`📧 Email: ${user.email}`)
      console.log(`   Nome: ${user.name || '(sem nome)'}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   ID: ${user.id}`)
      
      // Contar treinos
      const prescricoesCount = await prisma.prescricaoTreino.count({
        where: { pacienteId: user.id }
      })
      const treinosExecutadosCount = await prisma.treinoExecutado.count({
        where: { pacienteId: user.id }
      })
      
      if (prescricoesCount > 0 || treinosExecutadosCount > 0) {
        console.log(`   Treinos: ${prescricoesCount} prescrições, ${treinosExecutadosCount} executados`)
      }
      
      console.log('')
    }

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error)
    if (error.code === 'P1001') {
      console.error('   ⚠️  Não foi possível conectar ao banco de dados')
      console.error('   Verifique se o PostgreSQL está rodando e se as variáveis de ambiente estão corretas')
    }
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()
