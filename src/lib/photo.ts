const MAX_BYTES = 4 * 1024 * 1024
const OUTPUT_SIZE = 320

export function readProfilePhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selecione uma imagem (JPG, PNG ou WEBP).'))
      return
    }
    if (file.size > MAX_BYTES) {
      reject(new Error('A foto deve ter no máximo 4 MB.'))
      return
    }

    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Não foi possível processar a imagem.'))
        return
      }

      const scale = Math.max(OUTPUT_SIZE / image.width, OUTPUT_SIZE / image.height)
      const width = image.width * scale
      const height = image.height * scale
      context.drawImage(image, (OUTPUT_SIZE - width) / 2, (OUTPUT_SIZE - height) / 2, width, height)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/jpeg', 0.86))
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Não foi possível ler a imagem.'))
    }

    image.src = objectUrl
  })
}
