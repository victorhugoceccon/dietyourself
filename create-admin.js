import prisma from './server/config/database.js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

async function createAdmin() {
  try {
    console.log('🔐 Criando usuário administrador...\n')

    const userData = {
      email: 'admin@dietyourself.com',
      password: 'Air@Jordan@2022',
      name: 'Administrador',
      role: 'ADMIN'
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      console.log('⚠️  Usuário já existe! Atualizando senha...')
      
      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      
      // Atualizar usuário para ser admin e atualizar senha
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          name: userData.name
        }
      })

      console.log('✅ Usuário atualizado com sucesso!\n')
      console.log('📋 Dados do usuário:')
      console.log(`   ID: ${updatedUser.id}`)
      console.log(`   Email: ${updatedUser.email}`)
      console.log(`   Nome: ${updatedUser.name}`)
      console.log(`   Role: ${updatedUser.role}`)
      console.log(`   Senha: ${userData.password}`)
      console.log('\n💡 Você pode usar essas credenciais para fazer login!')
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

    console.log('✅ Usuário administrador criado com sucesso!\n')
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

createAdmin()


