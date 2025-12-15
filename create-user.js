/**
 * Script para criar usuários de teste
 * Execute: node create-user.js
 */

import bcrypt from 'bcryptjs'
import prisma from './server/config/database.js'
import dotenv from 'dotenv'

dotenv.config()

async function createUser() {
  try {
    console.log('🔐 Criando usuário de teste...\n')

    // Dados do usuário (você pode modificar)
    // Para criar múltiplos usuários, execute o script várias vezes mudando os dados
    const userData = {
      email: 'demo@dietyourself.com',
      password: 'demo123',
      name: 'Usuário Demo',
      role: 'PACIENTE' // PACIENTE, NUTRICIONISTA ou ADMIN
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      console.log('⚠️  Usuário já existe!')
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Role: ${existingUser.role}`)
      return
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role
      }
    })

    console.log('✅ Usuário criado com sucesso!\n')
    console.log('📋 Dados do usuário:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Nome: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Senha: ${userData.password}`)
    console.log('\n💡 Você pode usar essas credenciais para fazer login!')

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()

