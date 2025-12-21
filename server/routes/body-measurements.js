import express from 'express'
import prisma from '../config/database.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Listar medidas do paciente (próprio usuário ou profissional)
router.get('/:pacienteId?', authenticate, async (req, res) => {
  try {
    const requesterId = req.user.userId
    const requesterRole = req.user.role?.toUpperCase()
    const { pacienteId } = req.params

    let targetUserId = pacienteId || requesterId

    // Se não é o próprio usuário, verificar se é profissional do paciente
    if (pacienteId && pacienteId !== requesterId) {
      if (!['NUTRICIONISTA', 'PERSONAL', 'ADMIN'].includes(requesterRole)) {
        return res.status(403).json({ error: 'Sem permissão para ver medidas' })
      }

      // Verificar vínculo
      const paciente = await prisma.user.findFirst({
        where: {
          id: pacienteId,
          OR: [
            { nutricionistaId: requesterId },
            { personalId: requesterId }
          ]
        }
      })

      if (!paciente && requesterRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Paciente não vinculado a você' })
      }
    }

    const measurements = await prisma.bodyMeasurement.findMany({
      where: { userId: targetUserId },
      orderBy: { dataRegistro: 'desc' },
      take: 50
    })

    res.json({ measurements })
  } catch (error) {
    console.error('Erro ao listar medidas:', error)
    res.status(500).json({ error: 'Erro ao listar medidas' })
  }
})

// Adicionar nova medida
router.post('/:pacienteId?', authenticate, async (req, res) => {
  try {
    const requesterId = req.user.userId
    const requesterRole = req.user.role?.toUpperCase()
    const { pacienteId } = req.params
    const data = req.body

    let targetUserId = pacienteId || requesterId

    // Se não é o próprio usuário, verificar se é profissional
    if (pacienteId && pacienteId !== requesterId) {
      if (!['NUTRICIONISTA', 'PERSONAL', 'ADMIN'].includes(requesterRole)) {
        return res.status(403).json({ error: 'Sem permissão para adicionar medidas' })
      }

      const paciente = await prisma.user.findFirst({
        where: {
          id: pacienteId,
          OR: [
            { nutricionistaId: requesterId },
            { personalId: requesterId }
          ]
        }
      })

      if (!paciente && requesterRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Paciente não vinculado a você' })
      }
    }

    // Calcular IMC se peso e altura disponíveis
    let imc = data.imc
    if (data.peso && data.altura) {
      const alturaM = data.altura / 100
      imc = parseFloat((data.peso / (alturaM * alturaM)).toFixed(1))
    }

    // Calcular RCQ se cintura e quadril disponíveis
    let rcq = data.rcq
    if (data.cintura && data.quadril) {
      rcq = parseFloat((data.cintura / data.quadril).toFixed(2))
    }

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        userId: targetUserId,
        peso: data.peso,
        percentualGordura: data.percentualGordura,
        massaMagra: data.massaMagra,
        cintura: data.cintura,
        quadril: data.quadril,
        bracoEsquerdo: data.bracoEsquerdo,
        bracoDireito: data.bracoDireito,
        coxaEsquerda: data.coxaEsquerda,
        coxaDireita: data.coxaDireita,
        panturrilhaEsq: data.panturrilhaEsq,
        panturrilhaDir: data.panturrilhaDir,
        peitoral: data.peitoral,
        imc,
        rcq,
        notas: data.notas,
        fotoFrente: data.fotoFrente,
        fotoLateral: data.fotoLateral,
        fotoCostas: data.fotoCostas,
        dataRegistro: data.dataRegistro ? new Date(data.dataRegistro) : new Date()
      }
    })

    res.status(201).json({ measurement })
  } catch (error) {
    console.error('Erro ao criar medida:', error)
    res.status(500).json({ error: 'Erro ao criar medida' })
  }
})

// Atualizar medida
router.patch('/:measurementId', authenticate, async (req, res) => {
  try {
    const requesterId = req.user.userId
    const requesterRole = req.user.role?.toUpperCase()
    const { measurementId } = req.params
    const data = req.body

    // Buscar medida existente
    const existing = await prisma.bodyMeasurement.findUnique({
      where: { id: measurementId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Medida não encontrada' })
    }

    // Verificar permissão
    if (existing.userId !== requesterId && 
        !['NUTRICIONISTA', 'PERSONAL', 'ADMIN'].includes(requesterRole)) {
      return res.status(403).json({ error: 'Sem permissão para editar' })
    }

    // Recalcular IMC e RCQ se necessário
    let imc = data.imc
    let rcq = data.rcq
    
    const peso = data.peso !== undefined ? data.peso : existing.peso
    const cintura = data.cintura !== undefined ? data.cintura : existing.cintura
    const quadril = data.quadril !== undefined ? data.quadril : existing.quadril

    if (cintura && quadril) {
      rcq = parseFloat((cintura / quadril).toFixed(2))
    }

    const measurement = await prisma.bodyMeasurement.update({
      where: { id: measurementId },
      data: {
        ...data,
        imc,
        rcq
      }
    })

    res.json({ measurement })
  } catch (error) {
    console.error('Erro ao atualizar medida:', error)
    res.status(500).json({ error: 'Erro ao atualizar medida' })
  }
})

// Deletar medida
router.delete('/:measurementId', authenticate, async (req, res) => {
  try {
    const requesterId = req.user.userId
    const requesterRole = req.user.role?.toUpperCase()
    const { measurementId } = req.params

    const existing = await prisma.bodyMeasurement.findUnique({
      where: { id: measurementId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Medida não encontrada' })
    }

    // Verificar permissão
    if (existing.userId !== requesterId && 
        !['NUTRICIONISTA', 'PERSONAL', 'ADMIN'].includes(requesterRole)) {
      return res.status(403).json({ error: 'Sem permissão para deletar' })
    }

    await prisma.bodyMeasurement.delete({
      where: { id: measurementId }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar medida:', error)
    res.status(500).json({ error: 'Erro ao deletar medida' })
  }
})

// Estatísticas/comparativo
router.get('/:pacienteId/stats', authenticate, async (req, res) => {
  try {
    const requesterId = req.user.userId
    const { pacienteId } = req.params

    // Buscar primeira e última medida
    const measurements = await prisma.bodyMeasurement.findMany({
      where: { userId: pacienteId },
      orderBy: { dataRegistro: 'asc' }
    })

    if (measurements.length === 0) {
      return res.json({ stats: null })
    }

    const first = measurements[0]
    const last = measurements[measurements.length - 1]

    const calculateChange = (firstVal, lastVal) => {
      if (!firstVal || !lastVal) return null
      return parseFloat((lastVal - firstVal).toFixed(2))
    }

    const stats = {
      totalMeasurements: measurements.length,
      firstDate: first.dataRegistro,
      lastDate: last.dataRegistro,
      pesoInicial: first.peso,
      pesoAtual: last.peso,
      pesoVariacao: calculateChange(first.peso, last.peso),
      gorduraInicial: first.percentualGordura,
      gorduraAtual: last.percentualGordura,
      gorduraVariacao: calculateChange(first.percentualGordura, last.percentualGordura),
      cinturaInicial: first.cintura,
      cinturaAtual: last.cintura,
      cinturaVariacao: calculateChange(first.cintura, last.cintura),
      imcInicial: first.imc,
      imcAtual: last.imc,
      imcVariacao: calculateChange(first.imc, last.imc)
    }

    res.json({ stats })
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error)
    res.status(500).json({ error: 'Erro ao calcular estatísticas' })
  }
})

export default router


