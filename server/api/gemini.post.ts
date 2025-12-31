export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || ''

  if (!apiKey) {
    return {
      text: "Vui lòng cấu hình GEMINI_API_KEY trong file .env để sử dụng tính năng này." 
    }
  }

  const { history } = body
  // history: Array of { role: 'user' | 'model', parts: [{ text: string }] }

  try {
    const response = await $fetch<any>(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        body: {
          contents: history
        }
      }
    )
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi từ AI."
    return { text }
  } catch (error: any) {
    console.error('Gemini API Error:', error)
    return { text: `Lỗi: ${error.data?.error?.message || error.message || 'Không xác định'}` }
  }
})
