// =============================================================
// CLOUDINARY CLIENT-SIDE UPLOAD UTILITY
// Uploads images directly from browser via unsigned REST API
// =============================================================

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'bchdrvef'
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'tienda_ropa'

/**
 * Sanitizes a file or product name into a clean, URL-safe Cloudinary public_id.
 * Removes accents, special symbols, and replaces spaces with hyphens.
 *
 * @param {string} name - Raw file or product name
 * @returns {string} Sanitized slug
 */
export const sanitizeFileName = (name) => {
  if (!name) return 'producto'
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents (á, é, í -> a, e, i)
    .replace(/\.[^.]+$/, '') // remove file extension if present
    .replace(/[^a-z0-9_-]+/g, '-') // convert spaces and special characters to hyphens
    .replace(/(^-|-$)+/g, '') // trim leading and trailing hyphens
    .slice(0, 80) || 'producto'
}

/**
 * Uploads a WebP compressed image file or blob directly to Cloudinary.
 * Preserves the original product / file name as the Cloudinary public_id.
 *
 * @param {File|Blob} file - Image file or Blob
 * @param {string} [fileName] - Optional name identifier for the file
 * @returns {Promise<{ url: string, secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = async (file, fileName = 'producto') => {
  if (!CLOUD_NAME) {
    throw new Error('Falta VITE_CLOUDINARY_CLOUD_NAME en las variables de entorno')
  }

  const cleanName = sanitizeFileName(fileName)
  // Suffix único para evitar colisiones, sobreescrituras o caché duplicada de fotos con nombres comunes
  const uniqueSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
  const publicId = `${cleanName}-${uniqueSuffix}`

  const formData = new FormData()
  formData.append('file', file, `${publicId}.webp`)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'tienda_ropa/productos')
  formData.append('public_id', publicId)

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      let errorMsg = data?.error?.message || 'Error al subir imagen a Cloudinary'
      if (errorMsg.toLowerCase().includes('upload preset not found')) {
        errorMsg = `El upload preset "${UPLOAD_PRESET}" no existe en tu Cloudinary. Créalo como "Unsigned" en Cloudinary Console > Settings > Upload > Add upload preset.`
      }
      console.error('Cloudinary upload error:', data)
      throw new Error(errorMsg)
    }

    return {
      url: data.url,
      secure_url: data.secure_url,
      public_id: data.public_id,
    }
  } catch (error) {
    console.error('Error en uploadToCloudinary:', error)
    throw error
  }
}
