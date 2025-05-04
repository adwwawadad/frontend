import { NextResponse } from 'next/server'
import { connectMongoDB, Record } from '@/lib/models'

export async function POST() {
  try {
    await connectMongoDB()
    
    // Tüm kayıtları sil
    const result = await Record.deleteMany({})
    
    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} kayıt başarıyla silindi`
    })
  } catch (error: any) {
    console.error('Delete API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Sunucu hatası: ' + error.message
    }, { 
      status: 500 
    })
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0