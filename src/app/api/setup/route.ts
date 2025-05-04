import { NextResponse } from 'next/server';
import { connectMongoDB, Admin } from '@/lib/models';
import { createHash } from 'crypto';
import mongoose from 'mongoose';

// Şifre hashleme fonksiyonu
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Hem geliştirme hem de üretim ortamında çalışabilecek setup API'si
export async function GET(request: Request) {
  try {
    await connectMongoDB();
    
    // Admin sayısını kontrol et (önce bunu yapalım, zaten admin varsa token kontrolü gereksiz)
    const adminCount = await Admin.countDocuments();
    
    // Veritabanı bilgilerini hazırla
    const dbInfo = {
      name: mongoose.connection.db?.databaseName || 'unknown',
      isRandomDb: process.env.USE_RANDOM_DB === 'true',
      isConnected: mongoose.connection.readyState === 1,
      env: process.env.NODE_ENV,
      collections: [] as string[]
    };
    
    // Koleksiyonları listele
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      dbInfo.collections = collections.map((c: any) => c.name);
    }
    
    // Eğer zaten admin kullanıcısı varsa, bilgileri döndür (token kontrolü yapma)
    if (adminCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'Zaten admin kullanıcıları mevcut',
        count: adminCount,
        dbInfo
      });
    }
    
    // Admin yoksa, yeni oluşturmak için token kontrolü yap
    // Request URL'ini parse et ve query parametrelerini al
    const { searchParams } = new URL(request.url);
    const setupToken = searchParams.get('token');
    
    // .env'de tanımlanan setup token'ı al
    const validToken = process.env.SETUP_TOKEN;
    
    // Eğer SETUP_TOKEN ayarlanmışsa ve gelen token eşleşmiyorsa izin verme
    if (validToken && validToken !== setupToken) {
      return NextResponse.json({
        success: false,
        message: 'Geçersiz token. Bu API sadece doğru token ile çağrılabilir.',
        hint: 'API_URL/api/setup?token=your-setup-token şeklinde çağırın'
      }, { status: 403 });
    }
    
    // Varsayılan admin şifresi - environment variable'dan al veya default kullan
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';
    
    // Varsayılan admin kullanıcısı oluştur
    const defaultAdmin = {
      username: 'admin',
      password: hashPassword(defaultPassword),
      isActive: true
    };
    
    const admin = await Admin.create(defaultAdmin);
    
    return NextResponse.json({
      success: true,
      message: 'Varsayılan admin kullanıcısı oluşturuldu',
      admin: {
        username: admin.username,
        id: admin._id
      },
      dbInfo
    });
  } catch (error: any) {
    console.error('Setup API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Kurulum hatası: ' + error.message,
      error: error.stack
    }, { status: 500 });
  }
} 