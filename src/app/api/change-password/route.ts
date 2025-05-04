import { NextResponse } from 'next/server'
import { connectMongoDB, Admin } from '@/lib/models'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

// Şifre hashleme fonksiyonu
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    
    if (!password || password.length < 6) {
      return NextResponse.json({ 
        success: false, 
        message: 'Şifre en az 6 karakter olmalıdır' 
      }, { 
        status: 400 
      })
    }
    
    // Admin oturumunu kontrol et
    const adminSession = cookies().get('admin_session')?.value
    
    if (!adminSession) {
      return NextResponse.json({ 
        success: false, 
        message: 'Yetkisiz erişim' 
      }, { 
        status: 401 
      })
    }
    
    await connectMongoDB()
    
    // Şifreyi hashle
    const hashedPassword = hashPassword(password)
    
    // Admin şifresini güncelle
    const admin = await Admin.findByIdAndUpdate(
      adminSession,
      { password: hashedPassword },
      { new: true }
    )
    
    if (!admin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Admin bulunamadı' 
      }, { 
        status: 404 
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Şifre başarıyla değiştirildi' 
    })
  } catch (error: any) {
    console.error('Change password API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Sunucu hatası: ' + error.message
    }, { 
      status: 500 
    })
  }
}