'use client'

import React, { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const UserTracker = () => {
  const pathname = usePathname()
  const router = useRouter()
  const lastRedirectPage = useRef<string | null>(null)
  const lastCheckedTime = useRef<number>(Date.now())

  const getUserOS = () => {
    const userAgent = window.navigator.userAgent
    const platform = window.navigator.platform
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']
    const iosPlatforms = ['iPhone', 'iPad', 'iPod']
    let os = null

    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS'
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS'
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows'
    } else if (/Android/.test(userAgent)) {
      os = 'Android'
    } else if (/Linux/.test(platform)) {
      os = 'Linux'
    }

    return os || 'Unknown'
  }

  // Tarayıcı fingerprint'i kullanarak benzersiz bir ID oluştur
  // NOT: Bu fonksiyon her seferinde aynı ID'yi döndürecek şekilde basitleştirilmiştir
  const generateClientId = () => {
    return "fixed-client-id-123456";
  }

  // Sadece admin değişikliği olduğunda yönlendir
  const checkAdminRedirect = async () => {
    try {
      const response = await fetch('/api/redirect')
      const data = await response.json()

      if (data.success && data.page) {
        // Sadece redirect true ise ve farklı bir sayfaya yönleniyorsa işlem yap
        if (
          data.redirect && // API redirect flag'i true
          data.page !== pathname && // Farklı bir sayfa
          data.page !== lastRedirectPage.current // Daha önce yönlendirilmediğimiz bir sayfa
        ) {
          lastRedirectPage.current = data.page
          router.push(data.page)
        }
      }
    } catch (error) {
      console.error('Redirect check error:', error)
    }
  }

  // Kullanıcının mevcut sayfasını DB'ye kaydet
  const updateCurrentPage = async () => {
    try {
      // IP artık sunucu tarafında belirlenecek
      const userData = {
        os: getUserOS(),
        page: pathname
      }

      await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
    } catch (error) {
      console.error('Page update error:', error)
    }
  }

  useEffect(() => {
    // Her sayfa değişiminde mevcut sayfayı güncelle
    updateCurrentPage()

    // Her 3 saniyede bir admin yönlendirmesi kontrol et
    const redirectInterval = setInterval(checkAdminRedirect, 3000)

    // Her 3 saniyede bir mevcut sayfayı güncelle
    const updateInterval = setInterval(updateCurrentPage, 3000)

    return () => {
      clearInterval(redirectInterval)
      clearInterval(updateInterval)
    }
  }, [pathname])

  return null
}

export default UserTracker