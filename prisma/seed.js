import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n')

  // Hash da senha padrão (senha: "123456")
  const defaultPassword = await bcrypt.hash('123456', 10)

  // ============================================
  // ADMINISTRADOR
  // ============================================
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lifefit.com' },
    update: {},
    create: {
      email: 'admin@lifefit.com',
      password: defaultPassword,
      name: 'Administrador',
      role: 'ADMIN',
      roles: JSON.stringify(['ADMIN', 'NUTRICIONISTA', 'PERSONAL']),
      motivationalMessage: 'Bem-vindo ao LifeFit!'
    }
  })
  console.log('✅ Admin criado:', admin.email)

  // ============================================
  // NUTRICIONISTA
  // ============================================
  const nutricionista = await prisma.user.upsert({
    where: { email: 'nutricionista@lifefit.com' },
    update: {},
    create: {
      email: 'nutricionista@lifefit.com',
      password: defaultPassword,
      name: 'Dr. Ana Silva',
      role: 'NUTRICIONISTA',
      roles: JSON.stringify(['NUTRICIONISTA']),
      motivationalMessage: 'Sua saúde é nossa prioridade!'
    }
  })
  console.log('✅ Nutricionista criado:', nutricionista.email)

  // ============================================
  // PERSONAL TRAINER
  // ============================================
  const personal = await prisma.user.upsert({
    where: { email: 'personal@lifefit.com' },
    update: {},
    create: {
      email: 'personal@lifefit.com',
      password: defaultPassword,
      name: 'Carlos Personal',
      role: 'PERSONAL',
      roles: JSON.stringify(['PERSONAL']),
      motivationalMessage: 'Vamos alcançar seus objetivos juntos!'
    }
  })
  console.log('✅ Personal criado:', personal.email)

  // ============================================
  // PACIENTE 1
  // ============================================
  const paciente1 = await prisma.user.upsert({
    where: { email: 'paciente@teste.com' },
    update: {},
    create: {
      email: 'paciente@teste.com',
      password: defaultPassword,
      name: 'João Silva',
      role: 'PACIENTE',
      roles: JSON.stringify(['PACIENTE']),
      nutricionistaId: nutricionista.id,
      personalId: personal.id,
      motivationalMessage: 'Você está no caminho certo!'
    }
  })
  console.log('✅ Paciente 1 criado:', paciente1.email)

  // ============================================
  // PACIENTE 2
  // ============================================
  const paciente2 = await prisma.user.upsert({
    where: { email: 'maria@teste.com' },
    update: {},
    create: {
      email: 'maria@teste.com',
      password: defaultPassword,
      name: 'Maria Santos',
      role: 'PACIENTE',
      roles: JSON.stringify(['PACIENTE']),
      nutricionistaId: nutricionista.id,
      personalId: personal.id,
      motivationalMessage: 'Continue firme na sua jornada!'
    }
  })
  console.log('✅ Paciente 2 criado:', paciente2.email)

  // ============================================
  // PACIENTE 3 (teste)
  // ============================================
  const paciente3 = await prisma.user.upsert({
    where: { email: 'teste@teste.com' },
    update: {},
    create: {
      email: 'teste@teste.com',
      password: defaultPassword,
      name: 'Usuário Teste',
      role: 'PACIENTE',
      roles: JSON.stringify(['PACIENTE']),
      nutricionistaId: nutricionista.id,
      motivationalMessage: 'Bem-vindo ao LifeFit!'
    }
  })
  console.log('✅ Paciente 3 criado:', paciente3.email)

  // ============================================
  // QUESTIONÁRIO DE EXEMPLO (Paciente 1)
  // ============================================
  await prisma.questionnaireData.upsert({
    where: { userId: paciente1.id },
    update: {},
    create: {
      userId: paciente1.id,
      idade: 30,
      sexo: 'Masculino',
      altura: 175,
      pesoAtual: 80,
      objetivo: 'Emagrecer',
      frequenciaAtividade: 'Sim, 3–4x por semana',
      tipoAtividade: 'Musculação',
      horarioTreino: 'Tarde',
      rotinaDiaria: 'Moderada',
      quantidadeRefeicoes: '4 refeições',
      preferenciaRefeicoes: 'Um equilíbrio entre simples e variadas',
      confortoPesar: 'Sim, sem problemas',
      tempoPreparacao: 'Médio (10–30 min)',
      preferenciaVariacao: 'Prefiro variedade',
      alimentosDoDiaADia: JSON.stringify([
        'Arroz', 'Feijão', 'Frango', 'Ovos', 'Banana', 'Aveia'
      ]),
      restricaoAlimentar: 'Nenhuma',
      alimentosEvita: '',
      opcoesSubstituicao: 'Sim, gosto de ter opções',
      refeicoesLivres: 'Talvez'
    }
  })
  console.log('✅ Questionário criado para:', paciente1.email)

  console.log('\n✨ Seed concluído com sucesso!')
  console.log('\n📋 Credenciais de acesso:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 Admin:')
  console.log('   Email: admin@lifefit.com')
  console.log('   Senha: 123456')
  console.log('\n🥗 Nutricionista:')
  console.log('   Email: nutricionista@lifefit.com')
  console.log('   Senha: 123456')
  console.log('\n💪 Personal:')
  console.log('   Email: personal@lifefit.com')
  console.log('   Senha: 123456')
  console.log('\n👤 Pacientes:')
  console.log('   Email: paciente@teste.com | Senha: 123456')
  console.log('   Email: maria@teste.com | Senha: 123456')
  console.log('   Email: teste@teste.com | Senha: 123456')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


