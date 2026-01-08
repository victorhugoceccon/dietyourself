function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // evita problemas quando possível
    image.src = url
  })
}

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Gera uma imagem recortada e redimensionada para banner.
 * @param {string} imageSrc dataURL (base64) ou URL
 * @param {{x:number,y:number,width:number,height:number}} pixelCrop crop em pixels (da imagem original)
 * @param {object} opts
 * @param {number} opts.rotation graus
 * @param {number} opts.maxWidth largura máxima do output
 * @param {string} opts.mimeType image/jpeg | image/png
 * @param {number} opts.quality 0..1 (para jpeg/webp)
 * @returns {Promise<string>} dataURL
 */
export async function getCroppedBannerDataUrl(
  imageSrc,
  pixelCrop,
  { rotation = 0, maxWidth = 1200, mimeType = 'image/jpeg', quality = 0.88 } = {}
) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas não suportado')
  }

  const rotRad = getRadianAngle(rotation)

  // Calcular bounding box após rotação (se houver)
  const sin = Math.abs(Math.sin(rotRad))
  const cos = Math.abs(Math.cos(rotRad))
  const bBoxW = image.width * cos + image.height * sin
  const bBoxH = image.width * sin + image.height * cos

  const safeCanvas = document.createElement('canvas')
  const safeCtx = safeCanvas.getContext('2d')
  if (!safeCtx) throw new Error('Canvas não suportado')

  safeCanvas.width = bBoxW
  safeCanvas.height = bBoxH
  safeCtx.translate(bBoxW / 2, bBoxH / 2)
  safeCtx.rotate(rotRad)
  safeCtx.translate(-image.width / 2, -image.height / 2)
  safeCtx.drawImage(image, 0, 0)

  const cropW = Math.round(pixelCrop.width)
  const cropH = Math.round(pixelCrop.height)

  // Redimensionar mantendo proporção do crop
  const scale = Math.min(1, maxWidth / cropW)
  canvas.width = Math.max(1, Math.round(cropW * scale))
  canvas.height = Math.max(1, Math.round(cropH * scale))

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(
    safeCanvas,
    Math.round(pixelCrop.x),
    Math.round(pixelCrop.y),
    cropW,
    cropH,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return canvas.toDataURL(mimeType, quality)
}


