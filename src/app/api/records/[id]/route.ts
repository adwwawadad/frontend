import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB, Record } from '@/lib/models';
import { cookies } from 'next/headers';

// DELETE: Kayıt silme
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin oturumunu kontrol et
    const adminSession = cookies().get('admin_session')?.value;
    
    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Kayıt ID gereklidir' },
        { status: 400 }
      );
    }
    
    await connectMongoDB();
    
    // Kaydı sil
    const result = await Record.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Kayıt bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Kayıt başarıyla silindi'
    });
  } catch (error: any) {
    console.error('API hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    );
  }
} 