// =========================================================
//  services/api.js — Axios API Client
//  All backend calls go through this instance
// =========================================================

import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000, // 60s — PDF processing can be slow
})

// ── Response interceptor — global error handling ──────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong'

    // Don't show toast for cancelled requests
    if (!axios.isCancel(error)) {
      toast.error(message)
    }
    return Promise.reject(error)
  }
)

// ── Image APIs ────────────────────────────────────────────
export const compressImage = (file, quality = 80, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  form.append('quality', quality)
  return api.post('/image/compress', form, {
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
}

export const resizeImage = (file, width, height, fit = 'cover', onProgress) => {
  const form = new FormData()
  form.append('file', file)
  if (width)  form.append('width', width)
  if (height) form.append('height', height)
  form.append('fit', fit)
  return api.post('/image/resize', form, {
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
}

export const convertImage = (file, format, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  form.append('format', format)
  return api.post('/image/convert', form, {
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
}

// ── PDF APIs ──────────────────────────────────────────────
export const mergePdfs = (files, onProgress) => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  return api.post('/pdf/merge', form, {
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
}

export const splitPdf = (file, pages, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  if (pages) form.append('pages', pages)
  return api.post('/pdf/split', form, {
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
}

export const compressPdf = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/pdf/compress', form, {
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
}

export const pdfToWord = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/pdf/to-word', form, {
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
}

export const jpgToPdf = (files, onProgress) => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  return api.post('/pdf/jpg-to-pdf', form, {
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
}

// ── Text APIs ─────────────────────────────────────────────
export const getWordCount  = (text)       => api.post('/text/wordcount',   { text })
export const convertCase   = (text, type) => api.post('/text/caseconvert', { text, type })
export const toSlug        = (text)       => api.post('/text/slug',        { text })

// ── Util APIs ─────────────────────────────────────────────
export const generateUUID     = (count = 1) => api.get(`/util/uuid?count=${count}`)
export const generatePassword = (opts)      => api.post('/util/password',      opts)
export const base64Encode     = (text)      => api.post('/util/base64/encode', { text })
export const base64Decode     = (text)      => api.post('/util/base64/decode', { text })
export const formatJson       = (json, minify = false) => api.post('/util/json-format', { json, minify })

// ── Tools list ────────────────────────────────────────────
export const getToolsList = () => api.get('/tools/list')

export default api