const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'application/pdf']

export function isValidFile(file) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimeType || '')) {
    return { isValid: false, errorMessage: 'Only PNG, JPG, and PDF files are allowed.' }
  }

  if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, errorMessage: `File size exceeds ${MAX_FILE_SIZE_MB} MB.` }
  }

  return { isValid: true, errorMessage: null }
}
