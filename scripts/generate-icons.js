/**
 * Script para gerar ícones PNG em diferentes tamanhos a partir do SVG
 * 
 * Requer: npm install sharp
 * Uso: node scripts/generate-icons.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(__dirname, '..', 'public', 'icons')
const svgPath = path.join(iconsDir, 'icon.svg')

async function generateIcons() {
  try {
    // Verificar se sharp está instalado
    let sharp
    try {
      sharp = (await import('sharp')).default
    } catch (error) {
      console.error('❌ Erro: sharp não está instalado.')
      console.log('📦 Instale com: npm install sharp')
      console.log('\n💡 Alternativa: Use uma ferramenta online como:')
      console.log('   - https://realfavicongenerator.net/')
      console.log('   - https://www.pwabuilder.com/imageGenerator')
      console.log('   - https://www.favicon-generator.org/')
      console.log('\n📝 Ou crie manualmente os ícones PNG nos tamanhos:')
      sizes.forEach(size => {
        console.log(`   - icon-${size}x${size}.png`)
      })
      process.exit(1)
    }

    // Verificar se o SVG existe
    if (!fs.existsSync(svgPath)) {
      console.error(`❌ SVG não encontrado em: ${svgPath}`)
      process.exit(1)
    }

    console.log('🎨 Gerando ícones PNG a partir do SVG...\n')

    // Ler o SVG
    const svgBuffer = fs.readFileSync(svgPath)

    // Gerar cada tamanho
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`)
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath)
      
      console.log(`✅ Criado: icon-${size}x${size}.png`)
    }

    console.log('\n✨ Todos os ícones foram gerados com sucesso!')
    console.log(`📁 Localização: ${iconsDir}`)
  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error.message)
    process.exit(1)
  }
}

generateIcons()
