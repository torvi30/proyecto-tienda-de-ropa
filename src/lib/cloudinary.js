// =============================================================
// CLOUDINARY CLIENT-SIDE UPLOAD UTILITY
// Uploads images directly from browser via unsigned REST API
// =============================================================

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'bchdrvef'
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'tienda_ropa'

/**
 * Uploads a WebP compressed image file or blob directly to Cloudinary.
 * @param {File|Blob} file - Image file or Blob
 * @param {string} [fileName] - Optional name identifier for the file
 * @returns {Promise<{ url: string, secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = async (file, fileName = 'producto') => {
  if (!CLOUD_NAME) {
    throw new Error('Falta VITE_CLOUDINARY_CLOUD_NAME en las variables de entorno')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'tienda_ropa/productos')

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
