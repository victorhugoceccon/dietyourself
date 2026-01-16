/**
 * Script para gerar ícones PNG em diferentes tamanhos a partir de um PNG base
 * 
 * Requer: npm install sharp
 * Uso: node scripts/generate-icons-from-png.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(__dirname, '..', 'public', 'icons')
const pngPath = path.join(__dirname, '..', 'GIBA (2).png')

async function generateIcons() {
  try {
    // Verificar se sharp está instalado
    let sharp
    try {
      sharp = (await import('sharp')).default
    } catch (error) {
      console.error('❌ Erro: sharp não está instalado.')
      console.log('📦 Instale com: npm install sharp')
      process.exit(1)
    }

    // Verificar se o PNG existe
    if (!fs.existsSync(pngPath)) {
      console.error(`❌ PNG não encontrado em: ${pngPath}`)
      console.log('💡 Certifique-se de que o arquivo "GIBA (2).png" está na raiz do projeto')
      process.exit(1)
    }

    console.log('🎨 Gerando ícones PNG a partir do arquivo base...\n')

    // Ler o PNG
    const pngBuffer = fs.readFileSync(pngPath)

    // Gerar cada tamanho
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`)
      
      await sharp(pngBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
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
