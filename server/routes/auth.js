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

// Rota de registro
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body)
    
    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' })
    }

    // Hash da senha
    const hashedPassword = await hashPassword(validatedData.password)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
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

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }

    // Verificar senha
    const isPasswordValid = await comparePassword(validatedData.password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou senha inválidos' })
    }

    // Gerar token
    const token = generateToken(user.id, user.email, user.role)

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
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
    
    console.error('Erro ao fazer login:', error)
    res.status(500).json({ error: 'Erro ao fazer login' })
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
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Erro ao verificar token:', error)
    res.status(500).json({ error: 'Erro ao verificar token' })
  }
})

export default router

