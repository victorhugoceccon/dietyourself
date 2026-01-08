import express from 'express'
import prisma from '../config/database.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Listar templates do nutricionista
router.get('/', authenticate, requireRole(['NUTRICIONISTA', 'ADMIN']), async (req, res) => {
  try {
    const userId = req.user.userId

    const templates = await prisma.dietTemplate.findMany({
      where: {
        OR: [
          { nutricionistaId: userId },
          { isPublic: true }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    // Parse templateData JSON
    const parsedTemplates = templates.map(t => ({
      ...t,
      templateData: t.templateData ? JSON.parse(t.templateData) : null
    }))

    res.json({ templates: parsedTemplates })
  } catch (error) {
    console.error('Erro ao listar templates:', error)
    res.status(500).json({ error: 'Erro ao listar templates' })
  }
})

// Buscar template por ID
router.get('/:templateId', authenticate, requireRole(['NUTRICIONISTA', 'ADMIN']), async (req, res) => {
  try {
    const { templateId } = req.params
    const userId = req.user.userId

    const template = await prisma.dietTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { nutricionistaId: userId },
          { isPublic: true }
        ]
      }
    })

    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' })
    }

    res.json({ 
      template: {
        ...template,
        templateData: template.templateData ? JSON.parse(template.templateData) : null
      }
    })
  } catch (error) {
    console.error('Erro ao buscar template:', error)
    res.status(500).json({ error: 'Erro ao buscar template' })
  }
})

// Criar novo template
router.post('/', authenticate, requireRole(['NUTRICIONISTA', 'ADMIN']), async (req, res) => {
  try {
    const userId = req.user.userId
    const { name, description, objetivo, kcalRange, templateData, isPublic } = req.body

    if (!name || !templateData) {
      return res.status(400).json({ error: 'Nome e dados do template são obrigatórios' })
    }

    const template = await prisma.dietTemplate.create({
      data: {
        nutricionistaId: userId,
        name,
        description,
        objetivo,
        kcalRange,
        templateData: JSON.stringify(templateData),
        isPublic: isPublic || false
      }
    })

    res.status(201).json({ 
      template: {
        ...template,
        templateData: JSON.parse(template.templateData)
      }
    })
  } catch (error) {
    console.error('Erro ao criar template:', error)
    res.status(500).json({ error: 'Erro ao criar template' })
  }
})

// Criar template a partir de dieta existente
router.post('/from-diet/:pacienteId', authenticate, requireRole(['NUTRICIONISTA', 'ADMIN']), async (req, res) => {
  try {
    const userId = req.user.userId
    const { pacienteId } = req.params
    const { name, description, objetivo, isPublic } = req.body

    // Buscar dieta do paciente
    const paciente = await prisma.user.findFirst({
      where: {
        id: pacienteId,
        nutricionistaId: userId
      },
      include: {
        dieta: true
      }
    })

    if (!paciente?.dieta?.dieta) {
      return res.status(404).json({ error: 'Dieta não encontrada' })
    }

    const dietaData = typeof paciente.dieta.dieta === 'string' 
      ? JSON.parse(paciente.dieta.dieta) 
      : paciente.dieta.dieta

    // Calcular range de kcal
    const kcal = dietaData.totalDiaKcal || 0
    const kcalMin = Math.floor(kcal / 100) * 100 - 100
    const kcalMax = Math.ceil(kcal / 100) * 100 + 100
    const kcalRange = `${kcalMin}-${kcalMax}`

    const template = await prisma.dietTemplate.create({
      data: {
        nutricionistaId: userId,
        name: name || `Template de ${paciente.name || paciente.email}`,
        description,
        objetivo: objetivo || dietaData.objetivo,
        kcalRange,
        templateData: JSON.stringify(dietaData),
        isPublic: isPublic || false
      }
    })

    res.status(201).json({ 
      template: {
        ...template,
        templateData: dietaData
      }
    })
  } catch (error) {
    console.error('Erro ao criar template da dieta:', error)
    res.status(500).json({ error: 'Erro ao criar template' })
  }
})

