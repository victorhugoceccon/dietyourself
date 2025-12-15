import prisma from '../config/database.js'

// Exercícios padrão para novos personals
export const DEFAULT_EXERCICIOS = [
  // Peito
  {
    nome: 'Supino reto com barra',
    categoria: 'Peito',
    descricao:
      'Deitado no banco reto, empurre a barra do peito até a extensão completa dos braços.'
  },
  {
    nome: 'Supino inclinado com halteres',
    categoria: 'Peito',
    descricao:
      'No banco inclinado, empurre os halteres do peito até acima da cabeça.'
  },
  {
    nome: 'Crucifixo reto com halteres',
    categoria: 'Peito',
    descricao:
      'Deitado no banco reto, abra e feche os braços em movimento de abraço, com leve flexão dos cotovelos.'
  },
  {
    nome: 'Flexão de braço no solo',
    categoria: 'Peito',
    descricao:
      'Apoie as mãos no chão na largura dos ombros e flexione os cotovelos aproximando o peito do solo.'
  },

  // Costas
  {
    nome: 'Puxada na frente (pulley)',
    categoria: 'Costas',
    descricao: 'Sentado, puxe a barra em direção ao peito mantendo o tronco ereto.'
  },
  {
    nome: 'Remada curvada com barra',
    categoria: 'Costas',
    descricao: 'Com o tronco inclinado, puxe a barra em direção ao abdômen.'
  },
  {
    nome: 'Remada baixa no cabo',
    categoria: 'Costas',
    descricao:
      'Sentado, puxe a pegada em direção ao abdômen mantendo a coluna neutra.'
  },

  // Ombros
  {
    nome: 'Desenvolvimento com halteres',
    categoria: 'Ombro',
    descricao:
      'Sentado, empurre os halteres de ao lado da cabeça até a extensão completa dos braços.'
  },
  {
    nome: 'Elevação lateral com halteres',
    categoria: 'Ombro',
    descricao:
      'Eleve os halteres lateralmente até a altura dos ombros, com leve flexão de cotovelos.'
  },

  // Bíceps
  {
    nome: 'Rosca direta com barra',
    categoria: 'Bíceps',
    descricao: 'Em pé, flexione os cotovelos trazendo a barra em direção aos ombros.'
  },
  {
    nome: 'Rosca alternada com halteres',
    categoria: 'Bíceps',
    descricao:
      'Em pé, alterne a flexão de cada braço trazendo o halter em direção ao ombro.'
  },

  // Tríceps
  {
    nome: 'Tríceps na polia (corda)',
    categoria: 'Tríceps',
    descricao: 'Em pé, estenda os cotovelos empurrando a corda para baixo.'
  },
  {
    nome: 'Tríceps testa com barra',
    categoria: 'Tríceps',
    descricao:
      'Deitado no banco, flexione e estenda os cotovelos trazendo a barra em direção à testa.'
  },

  // Pernas
  {
    nome: 'Agachamento livre com barra',
    categoria: 'Pernas',
    descricao:
      'Com a barra nas costas, flexione joelhos e quadris como se fosse sentar, retornando em seguida.'
  },
  {
    nome: 'Leg press 45º',
    categoria: 'Pernas',
    descricao:
      'Empurre a plataforma com os pés, estendendo os joelhos sem travar totalmente.'
  },
  {
    nome: 'Cadeira extensora',
    categoria: 'Pernas',
    descricao: 'Sentado, estenda os joelhos elevando a carga.'
  },
  {
    nome: 'Mesa flexora',
    categoria: 'Pernas',
    descricao:
      'Deitado, flexione os joelhos trazendo os calcanhares em direção aos glúteos.'
  },

  // Panturrilhas
  {
    nome: 'Panturrilha em pé',
    categoria: 'Panturrilhas',
    descricao: 'Em pé, eleve os calcanhares ficando na ponta dos pés.'
  },

  // Abdômen
  {
    nome: 'Prancha isométrica',
    categoria: 'Abdômen',
    descricao:
      'Apoie antebraços e pontas dos pés no chão, mantendo o corpo alinhado em linha reta.'
  },
  {
    nome: 'Crunch no solo',
    categoria: 'Abdômen',
    descricao:
      'Deitado, flexione o tronco aproximando o peitoral dos joelhos, sem puxar o pescoço.'
  }
]

// Divisões padrão para novos personals
export const DEFAULT_DIVISOES = [
  {
    nome: 'A - Peito e Tríceps',
    descricao: 'Foco em exercícios clássicos de peito e tríceps.',
    diasSemana: 'Segunda, Quinta'
  },
  {
    nome: 'B - Costas e Bíceps',
    descricao: 'Foco em puxadas e remadas para costas e bíceps.',
    diasSemana: 'Terça, Sexta'
  },
  {
    nome: 'C - Pernas e Ombros',
    descricao: 'Foco em exercícios compostos de pernas e fortalecimento de ombros.',
    diasSemana: 'Quarta'
  }
]

