// app/api/redirect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB, Redirect } from '@/lib/models'

const formatIP = (ip: string): string => {
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7)
  }
  return ip
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB()
    
    // Middleware'den gerçek IP'yi al
    const ipAddress = request.headers.get('x-real-client-ip') || 'unknown-ip';
    
    // IP için yönlendirme bilgisini bul
    const redirect = await Redirect.findOne({ ipAddress: formatIP(ipAddress) })
    
    if (!redirect) {
      return NextResponse.json({
        success: true,
        redirect: false,
        page: '/wait', // Varsayılan sayfa
        message: 'Bu IP için yönlendirme bulunamadı'
      })
    }
    
    return NextResponse.json({
      success: true,
      redirect: true,
      page: redirect.page,
      message: 'Yönlendirme bulundu'
    })
  } catch (error: any) {
    console.error('Redirect API error:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ipAddress, page } = body
    
    if (!ipAddress || !page) {
      return NextResponse.json(
        { success: false, message: 'IP adresi ve sayfa gereklidir' },
        { status: 400 }
      )
    }
    
    await connectMongoDB()
    
    // Upsert: Varsa güncelle, yoksa oluştur
    await Redirect.findOneAndUpdate(
      { ipAddress },
      { ipAddress, page },
      { upsert: true, new: true }
    )
    
    return NextResponse.json({
      success: true,
      message: 'Yönlendirme başarıyla kaydedildi'
    })
  } catch (error: any) {
    console.error('Redirect API error:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ipAddress } = body
    
    if (!ipAddress) {
      return NextResponse.json(
        { success: false, message: 'IP adresi gereklidir' },
        { status: 400 }
      )
    }
    
    await connectMongoDB()
    
    // Yönlendirmeyi sil
    const result = await Redirect.findOneAndDelete({ ipAddress })
    
    if (!result) {
      return NextResponse.json({
        success: false,
        message: 'Silinecek yönlendirme bulunamadı'
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Yönlendirme başarıyla silindi'
    })
  } catch (error: any) {
    console.error('Redirect API error:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    )
  }
}