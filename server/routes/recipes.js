import express from 'express'
import prisma from '../config/database.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Listar receitas (com filtros)
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, difficulty, tag, search, favorites, page = 1, limit = 20 } = req.query
    const userId = req.user.userId
    const skip = (parseInt(page) - 1) * parseInt(limit)

    let where = { isPublic: true, isApproved: true }

    if (category) {
      where.category = category
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    if (tag) {
      where.tags = { contains: tag }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Se pediu apenas favoritos
    if (favorites === 'true') {
      const userFavorites = await prisma.recipeFavorite.findMany({
        where: { userId },
        select: { recipeId: true }
      })
      const favoriteIds = userFavorites.map(f => f.recipeId)
      where.id = { in: favoriteIds }
    }

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.recipe.count({ where })
    ])

    // Buscar favoritos do usuário para marcar
    const userFavorites = await prisma.recipeFavorite.findMany({
      where: { userId, recipeId: { in: recipes.map(r => r.id) } },
      select: { recipeId: true }
    })
    const favoriteSet = new Set(userFavorites.map(f => f.recipeId))

    // Parsear JSON e marcar favoritos
    const parsedRecipes = recipes.map(r => ({
      ...r,
      ingredients: r.ingredients ? JSON.parse(r.ingredients) : [],
      steps: r.steps ? JSON.parse(r.steps) : [],
      tags: r.tags ? JSON.parse(r.tags) : [],
      isFavorite: favoriteSet.has(r.id)
    }))

    res.json({ 
      recipes: parsedRecipes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Erro ao listar receitas:', error)
    res.status(500).json({ error: 'Erro ao listar receitas' })
  }
})

// Buscar receita por ID
router.get('/:recipeId', authenticate, async (req, res) => {
  try {
    const { recipeId } = req.params
    const userId = req.user.userId

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    })

    if (!recipe) {
      return res.status(404).json({ error: 'Receita não encontrada' })
    }

    // Incrementar view count
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { viewCount: { increment: 1 } }
    })

    // Verificar se é favorito
    const favorite = await prisma.recipeFavorite.findUnique({
      where: { userId_recipeId: { userId, recipeId } }
    })

    res.json({
      recipe: {
        ...recipe,
        ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
        steps: recipe.steps ? JSON.parse(recipe.steps) : [],
        tags: recipe.tags ? JSON.parse(recipe.tags) : [],
        isFavorite: !!favorite
      }
    })
  } catch (error) {
    console.error('Erro ao buscar receita:', error)
    res.status(500).json({ error: 'Erro ao buscar receita' })
  }
})

// Criar nova receita (nutricionistas/admins)
router.post('/', authenticate, requireRole(['NUTRICIONISTA', 'ADMIN']), async (req, res) => {
  try {
    const userId = req.user.userId
    const data = req.body

    if (!data.name || !data.category || !data.ingredients || !data.steps) {
      return res.status(400).json({ error: 'Nome, categoria, ingredientes e passos são obrigatórios' })
    }

    const recipe = await prisma.recipe.create({
      data: {
        authorId: userId,
        name: data.name,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty || 'Fácil',
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings || 1,
        kcal: data.kcal,
        proteina_g: data.proteina_g,
        carbo_g: data.carbo_g,
        gordura_g: data.gordura_g,
        fibra_g: data.fibra_g,
        ingredients: JSON.stringify(data.ingredients),
        steps: JSON.stringify(data.steps),
        tips: data.tips,
        imageUrl: data.imageUrl,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        isPublic: data.isPublic !== false
      }
    })

    res.status(201).json({
      recipe: {
        ...recipe,
        ingredients: data.ingredients,
        steps: data.steps,
        tags: data.tags || []
      }
    })
  } catch (error) {
    console.error('Erro ao criar receita:', error)
    res.status(500).json({ error: 'Erro ao criar receita' })
  }
})

