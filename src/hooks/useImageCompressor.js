import { useCallback } from 'react'
import { compressImage, compressImageBatch, revokePreviewUrl } from '../lib/imageCompressor'

// Hook que envuelve imageCompressor.js para uso en componentes React
const useImageCompressor = () => {
  const compress = useCallback(async (file) => {
    return await compressImage(file)
  }, [])

  const compressBatch = useCallback(async (files, onProgress) => {
    return await compressImageBatch(files, onProgress)
  }, [])

  const revokeUrl = useCallback((url) => {
    revokePreviewUrl(url)
  }, [])

  return { compress, compressBatch, revokeUrl }
}

export default useImageCompressor
