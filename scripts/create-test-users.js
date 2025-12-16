import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Função para fazer hash da senha
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

async function createTestUsers() {
  try {
    console.log('🚀 Criando usuários de teste...\n')

    // Usuário Admin com todas as roles
    const adminEmail = 'victorhugoceccon@gmail.com'
    const adminPassword = 'admin123'
    
    const adminExists = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (adminExists) {
      console.log(`✅ Usuário admin já existe: ${adminEmail}`)
      // Atualizar para ter todas as roles
      const updatedAdmin = await prisma.user.update({
        where: { id: adminExists.id },
        data: {
          roles: JSON.stringify(['ADMIN', 'NUTRICIONISTA', 'PERSONAL', 'PACIENTE']),
          role: 'ADMIN'
        }
      })
      console.log(`✅ Roles atualizadas para o admin`)
    } else {
      const hashedAdminPassword = await hashPassword(adminPassword)
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedAdminPassword,
          name: 'Victor Hugo Ceccon',
          role: 'ADMIN',
          roles: JSON.stringify(['ADMIN', 'NUTRICIONISTA', 'PERSONAL', 'PACIENTE'])
        }
      })
      console.log(`✅ Admin criado: ${adminEmail} / ${adminPassword}`)
    }

    // Nutricionista de teste
    const nutricionistaEmail = 'nutricionista@teste.com'
    const nutricionistaPassword = 'nutri123'
    
    let nutricionista = await prisma.user.findUnique({
      where: { email: nutricionistaEmail }
    })

    if (!nutricionista) {
      const hashedNutriPassword = await hashPassword(nutricionistaPassword)
      nutricionista = await prisma.user.create({
        data: {
          email: nutricionistaEmail,
          password: hashedNutriPassword,
          name: 'Nutricionista Teste',
          role: 'NUTRICIONISTA',
          roles: JSON.stringify(['NUTRICIONISTA'])
        }
      })
      console.log(`✅ Nutricionista criado: ${nutricionistaEmail} / ${nutricionistaPassword}`)
    } else {
      console.log(`✅ Nutricionista já existe: ${nutricionistaEmail}`)
    }

    // Personal Trainer de teste
    const personalEmail = 'personal@teste.com'
    const personalPassword = 'personal123'
    
    let personal = await prisma.user.findUnique({
      where: { email: personalEmail }
    })

    if (!personal) {
      const hashedPersonalPassword = await hashPassword(personalPassword)
      personal = await prisma.user.create({
        data: {
          email: personalEmail,
          password: hashedPersonalPassword,
          name: 'Personal Trainer Teste',
          role: 'PERSONAL',
          roles: JSON.stringify(['PERSONAL'])
        }
      })
      console.log(`✅ Personal criado: ${personalEmail} / ${personalPassword}`)
    } else {
      console.log(`✅ Personal já existe: ${personalEmail}`)
    }

    // Paciente de teste vinculado ao nutricionista
    const pacienteEmail = 'paciente@teste.com'
    const pacientePassword = 'paciente123'
    
    let paciente = await prisma.user.findUnique({
      where: { email: pacienteEmail }
    })

    if (!paciente) {
      const hashedPacientePassword = await hashPassword(pacientePassword)
      paciente = await prisma.user.create({
        data: {
          email: pacienteEmail,
          password: hashedPacientePassword,
          name: 'Paciente Teste',
          role: 'PACIENTE',
          roles: JSON.stringify(['PACIENTE']),
          nutricionistaId: nutricionista.id,
          personalId: personal.id
        }
      })
      console.log(`✅ Paciente criado: ${pacienteEmail} / ${pacientePassword}`)
      console.log(`   Vinculado ao nutricionista: ${nutricionista.email}`)
      console.log(`   Vinculado ao personal: ${personal.email}`)
    } else {
      console.log(`✅ Paciente já existe: ${pacienteEmail}`)
      // Atualizar vínculos se necessário
      if (!paciente.nutricionistaId || !paciente.personalId) {
        await prisma.user.update({
          where: { id: paciente.id },
          data: {
            nutricionistaId: nutricionista.id,
            personalId: personal.id
          }
        })
        console.log(`✅ Vínculos atualizados para o paciente`)
      }
    }

    // Paciente 2 de teste (sem vínculos)
    const paciente2Email = 'paciente2@teste.com'
    const paciente2Password = 'paciente123'
    
    let paciente2 = await prisma.user.findUnique({
      where: { email: paciente2Email }
    })

    if (!paciente2) {
      const hashedPaciente2Password = await hashPassword(paciente2Password)
      paciente2 = await prisma.user.create({
        data: {
          email: paciente2Email,
          password: hashedPaciente2Password,
          name: 'Paciente 2 Teste',
          role: 'PACIENTE',
          roles: JSON.stringify(['PACIENTE'])
        }
      })
      console.log(`✅ Paciente 2 criado: ${paciente2Email} / ${paciente2Password}`)
    } else {
      console.log(`✅ Paciente 2 já existe: ${paciente2Email}`)
    }

    console.log('\n✅ Todos os usuários de teste foram criados/atualizados!')
    console.log('\n📋 Resumo dos usuários:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 Admin:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Senha: ${adminPassword}`)
    console.log(`   Roles: ADMIN, NUTRICIONISTA, PERSONAL, PACIENTE`)
    console.log('\n👤 Nutricionista:')
    console.log(`   Email: ${nutricionistaEmail}`)
    console.log(`   Senha: ${nutricionistaPassword}`)
    console.log('\n👤 Personal Trainer:')
    console.log(`   Email: ${personalEmail}`)
    console.log(`   Senha: ${personalPassword}`)
    console.log('\n👤 Paciente (vinculado):')
    console.log(`   Email: ${pacienteEmail}`)
    console.log(`   Senha: ${pacientePassword}`)
    console.log(`   Nutricionista: ${nutricionista.email}`)
    console.log(`   Personal: ${personal.email}`)
    console.log('\n👤 Paciente 2 (sem vínculos):')
    console.log(`   Email: ${paciente2Email}`)
    console.log(`   Senha: ${paciente2Password}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Erro ao criar usuários de teste:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()
  .then(() => {
    console.log('✨ Script executado com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  })

