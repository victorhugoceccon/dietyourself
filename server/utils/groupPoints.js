import prisma from '../config/database.js'

function pointsForCheckIn(adherence) {
  if (adherence === 'TOTAL') return { tipo: 'CHECKIN_TOTAL', pontos: 10 }
  if (adherence === 'PARCIAL') return { tipo: 'CHECKIN_PARCIAL', pontos: 5 }
  return { tipo: 'CHECKIN_NAO_SEGUIU', pontos: 0 }
}

function pointsForWorkout(completouTreino) {
  if (completouTreino) return { tipo: 'TREINO_COMPLETO', pontos: 20 }
  return { tipo: 'TREINO_INCOMPLETO', pontos: 10 }
}

async function getActiveGroupIdsForUser(userId) {
  const memberships = await prisma.grupoMembro.findMany({
    where: {
      userId,
      grupo: { ativo: true }
    },
    select: { grupoId: true }
  })

  return memberships.map(m => m.grupoId)
}

export async function upsertCheckInPointsEvent({ userId, checkIn }) {
  const grupoIds = await getActiveGroupIdsForUser(userId)
  if (grupoIds.length === 0) return { updated: 0 }

  const { tipo, pontos } = pointsForCheckIn(checkIn.adherence)

  let updated = 0
  for (const grupoId of grupoIds) {
    await prisma.grupoPontosEvento.upsert({
      where: {
        grupoId_referenciaTipo_referenciaId: {
          grupoId,
          referenciaTipo: 'DAILY_CHECKIN',
          referenciaId: checkIn.id
        }
      },
      create: {
        grupoId,
        userId,
        tipo,
        pontos,
        referenciaTipo: 'DAILY_CHECKIN',
        referenciaId: checkIn.id
      },
      update: {
        // Se o usuário editar o check-in, atualiza pontos/tipo
        tipo,
        pontos
      }
    })
    updated++
  }

  return { updated }
}

export async function upsertWorkoutPointsEvent({ userId, treinoExecutadoId, completouTreino }) {
  const grupoIds = await getActiveGroupIdsForUser(userId)
  if (grupoIds.length === 0) return { updated: 0 }

  const { tipo, pontos } = pointsForWorkout(!!completouTreino)

  let updated = 0
  for (const grupoId of grupoIds) {
    await prisma.grupoPontosEvento.upsert({
      where: {
        grupoId_referenciaTipo_referenciaId: {
          grupoId,
          referenciaTipo: 'TREINO_EXECUTADO',
          referenciaId: treinoExecutadoId
        }
      },
      create: {
        grupoId,
        userId,
        tipo,
        pontos,
        referenciaTipo: 'TREINO_EXECUTADO',
        referenciaId: treinoExecutadoId
      },
      update: {
        // Se no futuro permitirmos reabrir treino, mantém consistente
        tipo,
        pontos
      }
    })
    updated++
  }

  return { updated }
}