// Atualizar template
router.patch('/:templateId', authenticate, requireRole(['NUTRICIONISTA', 'ADMIN']), async (req, res) => {
  try {
    const userId = req.user.userId
    const { templateId } = req.params
    const { name, description, objetivo, kcalRange, templateData, isPublic } = req.body

    // Verificar se pertence ao nutricionista
    const existing = await prisma.dietTemplate.findFirst({
      where: { id: templateId, nutricionistaId: userId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Template não encontrado ou sem permissão' })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (objetivo !== undefined) updateData.objetivo = objetivo
    if (kcalRange !== undefined) updateData.kcalRange = kcalRange
    if (templateData !== undefined) updateData.templateData = JSON.stringify(templateData)
    if (isPublic !== undefined) updateData.isPublic = isPublic

    const template = await prisma.dietTemplate.update({
      where: { id: templateId },
      data: updateData
    })

    res.json({ 
      template: {
        ...template,
        templateData: template.templateData ? JSON.parse(template.templateData) : null
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar template:', error)
    res.status(500).json({ error: 'Erro ao atualizar template' })
  }
})

// Aplicar template a um paciente
router.post('/:templateId/apply/:pacienteId', authenticate, requireRole(['NUTRICIONISTA', 'ADMIN']), async (req, res) => {
  try {
    const userId = req.user.userId
    const { templateId, pacienteId } = req.params

    // Buscar template
    const template = await prisma.dietTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { nutricionistaId: userId },
          { isPublic: true }
        ]
      }
    })

    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' })
    }

    // Verificar se paciente pertence ao nutricionista
    const paciente = await prisma.user.findFirst({
      where: { id: pacienteId, nutricionistaId: userId }
    })

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente não encontrado' })
    }

    const templateData = JSON.parse(template.templateData)

    // Criar ou atualizar dieta do paciente
    const dieta = await prisma.dieta.upsert({
      where: { userId: pacienteId },
      create: {
        userId: pacienteId,
        dieta: JSON.stringify(templateData),
        necessidadesNutricionais: JSON.stringify({
          kcal: templateData.totalDiaKcal || 0,
          proteinas_g: templateData.macrosDia?.proteina_g || 0,
          carboidratos_g: templateData.macrosDia?.carbo_g || 0,
          gorduras_g: templateData.macrosDia?.gordura_g || 0
        })
      },
      update: {
        dieta: JSON.stringify(templateData),
        necessidadesNutricionais: JSON.stringify({
          kcal: templateData.totalDiaKcal || 0,
          proteinas_g: templateData.macrosDia?.proteina_g || 0,
          carboidratos_g: templateData.macrosDia?.carbo_g || 0,
          gorduras_g: templateData.macrosDia?.gordura_g || 0
        })
      }
    })

    // Incrementar contador de uso
    await prisma.dietTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } }
    })

    res.json({ 
      success: true, 
      message: 'Template aplicado com sucesso',
      dieta: {
        ...dieta,
        dieta: templateData
      }
    })
  } catch (error) {
    console.error('Erro ao aplicar template:', error)
    res.status(500).json({ error: 'Erro ao aplicar template' })
  }
})

// Deletar template
router.delete('/:templateId', authenticate, requireRole(['NUTRICIONISTA', 'ADMIN']), async (req, res) => {
  try {
    const userId = req.user.userId
    const { templateId } = req.params

    // Verificar se pertence ao nutricionista
    const existing = await prisma.dietTemplate.findFirst({
      where: { id: templateId, nutricionistaId: userId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Template não encontrado ou sem permissão' })
    }

    await prisma.dietTemplate.delete({
      where: { id: templateId }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar template:', error)
    res.status(500).json({ error: 'Erro ao deletar template' })
  }
})

export default router


