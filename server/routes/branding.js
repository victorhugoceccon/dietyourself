import express from 'express'
import { z } from 'zod'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

const isDataImage = (value) =>
  typeof value === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/.test(value)

const isHttpUrl = (value) => {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const imageStringSchema = z
  .string()
  .max(3 * 1024 * 1024, 'Imagem muito grande. Máximo de 3MB.')
  .refine((v) => isHttpUrl(v) || isDataImage(v), {
    message: 'Imagem deve ser uma URL http(s) ou base64 (data:image/*)'
  })

// Schema de validação para atualizar branding
const updateBrandingSchema = z.object({
  logoUrl: imageStringSchema.optional().nullable(),
  bannerUrl: imageStringSchema.optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  brandName: z.string().optional().nullable(),
  professionalSettings: z.string().optional().nullable(), // JSON string
  patientSettings: z.string().optional().nullable() // JSON string
})

// GET /api/branding - Obter configurações de branding do usuário atual
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId

    // Verificar se é personal trainer ou nutricionista
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        role: true,
        roles: true
      }
    })

    const userRoles = user?.roles ? JSON.parse(user.roles) : []
    const hasProfessionalRole = user?.role === 'PERSONAL' || 
                                 user?.role === 'NUTRICIONISTA' || 
                                 user?.role === 'ADMIN' ||
                                 userRoles.includes('PERSONAL') ||
                                 userRoles.includes('NUTRICIONISTA')

    if (!hasProfessionalRole) {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas personal trainers e nutricionistas podem gerenciar branding.' 
      })
    }

    const branding = await prisma.brandingSettings.findUnique({
      where: { userId }
    })

    if (!branding) {
      return res.json({ branding: null })
    }

    // Parse JSON strings se existirem
    const brandingData = {
      ...branding,
      professionalSettings: branding.professionalSettings 
        ? JSON.parse(branding.professionalSettings) 
        : null,
      patientSettings: branding.patientSettings 
        ? JSON.parse(branding.patientSettings) 
        : null
    }

    res.json({ branding: brandingData })
  } catch (error) {
    console.error('Erro ao buscar branding:', error)
    res.status(500).json({ error: 'Erro ao buscar configurações de branding' })
  }
})

// GET /api/branding/:userId - Obter configurações de branding de um profissional específico
// Usado pelos pacientes para ver o branding do seu personal/nutricionista
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user.userId

    // Verificar se o usuário atual tem acesso (é paciente deste profissional)
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        personalId: true,
        nutricionistaId: true
      }
    })

    // Verificar se é paciente deste profissional ou admin
    const isPaciente = currentUser?.personalId === userId || 
                       currentUser?.nutricionistaId === userId ||
                       req.user.role === 'ADMIN'

    if (!isPaciente && currentUserId !== userId) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você não tem permissão para ver essas configurações.' 
      })
    }

    const branding = await prisma.brandingSettings.findUnique({
      where: { userId }
    })

    if (!branding) {
      return res.json({ branding: null })
    }

    // Parse JSON strings se existirem
    const brandingData = {
      ...branding,
      professionalSettings: branding.professionalSettings 
        ? JSON.parse(branding.professionalSettings) 
        : null,
      patientSettings: branding.patientSettings 
        ? JSON.parse(branding.patientSettings) 
        : null
    }

    res.json({ branding: brandingData })
  } catch (error) {
    console.error('Erro ao buscar branding:', error)
    res.status(500).json({ error: 'Erro ao buscar configurações de branding' })
  }
})

// PUT /api/branding - Criar ou atualizar configurações de branding
router.put('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId

    // Verificar se é personal trainer ou nutricionista
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        role: true,
        roles: true
      }
    })

    const userRoles = user?.roles ? JSON.parse(user.roles) : []
    const hasProfessionalRole = user?.role === 'PERSONAL' || 
                                 user?.role === 'NUTRICIONISTA' || 
                                 user?.role === 'ADMIN' ||
                                 userRoles.includes('PERSONAL') ||
                                 userRoles.includes('NUTRICIONISTA')

    if (!hasProfessionalRole) {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas personal trainers e nutricionistas podem gerenciar branding.' 
      })
    }

    // Validar dados
    const validatedData = updateBrandingSchema.parse(req.body)

    // Converter objetos JSON para strings se necessário
    const dataToSave = {
      ...validatedData,
      professionalSettings: validatedData.professionalSettings 
        ? (typeof validatedData.professionalSettings === 'string' 
            ? validatedData.professionalSettings 
            : JSON.stringify(validatedData.professionalSettings))
        : null,
      patientSettings: validatedData.patientSettings 
        ? (typeof validatedData.patientSettings === 'string' 
            ? validatedData.patientSettings 
            : JSON.stringify(validatedData.patientSettings))
        : null
    }

    // Criar ou atualizar branding
    const branding = await prisma.brandingSettings.upsert({
      where: { userId },
      update: dataToSave,
      create: {
        userId,
        ...dataToSave
      }
    })

    // Parse JSON strings para resposta
    const brandingData = {
      ...branding,
      professionalSettings: branding.professionalSettings 
        ? JSON.parse(branding.professionalSettings) 
        : null,
      patientSettings: branding.patientSettings 
        ? JSON.parse(branding.patientSettings) 
        : null
    }

    res.json({ 
      message: 'Configurações de branding atualizadas com sucesso',
      branding: brandingData 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors 
      })
    }
    console.error('Erro ao atualizar branding:', error)
    res.status(500).json({ error: 'Erro ao atualizar configurações de branding' })
  }
})

export default router





