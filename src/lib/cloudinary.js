// =============================================================
// UTILIDAD DE SUBIDA A CLOUDINARY (CLIENT-SIDE)
// Sube imágenes directamente desde el navegador vía REST API
// =============================================================

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'bchdrvef'
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'tienda_ropa'

/**
 * Sube un archivo o blob (comprimido en WebP) a Cloudinary
 * @param {File|Blob} file - Archivo o Blob de imagen
 * @param {string} [fileName] - Nombre para identificar el archivo
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
      const errorMsg = data?.error?.message || 'Error al subir imagen a Cloudinary'
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
