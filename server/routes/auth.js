import express from 'express'
import { z } from 'zod'
import prisma from '../config/database.js'
import { hashPassword, comparePassword } from '../utils/hash.js'
import { generateToken, verifyToken } from '../utils/jwt.js'

const router = express.Router()

// Schema de validação para registro
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'NUTRICIONISTA', 'PACIENTE']).optional()
})

// Schema de validação para login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
})

// Schema de validação para solicitar reset de senha
const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
})

// Schema de validação para resetar senha
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres')
})

// Rota de registro
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body)
    
    // Normalizar email para lowercase
    const normalizedEmail = validatedData.email.toLowerCase().trim()
    
    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' })
    }

    // Hash da senha
    const hashedPassword = await hashPassword(validatedData.password)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role || 'PACIENTE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    // Gerar token
    const token = generateToken(user.id, user.email, user.role)

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user,
      token
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    
    console.error('Erro ao registrar:', error)
    res.status(500).json({ error: 'Erro ao criar usuário' })
  }
})

// Rota de login
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body)
    
    // Normalizar email para lowercase
    const normalizedEmail = validatedData.email.toLowerCase().trim()

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roles: true,
        password: true
      }
    })

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }

    // Verificar se a senha existe
    if (!user.password) {
      console.error('Usuário sem senha:', user.email)
      return res.status(500).json({ error: 'Erro de configuração: usuário sem senha' })
    }

    // Verificar senha
    const isPasswordValid = await comparePassword(validatedData.password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }

    // Gerar token
    const token = generateToken(user.id, user.email, user.role)

    // Parse roles se existir
    let roles = null
    if (user.roles) {
      try {
        roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles
      } catch (e) {
        console.warn('Erro ao parsear roles:', e)
        roles = null
      }
    }

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: roles
      },
      token
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    
    // Log detalhado do erro
    console.error('Erro ao fazer login:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      body: req.body
    })
    
    res.status(500).json({ 
      error: 'Erro ao fazer login',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Rota para verificar token (usado no frontend)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' })
    }

    const decoded = verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roles: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    // Parse roles se existir
    let roles = null
    if (user.roles) {
      try {
        roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles
      } catch (e) {
        console.warn('Erro ao parsear roles:', e)
      }
    }

    res.json({ 
      user: {
        ...user,
        roles: roles
      }
    })
  } catch (error) {
    console.error('Erro ao verificar token:', error)
    res.status(500).json({ error: 'Erro ao verificar token' })
  }
})

// Rota para solicitar recuperação de senha
router.post('/forgot-password', async (req, res) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body)
    
    // Normalizar email para lowercase
    const normalizedEmail = validatedData.email.toLowerCase().trim()

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    // Sempre retornar sucesso para evitar enumeração de emails
    if (!user) {
      return res.json({ 
        message: 'Se o email existir, você receberá instruções de recuperação' 
      })
    }

    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Expira em 1 hora

    // Invalidar tokens anteriores do usuário
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false
      },
      data: {
        used: true
      }
    })

    // Criar novo token de reset
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt
      }
    })

    // Enviar email de recuperação
    try {
      await sendPasswordResetEmail(user.email, resetToken)
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError)
      // Não falhar a requisição se o email não for enviado
      // Em produção, você pode querer usar um serviço de fila
    }

    res.json({ 
      message: 'Se o email existir, você receberá instruções de recuperação' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    
    console.error('Erro ao solicitar recuperação:', error)
    res.status(500).json({ error: 'Erro ao processar solicitação' })
  }
})

// Rota para resetar senha com token
router.post('/reset-password', async (req, res) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body)

    // Buscar token válido
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: validatedData.token },
      include: { user: true }
    })

    if (!resetToken) {
      return res.status(400).json({ error: 'Token inválido ou expirado' })
    }

    if (resetToken.used) {
      return res.status(400).json({ error: 'Token já foi utilizado' })
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token expirado' })
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(validatedData.password)

    // Atualizar senha do usuário
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    })

    // Marcar token como usado
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    })

    res.json({ message: 'Senha redefinida com sucesso' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    
    console.error('Erro ao resetar senha:', error)
    res.status(500).json({ error: 'Erro ao resetar senha' })
  }
})

export default router

