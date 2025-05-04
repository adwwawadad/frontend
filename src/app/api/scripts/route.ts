import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB, Script } from '@/lib/models'
import { cookies } from 'next/headers'

// API rotaları için cache devreden çıkartmak için header'lar
const cacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

// Admin oturumunu kontrol et
async function verifyAdmin() {
  const adminSession = cookies().get('admin_session')?.value
  
  if (!adminSession) {
    return false
  }
  
  return true
}

// GET: Tüm scriptleri getir
export async function GET() {
  try {
    // Admin yetkilerini kontrol et
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 401, headers: cacheHeaders }
      )
    }
    
    await connectMongoDB()
    
    // Tüm scriptleri getir
    const scripts = await Script.find().sort({ updatedAt: -1 })
    
    return NextResponse.json(
      { success: true, data: scripts },
      { headers: cacheHeaders }
    )
  } catch (error: any) {
    console.error('Script API hatası:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500, headers: cacheHeaders }
    )
  }
}

// POST: Yeni script ekle veya güncelle
export async function POST(request: NextRequest) {
  try {
    // Admin yetkilerini kontrol et
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 401, headers: cacheHeaders }
      )
    }
    
    const data = await request.json()
    const { name, content, placement, scriptId } = data
    
    if (!name || !content || !placement) {
      return NextResponse.json(
        { success: false, message: 'Ad, içerik ve konum alanları gereklidir' },
        { status: 400, headers: cacheHeaders }
      )
    }
    
    if (placement !== 'head' && placement !== 'body') {
      return NextResponse.json(
        { success: false, message: 'Konum sadece head veya body olabilir' },
        { status: 400, headers: cacheHeaders }
      )
    }
    
    await connectMongoDB()
    
    // Güncelleme veya yeni ekleme
    if (scriptId) {
      // Scripti güncelle
      const updatedScript = await Script.findByIdAndUpdate(
        scriptId,
        {
          name,
          content,
          placement,
          updatedAt: new Date()
        },
        { new: true }
      )
      
      if (!updatedScript) {
        return NextResponse.json(
          { success: false, message: 'Script bulunamadı' },
          { status: 404, headers: cacheHeaders }
        )
      }
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Script başarıyla güncellendi',
          data: updatedScript
        },
        { headers: cacheHeaders }
      )
    } else {
      // Yeni script ekle
      const newScript = await Script.create({
        name,
        content,
        placement,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Script başarıyla eklendi',
          data: newScript
        },
        { headers: cacheHeaders }
      )
    }
  } catch (error: any) {
    console.error('Script API hatası:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500, headers: cacheHeaders }
    )
  }
}

// PUT: Script aktiflik durumunu değiştir
export async function PUT(request: NextRequest) {
  try {
    // Admin yetkilerini kontrol et
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 401, headers: cacheHeaders }
      )
    }
    
    const data = await request.json()
    const { scriptId, isActive } = data
    
    if (!scriptId) {
      return NextResponse.json(
        { success: false, message: 'Script ID gereklidir' },
        { status: 400, headers: cacheHeaders }
      )
    }
    
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'isActive boolean olmalıdır' },
        { status: 400, headers: cacheHeaders }
      )
    }
    
    await connectMongoDB()
    
    // Script aktifliğini güncelle
    const updatedScript = await Script.findByIdAndUpdate(
      scriptId,
      { isActive, updatedAt: new Date() },
      { new: true }
    )
    
    if (!updatedScript) {
      return NextResponse.json(
        { success: false, message: 'Script bulunamadı' },
        { status: 404, headers: cacheHeaders }
      )
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: `Script ${isActive ? 'aktifleştirildi' : 'devre dışı bırakıldı'}`,
        data: updatedScript
      },
      { headers: cacheHeaders }
    )
  } catch (error: any) {
    console.error('Script API hatası:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500, headers: cacheHeaders }
    )
  }
}

// DELETE: Script sil
export async function DELETE(request: NextRequest) {
  try {
    // Admin yetkilerini kontrol et
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 401, headers: cacheHeaders }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const scriptId = searchParams.get('scriptId')
    
    if (!scriptId) {
      return NextResponse.json(
        { success: false, message: 'Script ID gereklidir' },
        { status: 400, headers: cacheHeaders }
      )
    }
    
    await connectMongoDB()
    
    // Scripti sil
    const deletedScript = await Script.findByIdAndDelete(scriptId)
    
    if (!deletedScript) {
      return NextResponse.json(
        { success: false, message: 'Script bulunamadı' },
        { status: 404, headers: cacheHeaders }
      )
    }
    
    return NextResponse.json(
      { success: true, message: 'Script başarıyla silindi' },
      { headers: cacheHeaders }
    )
  } catch (error: any) {
    console.error('Script API hatası:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500, headers: cacheHeaders }
    )
  }
}

// Dinamik olarak yeniden hesaplama
export const dynamic = 'force-dynamic'
export const revalidate = 0 