import { NextResponse } from 'next/server'
import { connectMongoDB, Active, Record } from '@/lib/models'

// Cache'i devre dışı bırakmak için headers
const cacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

export async function GET() {
  try {
    await connectMongoDB()
    
    // Son 5 saniye içinde görülen aktif IP'leri getir (5 dakika yerine)
    const fiveSecondsAgo = new Date(Date.now() - 5 * 1000) // 5 saniye (5 dakika yerine)
    const activeIps = await Active.find({
      lastSeen: { $gte: fiveSecondsAgo }
    })
    
    // Aktif IP adresleri
    const activeIpAddresses = activeIps.map(ip => ip.ipAddress)
    const activeCount = activeIpAddresses.length
    
    return NextResponse.json(
      { 
        success: true, 
        activeIps: activeIpAddresses, 
        activeCount 
      }, 
      { headers: cacheHeaders }
    )
  } catch (error: any) {
    console.error('Active API error:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500, headers: cacheHeaders }
    )
  }
}

// IP aktiflik işaretlemek için POST endpoint
export async function POST(request: Request) {
  try {
    const { ipAddress } = await request.json()
    
    if (!ipAddress) {
      return NextResponse.json(
        { success: false, message: 'IP adresi gereklidir' },
        { status: 400, headers: cacheHeaders }
      )
    }
    
    await connectMongoDB()
    
    // Upsert: Varsa güncelle, yoksa oluştur
    await Active.findOneAndUpdate(
      { ipAddress },
      { 
        ipAddress,
        lastSeen: new Date(),
        isActive: true
      },
      { upsert: true, new: true }
    )
    
    return NextResponse.json(
      { success: true, message: 'IP aktifleştirildi' }, 
      { headers: cacheHeaders }
    )
  } catch (error: any) {
    console.error('Active API error:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500, headers: cacheHeaders }
    )
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0