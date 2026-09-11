import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const uploadDocument = async (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded * 100) / e.total))
  })
  return data
}

export const getDocument = async (docId) => {
  const { data } = await api.get(`/documents/${docId}`)
  return data
}

export const getPages = async (docId) => {
  const { data } = await api.get(`/documents/${docId}/pages`)
  return data
}

export const listDocuments = async () => {
  const { data } = await api.get('/documents/')
  return data
}

export const deleteDocument = async (docId) => {
  await api.delete(`/documents/${docId}`)
}

export const compareDocuments = async (file1, file2) => {
  const form = new FormData()
  form.append('file1', file1)
  form.append('file2', file2)
  const { data } = await api.post('/compare/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000
  })
  return data
}

export const getChatHistory = async (docId) => {
  const { data } = await api.get(`/chat/history/${docId}`)
  return data
}

export const clearChatHistory = async (docId) => {
  await api.delete(`/chat/history/${docId}`)
}

// Streaming chat
export const streamChat = async (docId, message, history, onToken, onSources, onDone) => {
  const response = await fetch('/api/chat/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_id: docId, message, history })
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          if (data.type === 'token') onToken(data.content)
          else if (data.type === 'sources') onSources(data.chunks)
          else if (data.type === 'done') onDone()
        } catch {}
      }
    }
  }
}
