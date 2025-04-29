import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SURAT_KARGO_API_URL = 'https://api02.suratkargo.com.tr'
const SURAT_KARGO_USERNAME = '1472651760'
const SURAT_KARGO_PASSWORD = 'Kargo.2025'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('İstek alındı:', req.method, req.url)
    
    const requestData = await req.json()
    console.log('İstek verisi:', JSON.stringify(requestData))
    
    const { path, data } = requestData
    
    // API path'i düzeltme
    let apiPath = path
    if (path.startsWith('/Gonderi/GonderiOlustur')) {
      apiPath = '/api/GonderiOlustur'
    }

    // API isteğinin detaylarını loglama
    console.log('Sürat Kargo API isteği hazırlanıyor:', {
      url: `${SURAT_KARGO_API_URL}${apiPath}`,
      method: 'POST'
    })

    // İstek gövdesinin detaylarını loglama (hassas bilgileri gizleyerek)
    const requestBody = {
      ...data,
      KullaniciAdi: SURAT_KARGO_USERNAME,
      Sifre: '******' // Şifreyi gizle
    }
    console.log('İstek gövdesi:', JSON.stringify(requestBody))

    // Sürat Kargo API'sine istek gönderme
    const response = await fetch(`${SURAT_KARGO_API_URL}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        KullaniciAdi: SURAT_KARGO_USERNAME,
        Sifre: SURAT_KARGO_PASSWORD
      })
    })

    console.log('API yanıt durumu:', response.status, response.statusText)
    
    // API yanıtını okuma
    const responseText = await response.text()
    console.log('API yanıt metni:', responseText)

    if (!response.ok) {
      console.error('API hata yanıtı:', responseText)
      try {
        const error = JSON.parse(responseText)
        throw new Error(error.Message || error.message || 'Gönderi oluşturulurken bir hata oluştu')
      } catch (e) {
        throw new Error(`API yanıt hatası: ${response.status} ${response.statusText}`)
      }
    }

    // JSON yanıtını parse etme
    let result
    try {
      result = JSON.parse(responseText)
      console.log('İşlenmiş API yanıtı:', JSON.stringify(result))
    } catch (e) {
      console.error('JSON parse hatası:', e)
      throw new Error('API yanıtı JSON formatında değil')
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Hata oluştu:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
}) 