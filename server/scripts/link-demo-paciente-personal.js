import prisma from '../config/database.js'

async function main() {
  try {
    // Personal de teste (pega o primeiro PERSONAL que encontrar)
    const personal = await prisma.user.findFirst({
      where: { role: 'PERSONAL' }
    })

    if (!personal) {
      console.error('Nenhum usuário com role PERSONAL encontrado.')
      return
    }

    // Paciente demo
    const paciente = await prisma.user.findUnique({
      where: { email: 'demo@dietyourself.com' }
    })

    if (!paciente) {
      console.error('Paciente demo com email demo@dietyourself.com não encontrado.')
      return
    }

    // Atualiza o paciente para apontar para esse personal
    const updated = await prisma.user.update({
      where: { id: paciente.id },
      data: {
        personalId: personal.id
      }
    })

    console.log('Paciente demo atualizado com sucesso:')
    console.log({
      pacienteEmail: updated.email,
      personalId: updated.personalId
    })
  } catch (error) {
    console.error('Erro ao vincular paciente demo ao personal:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()