// Combos padrão de exercícios por divisão (usado para seed inicial)
const DEFAULT_DIVISAO_ITENS = {
  'A - Peito e Tríceps': [
    { exercicioNome: 'Supino reto com barra', series: 4, repeticoes: '8-10' },
    { exercicioNome: 'Supino inclinado com halteres', series: 3, repeticoes: '10-12' },
    { exercicioNome: 'Crucifixo reto com halteres', series: 3, repeticoes: '12-15' },
    { exercicioNome: 'Tríceps na polia (corda)', series: 3, repeticoes: '10-12' },
    { exercicioNome: 'Tríceps testa com barra', series: 3, repeticoes: '10-12' }
  ],
  'B - Costas e Bíceps': [
    { exercicioNome: 'Puxada na frente (pulley)', series: 4, repeticoes: '8-10' },
    { exercicioNome: 'Remada curvada com barra', series: 3, repeticoes: '8-10' },
    { exercicioNome: 'Remada baixa no cabo', series: 3, repeticoes: '10-12' },
    { exercicioNome: 'Rosca direta com barra', series: 3, repeticoes: '8-10' },
    { exercicioNome: 'Rosca alternada com halteres', series: 3, repeticoes: '10-12' }
  ],
  'C - Pernas e Ombros': [
    { exercicioNome: 'Agachamento livre com barra', series: 4, repeticoes: '8-10' },
    { exercicioNome: 'Leg press 45º', series: 3, repeticoes: '10-12' },
    { exercicioNome: 'Cadeira extensora', series: 3, repeticoes: '12-15' },
    { exercicioNome: 'Mesa flexora', series: 3, repeticoes: '10-12' },
    { exercicioNome: 'Desenvolvimento com halteres', series: 3, repeticoes: '8-10' },
    { exercicioNome: 'Elevação lateral com halteres', series: 3, repeticoes: '12-15' }
  ]
}

// Garante que um personal tenha os exercícios padrão criados
export async function ensureDefaultExercicios(personalId) {
  const count = await prisma.exercicio.count({ where: { personalId } })
  if (count > 0) return

  await prisma.exercicio.createMany({
    data: DEFAULT_EXERCICIOS.map((ex) => ({
      nome: ex.nome,
      categoria: ex.categoria,
      descricao: ex.descricao,
      personalId
    }))
  })
}

// Garante que um personal tenha as divisões padrão criadas + itens padrão
export async function ensureDefaultDivisoes(personalId) {
  // Garantir que os exercícios padrão existem antes de criar divisões
  await ensureDefaultExercicios(personalId)

  const divisaoCount = await prisma.divisaoTreino.count({ where: { personalId } })
  if (divisaoCount === 0) {
    await prisma.divisaoTreino.createMany({
      data: DEFAULT_DIVISOES.map((div) => ({
        nome: div.nome,
        descricao: div.descricao,
        diasSemana: div.diasSemana,
        personalId
      }))
    })
  }

  // Seed dos itens padrão (somente se a divisão ainda não tiver itens)
  const divisoes = await prisma.divisaoTreino.findMany({
    where: { personalId }
  })

  if (!divisoes.length) return

  // Mapear exercícios pelo nome (case-insensitive)
  const exercicios = await prisma.exercicio.findMany({
    where: { personalId }
  })
  const exercicioPorNome = new Map(
    exercicios.map((ex) => [ex.nome.toLowerCase(), ex])
  )

  for (const divisao of divisoes) {
    const itensConfig = DEFAULT_DIVISAO_ITENS[divisao.nome]
    if (!itensConfig || !itensConfig.length) continue

    const itensCount = await prisma.divisaoTreinoItem.count({
      where: { divisaoTreinoId: divisao.id }
    })
    if (itensCount > 0) continue

    const itensToCreate = []
    let ordem = 1

    for (const cfg of itensConfig) {
      const exercicio = exercicioPorNome.get(cfg.exercicioNome.toLowerCase())
      if (!exercicio) continue

      itensToCreate.push({
        divisaoTreinoId: divisao.id,
        exercicioId: exercicio.id,
        series: cfg.series || 3,
        repeticoes: cfg.repeticoes || null,
        carga: cfg.carga || null,
        descanso: cfg.descanso || null,
        observacoes: null,
        ordem: ordem++
      })
    }

    if (itensToCreate.length > 0) {
      await prisma.divisaoTreinoItem.createMany({
        data: itensToCreate
      })
    }
  }
}
