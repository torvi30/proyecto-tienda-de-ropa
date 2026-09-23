// =============================================================
// IMAGE COMPRESSOR — Compresion Client-Side a WebP
// =============================================================
// Convierte cualquier imagen (JPG, PNG, HEIC*) a WebP
// con el ratio de moda 4:5 (1080x1350 px) y maximo 150KB
// TODO el procesamiento ocurre en el navegador del usuario.
// NINGUN byte de la imagen original llega al servidor.
// =============================================================

/** Configuracion de compresion */
const CONFIG = {
  targetWidth: 1080,
  targetHeight: 1350,     // Ratio 4:5 vertical — estandar de Instagram/boutiques
  maxFileSizeKB: 150,     // Limite maximo en kilobytes
  initialQuality: 0.85,   // Calidad WebP inicial (0-1)
  minQuality: 0.40,       // Calidad minima permitida antes de rechazar
  qualityStep: 0.05,      // Paso de reduccion de calidad por iteracion
}

/**
 * Comprime y convierte una imagen File a WebP con ratio 4:5.
 * Aplica cover-fit: recorta el centro de la imagen para llenar el marco.
 *
 * @param {File} file - Archivo de imagen original
 * @param {Object} options - Opciones opcionales para sobreescribir CONFIG
 * @returns {Promise<{ blob: Blob, previewUrl: string, originalSizeKB: number, compressedSizeKB: number }>}
 */
export const compressImage = (file, options = {}) => {
  const cfg = { ...CONFIG, ...options }

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error(`El archivo "${file.name}" no es una imagen valida.`))
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = cfg.targetWidth
        canvas.height = cfg.targetHeight

        const ctx = canvas.getContext('2d')

        // --- Cover-fit: centrar y recortar para llenar 4:5 ---
        const srcRatio    = img.width / img.height
        const targetRatio = cfg.targetWidth / cfg.targetHeight

        let sx = 0, sy = 0, sw = img.width, sh = img.height

        if (srcRatio > targetRatio) {
          // La imagen es mas ancha que el objetivo: recortar los lados
          sw = img.height * targetRatio
          sx = (img.width - sw) / 2
        } else {
          // La imagen es mas alta que el objetivo: recortar arriba/abajo
          sh = img.width / targetRatio
          sy = (img.height - sh) / 2
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cfg.targetWidth, cfg.targetHeight)

        // --- Reduccion iterativa de calidad hasta llegar al limite de KB ---
        let quality = cfg.initialQuality
        let blob    = null

        const compress = () => {
          canvas.toBlob(
            (result) => {
              if (!result) return reject(new Error('No se pudo comprimir la imagen.'))

              const sizeKB = result.size / 1024

              if (sizeKB <= cfg.maxFileSizeKB || quality <= cfg.minQuality) {
                // Tamaño aceptable o calidad minima alcanzada
                blob = result
                const previewUrl = URL.createObjectURL(blob)
                resolve({
                  blob,
                  previewUrl,
                  originalSizeKB: Math.round(file.size / 1024),
                  compressedSizeKB: Math.round(sizeKB),
                  quality: Math.round(quality * 100),
                })
              } else {
                // Reducir calidad y reintentar
                quality = Math.max(quality - cfg.qualityStep, cfg.minQuality)
                compress()
              }
            },
            'image/webp',
            quality
          )
        }

        compress()
      }

      img.onerror = () => reject(new Error(`No se pudo cargar la imagen "${file.name}".`))
      img.src = e.target.result
    }

    reader.onerror = () => reject(new Error(`Error al leer el archivo "${file.name}".`))
    reader.readAsDataURL(file)
  })
}

/**
 * Comprime un array de archivos en paralelo.
 * Retorna resultados exitosos y errores separados.
 *
 * @param {File[]} files - Array de archivos a comprimir
 * @param {Function} onProgress - Callback (completados, total) para mostrar progreso
 * @returns {Promise<{ results: Array, errors: Array }>}
 */
export const compressImageBatch = async (files, onProgress = null) => {
  const results = []
  const errors  = []
  let completed = 0

  const promises = files.map(async (file) => {
    try {
      const result = await compressImage(file)
      results.push({ file, ...result })
    } catch (err) {
      errors.push({ file, error: err.message })
    } finally {
      completed++
      if (onProgress) onProgress(completed, files.length)
    }
  })

  await Promise.all(promises)
  return { results, errors }
}

/**
 * Libera la URL de objeto creada por URL.createObjectURL()
 * Llamar despues de que la imagen ya no sea necesaria en el DOM.
 *
 * @param {string} url - URL de objeto a liberar
 */
export const revokePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
