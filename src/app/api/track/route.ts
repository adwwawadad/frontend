// app/api/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB, Active, Redirect, Record } from '@/lib/models'

const formatIP = (ip: string): string => {
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7)
  }
  return ip
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Middleware tarafından eklenen header'dan IP al (en güvenilir)
    let ipAddress = request.headers.get('x-real-client-ip') || '';
    
    // Header yoksa, body'den gelen ipAddress'i kullan
    if (!ipAddress) {
      ipAddress = body.ipAddress || 'unknown-ip';
    }
    
    // IP'yi formatla
    ipAddress = formatIP(ipAddress);
    
    await connectMongoDB()
    
    // Kullanıcı kaydını kontrol et/güncelle - Login olan kullanıcının bilgilerini takip edebilmek için
    const existingRecord = await Record.findOne({ ipAddress }).sort({ createdAt: -1 });
    
    // IP aktiflik durumunu güncelle
    await Active.findOneAndUpdate(
      { ipAddress },
      { 
        ipAddress,
        lastSeen: new Date(),
        isActive: true,
        os: body.os || 'Bilinmiyor'
      },
      { upsert: true, new: true }
    )

    // Redirect verisini güncelle - her zaman güncel sayfayı kaydet
    if (body.page) {
      await Redirect.findOneAndUpdate(
        { ipAddress },
        { 
          ipAddress,
          page: body.page
        },
        { upsert: true, new: true }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Takip bilgileri güncellendi',
      ip: ipAddress,
      isLoggedIn: !!existingRecord?.username
    })
  } catch (error: any) {
    console.error('Track API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Sunucu hatası: ' + error.message 
      },
      { status: 500 }
    )
  }
}