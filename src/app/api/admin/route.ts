import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { connectMongoDB, Admin } from '@/lib/models'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

// Şifre hashleme fonksiyonu
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// GET: Admin oturumunu kontrol et
export async function GET() {
  try {
    const adminSession = cookies().get('admin_session')?.value
    
    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: 'Oturum bulunamadı' },
        { status: 401 }
      )
    }
    
    await connectMongoDB()
    const admin = await Admin.findById(adminSession)
    
    if (!admin || !admin.isActive) {
      cookies().delete('admin_session')
      return NextResponse.json(
        { success: false, message: 'Geçersiz veya pasif oturum' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        username: admin.username,
        isActive: admin.isActive
      }
    })
  } catch (error: any) {
    console.error('Admin API hatası:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    )
  }
}

// POST: Admin girişi
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB()
    
    const data = await request.json()
    const { username, password } = data
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı ve şifre gereklidir' },
        { status: 400 }
      )
    }
    
    // Şifreyi hashle
    const hashedPassword = hashPassword(password)
    
    // Kullanıcıyı bul
    const admin = await Admin.findOne({ 
      username, 
      password: hashedPassword,
      isActive: true 
    })
    
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz kullanıcı adı veya şifre' },
        { status: 401 }
      )
    }
    
    // Oturum oluştur
    cookies().set('admin_session', admin._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 gün
      path: '/'
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Giriş başarılı'
    })
  } catch (error: any) {
    console.error('Admin API hatası:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    )
  }
}