import express from 'express'
import { authenticate } from '../middleware/auth.js'
import prisma from '../config/database.js'
import { OpenAI } from 'openai'

const router = express.Router()

// Inicializar OpenAI
let openai = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
} else {
  console.warn('⚠️  OPENAI_API_KEY não configurada - Chef Virtual usará fallback simples')
}

// Função para construir URL do webhook N8N para receitas
const getChefRecipeUrl = () => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL || ''
  if (!webhookUrl) return ''
  
  // Extrair base URL
  const baseMatch = webhookUrl.match(/^(https?:\/\/[^\/]+)/)
  if (!baseMatch) return ''
  
  const baseUrl = baseMatch[1]
  return `${baseUrl}/webhook/chef-recipe`
}

const N8N_CHEF_RECIPE_URL = getChefRecipeUrl()
const N8N_API_KEY = process.env.N8N_API_KEY || ''

// Função para calcular score de compatibilidade
function calcularScore(macrosReceita, macrosAlvo) {
  const tolerancia = {
    kcal: 50,
    proteina_g: 5,
    carbo_g: 10,
    gordura_g: 3
  }
  
  let score = 100
  
  const diffKcal = Math.abs(macrosReceita.kcal - macrosAlvo.kcal)
  if (diffKcal > tolerancia.kcal) {
    score -= (diffKcal - tolerancia.kcal) * 0.5
  }
  
  const diffProteina = Math.abs(macrosReceita.proteina_g - macrosAlvo.proteina_g)
  if (diffProteina > tolerancia.proteina_g) {
    score -= (diffProteina - tolerancia.proteina_g) * 2
  }
  
  const diffCarbo = Math.abs(macrosReceita.carbo_g - macrosAlvo.carbo_g)
  if (diffCarbo > tolerancia.carbo_g) {
    score -= (diffCarbo - tolerancia.carbo_g) * 1
  }
  
  const diffGordura = Math.abs(macrosReceita.gordura_g - macrosAlvo.gordura_g)
  if (diffGordura > tolerancia.gordura_g) {
    score -= (diffGordura - tolerancia.gordura_g) * 1.5
  }
  
  return Math.max(0, Math.min(100, score))
}

// Função para buscar receitas do banco
async function buscarReceitasDB(ingredientes, macrosAlvo) {
  try {
    const receitas = await prisma.recipe.findMany({
      where: {
        isPublic: true,
        isApproved: true
      },
      take: 50
    })
    
    // Filtrar receitas que usam os ingredientes disponíveis
    const ingredientesLower = ingredientes.map(i => i.toLowerCase())
    const receitasFiltradas = receitas.filter(rec => {
      try {
        const ingredientesRec = JSON.parse(rec.ingredients || '[]')
        if (Array.isArray(ingredientesRec)) {
          return ingredientesRec.some(ing => {
            const ingNome = typeof ing === 'string' ? ing.toLowerCase() : (ing.nome || '').toLowerCase()
            return ingredientesLower.some(disp => 
              ingNome.includes(disp) || 
              disp.includes(ingNome)
            )
          })
        }
        return false
      } catch (e) {
        // Se não conseguir parsear, verificar no nome da receita
        return ingredientesLower.some(disp => 
          rec.name.toLowerCase().includes(disp)
        )
      }
    })
    
    // Calcular score para cada receita
    const receitasComScore = receitasFiltradas.map(rec => {
      const macros = {
        kcal: rec.kcal || 0,
        proteina_g: rec.proteina_g || 0,
        carbo_g: rec.carbo_g || 0,
        gordura_g: rec.gordura_g || 0
      }
      
      // Ajustar porções se necessário (tentar aproximar dos macros alvo)
      let fatorAjuste = 1
      if (macros.kcal > 0 && macrosAlvo.kcal > 0) {
        fatorAjuste = macrosAlvo.kcal / macros.kcal
        // Limitar ajuste entre 0.5x e 2x
        fatorAjuste = Math.max(0.5, Math.min(2, fatorAjuste))
      }
      
      const macrosAjustados = {
        kcal: Math.round(macros.kcal * fatorAjuste),
        proteina_g: Math.round(macros.proteina_g * fatorAjuste * 10) / 10,
        carbo_g: Math.round(macros.carbo_g * fatorAjuste * 10) / 10,
        gordura_g: Math.round(macros.gordura_g * fatorAjuste * 10) / 10
      }
      
      const score = calcularScore(macrosAjustados, macrosAlvo)
      
      // Parsear ingredientes e passos
      let ingredientesParsed = []
      let passosParsed = []
      
      try {
        ingredientesParsed = JSON.parse(rec.ingredients || '[]')
        passosParsed = JSON.parse(rec.steps || '[]')
      } catch (e) {
        // Se não conseguir parsear, criar estrutura básica
        ingredientesParsed = ingredientes.map(ing => ({
          nome: ing,
          quantidade: '150g',
          tem: true
        }))
        passosParsed = [
          `Prepare o ${ingredientes[0]}`,
          `Adicione ${ingredientes.slice(1).join(' e ')}`,
          'Tempere a gosto',
          'Sirva quente'
        ]
      }
      
      return {
        id: rec.id,
        nome: rec.name,
        descricao: rec.description || 'Receita deliciosa e nutritiva',
        tempoPreparo: rec.prepTime || 20,
        dificuldade: rec.difficulty || 'Fácil',
        ingredientes: ingredientesParsed,
        passos: passosParsed,
        valoresNutricionais: macrosAjustados,
        score,
        fatorAjuste
      }
    }).sort((a, b) => b.score - a.score)
    
    return receitasComScore
  } catch (error) {
    console.error('Erro ao buscar receitas:', error)
    return []
  }
}