// Favoritar/desfavoritar receita
router.post('/:recipeId/favorite', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { recipeId } = req.params

    const existing = await prisma.recipeFavorite.findUnique({
      where: { userId_recipeId: { userId, recipeId } }
    })

    if (existing) {
      // Remover favorito
      await prisma.recipeFavorite.delete({
        where: { userId_recipeId: { userId, recipeId } }
      })
      await prisma.recipe.update({
        where: { id: recipeId },
        data: { favoriteCount: { decrement: 1 } }
      })
      res.json({ isFavorite: false })
    } else {
      // Adicionar favorito
      await prisma.recipeFavorite.create({
        data: { userId, recipeId }
      })
      await prisma.recipe.update({
        where: { id: recipeId },
        data: { favoriteCount: { increment: 1 } }
      })
      res.json({ isFavorite: true })
    }
  } catch (error) {
    console.error('Erro ao favoritar receita:', error)
    res.status(500).json({ error: 'Erro ao favoritar receita' })
  }
})

// Atualizar receita
router.patch('/:recipeId', authenticate, requireRole(['NUTRICIONISTA', 'ADMIN']), async (req, res) => {
  try {
    const userId = req.user.userId
    const requesterRole = req.user.role?.toUpperCase()
    const { recipeId } = req.params
    const data = req.body

    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Receita não encontrada' })
    }

    // Verificar permissão (autor ou admin)
    if (existing.authorId !== userId && requesterRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Sem permissão para editar' })
    }

    const updateData = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.category !== undefined) updateData.category = data.category
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty
    if (data.prepTime !== undefined) updateData.prepTime = data.prepTime
    if (data.cookTime !== undefined) updateData.cookTime = data.cookTime
    if (data.servings !== undefined) updateData.servings = data.servings
    if (data.kcal !== undefined) updateData.kcal = data.kcal
    if (data.proteina_g !== undefined) updateData.proteina_g = data.proteina_g
    if (data.carbo_g !== undefined) updateData.carbo_g = data.carbo_g
    if (data.gordura_g !== undefined) updateData.gordura_g = data.gordura_g
    if (data.fibra_g !== undefined) updateData.fibra_g = data.fibra_g
    if (data.ingredients !== undefined) updateData.ingredients = JSON.stringify(data.ingredients)
    if (data.steps !== undefined) updateData.steps = JSON.stringify(data.steps)
    if (data.tips !== undefined) updateData.tips = data.tips
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: updateData
    })

    res.json({
      recipe: {
        ...recipe,
        ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients) : [],
        steps: recipe.steps ? JSON.parse(recipe.steps) : [],
        tags: recipe.tags ? JSON.parse(recipe.tags) : []
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar receita:', error)
    res.status(500).json({ error: 'Erro ao atualizar receita' })
  }
})

// Deletar receita
router.delete('/:recipeId', authenticate, requireRole(['NUTRICIONISTA', 'ADMIN']), async (req, res) => {
  try {
    const userId = req.user.userId
    const requesterRole = req.user.role?.toUpperCase()
    const { recipeId } = req.params

    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Receita não encontrada' })
    }

    if (existing.authorId !== userId && requesterRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Sem permissão para deletar' })
    }

    // Deletar favoritos relacionados
    await prisma.recipeFavorite.deleteMany({
      where: { recipeId }
    })

    await prisma.recipe.delete({
      where: { id: recipeId }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar receita:', error)
    res.status(500).json({ error: 'Erro ao deletar receita' })
  }
})

// Listar categorias disponíveis
router.get('/meta/categories', authenticate, async (req, res) => {
  try {
    const categories = await prisma.recipe.findMany({
      select: { category: true },
      distinct: ['category']
    })

    res.json({ categories: categories.map(c => c.category) })
  } catch (error) {
    console.error('Erro ao listar categorias:', error)
    res.status(500).json({ error: 'Erro ao listar categorias' })
  }
})

export default router


