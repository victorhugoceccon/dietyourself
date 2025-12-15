import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// GET /api/user/profile - Obter perfil do usuário
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profilePhoto: true,
        motivationalMessage: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    res.json({
      profilePhoto: user.profilePhoto,
      motivationalMessage: user.motivationalMessage
    })

  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    res.status(500).json({ error: 'Erro ao buscar perfil do usuário' })
  }
})

// PATCH /api/user/profile - Atualizar perfil do usuário
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { profilePhoto, motivationalMessage } = req.body

    console.log('📝 PATCH /api/user/profile - Atualizando perfil:', {
      userId,
      hasProfilePhoto: !!profilePhoto,
      hasMotivationalMessage: !!motivationalMessage
    })

    // Validar dados
    if (profilePhoto !== undefined && profilePhoto !== null && typeof profilePhoto !== 'string') {
      return res.status(400).json({ error: 'profilePhoto deve ser uma string (base64)' })
    }

    if (motivationalMessage !== undefined && motivationalMessage !== null && typeof motivationalMessage !== 'string') {
      return res.status(400).json({ error: 'motivationalMessage deve ser uma string' })
    }

    // Validar tamanho da foto (se for base64, limitar a ~2MB)
    if (profilePhoto && profilePhoto.length > 3 * 1024 * 1024) {
      return res.status(400).json({ error: 'Foto muito grande. Máximo de 2MB.' })
    }

    // Validar tamanho da mensagem
    if (motivationalMessage && motivationalMessage.length > 200) {
      return res.status(400).json({ error: 'Mensagem muito longa. Máximo de 200 caracteres.' })
    }

    // Preparar dados para atualização (apenas incluir campos que foram fornecidos)
    const updateData = {}
    if (profilePhoto !== undefined) {
      updateData.profilePhoto = profilePhoto === null ? null : profilePhoto
    }
    if (motivationalMessage !== undefined) {
      updateData.motivationalMessage = motivationalMessage === null || motivationalMessage === '' ? null : motivationalMessage.trim()
    }

    // Se não houver dados para atualizar, retornar sucesso sem fazer update
    if (Object.keys(updateData).length === 0) {
      console.log('⚠️ Nenhuma alteração para salvar')
      return res.json({
        message: 'Nenhuma alteração para salvar',
        profilePhoto: null,
        motivationalMessage: null
      })
    }

    console.log('💾 Dados para atualizar:', updateData)

    // Atualizar usuário
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          profilePhoto: true,
          motivationalMessage: true
        }
      })

      console.log('✅ Perfil atualizado com sucesso:', updatedUser.id)

      res.json({
        message: 'Perfil atualizado com sucesso',
        profilePhoto: updatedUser.profilePhoto,
        motivationalMessage: updatedUser.motivationalMessage
      })
    } catch (prismaError) {
      console.error('❌ Erro no Prisma:', prismaError)
      console.error('❌ Código do erro:', prismaError.code)
      console.error('❌ Meta do erro:', prismaError.meta)
      throw prismaError
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error)
    console.error('❌ Stack trace:', error.stack)
    console.error('❌ Error name:', error.name)
    console.error('❌ Error message:', error.message)
    
    // Verificar se é um erro específico do Prisma
    if (error.code === 'P2009' || error.message?.includes('Unknown argument')) {
      return res.status(500).json({ 
        error: 'Erro: Campos não existem no banco de dados',
        details: 'Execute: npx prisma db push para atualizar o banco de dados'
      })
    }
    
    res.status(500).json({ 
      error: 'Erro ao atualizar perfil do usuário',
      details: error.message || 'Erro desconhecido'
    })
  }
})

export default router