// Função para gerar receita com IA (OpenAI ou N8N)
async function gerarReceitaComIA(ingredientes, macrosAlvo, refeicaoNome) {
  // Tentar N8N primeiro
  if (N8N_CHEF_RECIPE_URL) {
    try {
      const payload = {
        ingredientesDisponiveis: ingredientes,
        macrosAlvo: {
          kcal: macrosAlvo.kcal,
          proteina_g: macrosAlvo.proteina_g,
          carbo_g: macrosAlvo.carbo_g,
          gordura_g: macrosAlvo.gordura_g
        },
        refeicaoNome: refeicaoNome
      }
      
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (N8N_API_KEY && !N8N_API_KEY.startsWith('http')) {
        headers['X-N8N-API-KEY'] = N8N_API_KEY
      }
      
      const response = await fetch(N8N_CHEF_RECIPE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000) // 1 minuto
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.receita) {
          // Calcular ajuste necessário se não vier calculado
          if (!data.receita.ajusteNecessario && data.receita.valoresNutricionais) {
            data.receita.ajusteNecessario = {
              kcal: data.receita.valoresNutricionais.kcal - macrosAlvo.kcal,
              proteina_g: Math.round((data.receita.valoresNutricionais.proteina_g - macrosAlvo.proteina_g) * 10) / 10,
              carbo_g: Math.round((data.receita.valoresNutricionais.carbo_g - macrosAlvo.carbo_g) * 10) / 10,
              gordura_g: Math.round((data.receita.valoresNutricionais.gordura_g - macrosAlvo.gordura_g) * 10) / 10
            }
          }
          return data.receita
        }
      }
    } catch (error) {
      console.warn('Erro ao chamar N8N para receita:', error.message)
    }
  }
  
  // Fallback para OpenAI
  if (openai) {
    try {
      const prompt = `Você é um chef nutricionista especializado em criar receitas que se encaixam perfeitamente em macros específicos.

INGREDIENTES DISPONÍVEIS: ${ingredientes.join(', ')}

MACROS ALVO (OBRIGATÓRIO - a receita DEVE ter estes valores exatos):
- Calorias: ${macrosAlvo.kcal} kcal
- Proteína: ${macrosAlvo.proteina_g}g
- Carboidrato: ${macrosAlvo.carbo_g}g
- Gordura: ${macrosAlvo.gordura_g}g

REFEIÇÃO: ${refeicaoNome}

INSTRUÇÕES:
1. Crie uma receita usando APENAS os ingredientes disponíveis
2. Calcule as porções para que os valores nutricionais sejam EXATAMENTE os macros alvo
3. Se não conseguir encaixar perfeitamente, calcule o mais próximo possível e indique a diferença
4. Forneça modo de preparo claro e simples
5. Retorne APENAS um JSON válido, sem texto adicional

FORMATO DE RESPOSTA (JSON):
{
  "nome": "Nome da Receita",
  "descricao": "Descrição curta (1 linha)",
  "tempoPreparo": 25,
  "dificuldade": "Fácil",
  "ingredientes": [
    {"nome": "Ingrediente", "quantidade": "150g", "tem": true}
  ],
  "passos": [
    "Passo 1 detalhado",
    "Passo 2 detalhado"
  ],
  "valoresNutricionais": {
    "kcal": ${macrosAlvo.kcal},
    "proteina_g": ${macrosAlvo.proteina_g},
    "carbo_g": ${macrosAlvo.carbo_g},
    "gordura_g": ${macrosAlvo.gordura_g}
  },
  "ajusteNecessario": {
    "kcal": 0,
    "proteina_g": 0,
    "carbo_g": 0,
    "gordura_g": 0
  }
}

IMPORTANTE: 
- Os valores nutricionais devem ser calculados com base nas porções reais dos ingredientes
- Use tabelas nutricionais precisas (TACO, USDA, etc)
- Se não conseguir encaixar perfeitamente, calcule o mais próximo possível
- O campo "ajusteNecessario" deve mostrar a diferença entre os valores da receita e os macros alvo
- Arredonde valores para 1 casa decimal (proteína, carbo, gordura) e números inteiros (kcal)

EXEMPLO DE CÁLCULO:
Se o alvo é 580 kcal, 45g proteína, 60g carbo, 15g gordura:
- Calcule as porções dos ingredientes para chegar o mais próximo possível
- Se conseguir 575 kcal, 44g proteína, 59g carbo, 15g gordura:
  - ajusteNecessario: {"kcal": -5, "proteina_g": -1, "carbo_g": -1, "gordura_g": 0}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um chef nutricionista especializado em criar receitas precisas que se encaixam em macros específicos. Sempre retorne apenas JSON válido, sem markdown ou texto adicional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
      
      const resposta = JSON.parse(completion.choices[0].message.content)
      
      // Valores nutricionais da receita
      const valoresReceita = {
        kcal: resposta.valoresNutricionais?.kcal || macrosAlvo.kcal,
        proteina_g: resposta.valoresNutricionais?.proteina_g || macrosAlvo.proteina_g,
        carbo_g: resposta.valoresNutricionais?.carbo_g || macrosAlvo.carbo_g,
        gordura_g: resposta.valoresNutricionais?.gordura_g || macrosAlvo.gordura_g
      }
      
      // Calcular ajuste necessário (diferença entre receita e alvo)
      const ajusteNecessario = {
        kcal: valoresReceita.kcal - macrosAlvo.kcal,
        proteina_g: Math.round((valoresReceita.proteina_g - macrosAlvo.proteina_g) * 10) / 10,
        carbo_g: Math.round((valoresReceita.carbo_g - macrosAlvo.carbo_g) * 10) / 10,
        gordura_g: Math.round((valoresReceita.gordura_g - macrosAlvo.gordura_g) * 10) / 10
      }
      
      // Validar e ajustar valores nutricionais
      const receita = {
        nome: resposta.nome || `${ingredientes[0]} com ${ingredientes.slice(1, 2).join(' e ')}`,
        descricao: resposta.descricao || 'Receita nutritiva e balanceada',
        tempoPreparo: resposta.tempoPreparo || 20,
        dificuldade: resposta.dificuldade || 'Fácil',
        ingredientes: resposta.ingredientes || ingredientes.map(ing => ({
          nome: ing,
          quantidade: '150g',
          tem: true
        })),
        passos: resposta.passos || [
          `Prepare o ${ingredientes[0]}`,
          `Adicione ${ingredientes.slice(1).join(' e ')}`,
          'Tempere a gosto',
          'Sirva quente'
        ],
        valoresNutricionais: valoresReceita,
        ajusteNecessario: ajusteNecessario
      }
      
      return receita
    } catch (error) {
      console.error('Erro ao gerar receita com OpenAI:', error)
    }
  }
  
  // Fallback final: receita simples
  return {
    nome: `${ingredientes[0]} com ${ingredientes.slice(1, 3).join(' e ')}`,
    descricao: 'Receita rápida baseada nos seus ingredientes',
    tempoPreparo: 20,
    dificuldade: 'Fácil',
    ingredientes: ingredientes.map(ing => ({
      nome: ing,
      quantidade: '150g',
      tem: true
    })),
    passos: [
      `Prepare o ${ingredientes[0]}`,
      `Adicione ${ingredientes.slice(1).join(' e ')}`,
      'Tempere a gosto',
      'Sirva quente'
    ],
    valoresNutricionais: {
      kcal: macrosAlvo.kcal,
      proteina_g: macrosAlvo.proteina_g,
      carbo_g: macrosAlvo.carbo_g,
      gordura_g: macrosAlvo.gordura_g
    },
    ajusteNecessario: {
      kcal: 0,
      proteina_g: 0,
      carbo_g: 0,
      gordura_g: 0
    },
    score: 75,
    tipo: 'reducao_danos'
  }
}

// Rota para sugerir receita
router.post('/suggest-recipe', authenticate, async (req, res) => {
  try {
    const { refeicaoNome, ingredientesDisponiveis, macrosAlvo, restricoes } = req.body
    const userId = req.user.userId
    
    if (!ingredientesDisponiveis || ingredientesDisponiveis.length === 0) {
      return res.status(400).json({ error: 'Informe pelo menos um ingrediente' })
    }
    
    if (!macrosAlvo || !macrosAlvo.kcal) {
      return res.status(400).json({ error: 'Macros alvo são obrigatórios' })
    }
    
    // Buscar receitas do banco primeiro
    let receitas = await buscarReceitasDB(ingredientesDisponiveis, macrosAlvo)
    
    // Se não encontrou receitas boas (score < 80), gerar com IA
    if (receitas.length === 0 || receitas[0].score < 80) {
      console.log('🍳 Gerando receita com IA...')
      const receitaIA = await gerarReceitaComIA(ingredientesDisponiveis, macrosAlvo, refeicaoNome)
      if (receitaIA) {
        // Calcular score da receita gerada pela IA
        receitaIA.score = calcularScore(receitaIA.valoresNutricionais, macrosAlvo)
        receitas = [receitaIA, ...receitas]
      } else {
        // Fallback se IA falhar
        receitas = receitas.length > 0 ? receitas : [{
          nome: `${ingredientesDisponiveis[0]} com ${ingredientesDisponiveis.slice(1, 2).join(' e ')}`,
          descricao: 'Receita simples',
          tempoPreparo: 20,
          dificuldade: 'Fácil',
          ingredientes: ingredientesDisponiveis.map(ing => ({ nome: ing, quantidade: '150g', tem: true })),
          passos: ['Prepare os ingredientes', 'Cozinhe conforme preferência', 'Sirva'],
          valoresNutricionais: macrosAlvo,
          score: 70,
          tipo: 'reducao_danos'
        }]
      }
    }
    
    const melhorReceita = receitas[0]
    const score = melhorReceita.score
    
    // Determinar tipo
    let tipo = 'reducao_danos'
    if (score >= 90) {
      tipo = 'perfeito'
    } else if (score < 50) {
      return res.json({
        sucesso: false,
        tipo: 'nao_encontrado',
        mensagem: 'Não encontrei receitas compatíveis. Tente adicionar mais ingredientes.'
      })
    }
    
    // Usar ajusteNecessario já calculado na receita, ou calcular se não existir
    const ajusteNecessario = melhorReceita.ajusteNecessario || {
      kcal: melhorReceita.valoresNutricionais.kcal - macrosAlvo.kcal,
      proteina_g: Math.round((melhorReceita.valoresNutricionais.proteina_g - macrosAlvo.proteina_g) * 10) / 10,
      carbo_g: Math.round((melhorReceita.valoresNutricionais.carbo_g - macrosAlvo.carbo_g) * 10) / 10,
      gordura_g: Math.round((melhorReceita.valoresNutricionais.gordura_g - macrosAlvo.gordura_g) * 10) / 10
    }
    
    // Identificar ingredientes faltantes
    const ingredientesFaltantes = melhorReceita.ingredientes
      ?.filter(ing => {
        const ingNome = typeof ing === 'string' ? ing : ing.nome
        return !ingredientesDisponiveis.some(disp => 
          ingNome.toLowerCase().includes(disp.toLowerCase()) ||
          disp.toLowerCase().includes(ingNome.toLowerCase())
        )
      })
      .map(ing => typeof ing === 'string' ? ing : ing.nome) || []
    
    // Mensagem personalizada
    let mensagem = ''
    if (tipo === 'perfeito') {
      mensagem = `🎯 Receita perfeita! Encaixa ${Math.round(score)}% nos seus macros de ${refeicaoNome}.`
    } else {
      mensagem = `⚖️ Redução de danos: Esta receita está ${Math.round(score)}% próxima dos seus macros. `
      if (ajusteNecessario.kcal > 20) {
        mensagem += `Adicione ~${Math.round(ajusteNecessario.kcal)} kcal (ex: uma fruta).`
      } else if (ajusteNecessario.kcal < -20) {
        mensagem += `Reduza ~${Math.abs(Math.round(ajusteNecessario.kcal))} kcal (ex: menos azeite).`
      } else {
        mensagem += 'Está bem próximo!'
      }
    }
    
    res.json({
      sucesso: true,
      tipo,
      receita: {
        ...melhorReceita,
        tipo,
        ajusteNecessario,
        ingredientesFaltantes,
        score
      },
      alternativas: receitas.slice(1, 4),
      mensagem
    })
    
  } catch (error) {
    console.error('Erro ao sugerir receita:', error)
    res.status(500).json({ error: 'Erro ao sugerir receita' })
  }
})

// Rota removida - não aplicamos receita na dieta, apenas sugerimos

export default router
