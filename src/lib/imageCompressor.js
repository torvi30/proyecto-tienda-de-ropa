// =============================================================
// IMAGE COMPRESSOR — Client-Side WebP Compression
// =============================================================
// Converts any image (JPG, PNG, HEIC*) to WebP format
// using standard 4:5 fashion aspect ratio (1080x1350 px) and max 150KB.
// ALL processing runs client-side in the user's browser.
// NO uncompressed raw bytes are sent to the server.
// =============================================================

/** Compression configuration */
const CONFIG = {
  targetWidth: 1080,
  targetHeight: 1350,     // 4:5 vertical ratio — Instagram/boutique standard
  maxFileSizeKB: 150,     // Maximum file size target in kilobytes
  initialQuality: 0.85,   // Initial WebP quality (0-1)
  minQuality: 0.40,       // Minimum acceptable quality floor
  qualityStep: 0.05,      // Quality reduction step per iteration
}

/**
 * Compresses and converts an image File into WebP with 4:5 aspect ratio.
 * Applies cover-fit to center and crop the image cleanly.
 *
 * @param {File} file - Original image file
 * @param {Object} options - Optional configuration overrides
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

        // --- Cover-fit: center and crop to fill 4:5 ratio ---
        const srcRatio    = img.width / img.height
        const targetRatio = cfg.targetWidth / cfg.targetHeight

        let sx = 0, sy = 0, sw = img.width, sh = img.height

        if (srcRatio > targetRatio) {
          // Source image is wider than target: crop left and right
          sw = img.height * targetRatio
          sx = (img.width - sw) / 2
        } else {
          // Source image is taller than target: crop top and bottom
          sh = img.width / targetRatio
          sy = (img.height - sh) / 2
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cfg.targetWidth, cfg.targetHeight)

        // --- Iterative quality reduction until reaching target file size ---
        let quality = cfg.initialQuality
        let blob    = null

        const compress = () => {
          canvas.toBlob(
            (result) => {
              if (!result) return reject(new Error('Failed to compress image.'))

              const sizeKB = result.size / 1024

              if (sizeKB <= cfg.maxFileSizeKB || quality <= cfg.minQuality) {
                // Target file size or minimum quality floor reached
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
                // Reduce quality and retry iteratively
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

      img.onerror = () => reject(new Error(`Failed to load image "${file.name}".`))
      img.src = e.target.result
    }

    reader.onerror = () => reject(new Error(`Failed to read file "${file.name}".`))
    reader.readAsDataURL(file)
  })
}

/**
 * Compresses an array of files in parallel.
 * Returns successful results and errors separately.
 *
 * @param {File[]} files - Array of files to compress
 * @param {Function} onProgress - Progress callback (completed, total)
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
 * Revokes an object URL created by URL.createObjectURL()
 * Call after the preview image is no longer needed in the DOM.
 *
 * @param {string} url - Object URL to revoke
 */
export const revokePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
