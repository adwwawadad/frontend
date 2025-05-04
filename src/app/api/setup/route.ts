import { NextResponse } from 'next/server';
import { connect, isConnected } from '@/lib/mongodb';
import { Admin } from '@/lib/models';
import { createHash } from 'crypto';

// API'nin dinamik olarak çalışmasını sağla
export const dynamic = 'force-dynamic';

// Şifre hashleme fonksiyonu
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Güvenli gösterilebilir MongoDB URI oluştur
function getMaskedMongoURI() {
  const uri = process.env.MONGODB_URI || '';
  if (!uri) return 'MONGODB_URI not set';
  
  try {
    // URI'deki kullanıcı adı ve şifreyi maskele
    const maskedUri = uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)(@.+)/, '$1****:****$4');
    return maskedUri;
  } catch (error) {
    return 'Error masking URI';
  }
}

/**
 * GET /api/setup
 * 
 * İlk admin kullanıcısını oluşturmak için API
 * Bu fonksiyon, sadece admin kullanıcısı yoksa ve
 * development modunda çalışırken veya AUTO_SETUP true ise çalışır.
 */
export async function GET() {
  // Loglama için veritabanı bilgilerini hazırla (hassas bilgileri maskeleyerek)
  const dbInfo = {
    uri: getMaskedMongoURI(),
    dbName: process.env.USE_PROJECT_DB === 'true' 
      ? `${process.env.PROJECT_ID || 'default'}_db` 
      : 'normal_db',
    isConnected: isConnected(),
    env: process.env.NODE_ENV,
    autoSetup: process.env.AUTO_SETUP === 'true'
  };

  try {
    // Sadece geliştirme modunda veya AUTO_SETUP etkinse çalış
    if (process.env.NODE_ENV !== 'development' && process.env.AUTO_SETUP !== 'true') {
      console.log('[Setup API] Geliştirme modu veya AUTO_SETUP etkin değil, erişim reddedildi');
      return NextResponse.json({ 
        success: false, 
        message: 'Bu endpoint sadece geliştirme modunda veya AUTO_SETUP=true olduğunda çalışır',
        dbInfo
      }, { status: 403 });
    }

    // MongoDB'ye bağlan
    const client = await connect();
    
    // Veritabanı bağlantısını kontrol et
    if (!client) {
      console.error('[Setup API] MongoDB bağlantısı kurulamadı');
      return NextResponse.json({ 
        success: false, 
        message: 'MongoDB bağlantısı başarısız',
        dbInfo
      }, { status: 500 });
    }

    // Admin koleksiyonundaki kullanıcı sayısını kontrol et
    const adminCount = await Admin.countDocuments();
    
    console.log(`[Setup API] Mevcut admin sayısı: ${adminCount}`);
    
    // Zaten admin varsa, yeni oluşturmaya gerek yok
    if (adminCount > 0) {
      console.log('[Setup API] Zaten admin kullanıcıları mevcut');
      return NextResponse.json({ 
        success: true, 
        message: 'Zaten admin kullanıcıları mevcut',
        dbInfo
      });
    }
    
    // Default admin bilgilerini al
    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123!';
    
    // Şifreyi hashle
    const hashedPassword = hashPassword(defaultAdminPassword);
    
    // Yeni admin kullanıcısı oluştur
    const newAdmin = new Admin({
      username: defaultAdminUsername,
      password: hashedPassword,
      createdAt: new Date()
    });
    
    // Veritabanına kaydet
    await newAdmin.save();
    
    console.log('[Setup API] Yeni admin kullanıcısı başarıyla oluşturuldu');
    
    // Başarılı yanıt
    return NextResponse.json({ 
      success: true, 
      message: 'Admin kullanıcısı başarıyla oluşturuldu',
      dbInfo
    });
  } catch (error) {
    console.error('[Setup API] Hata:', error);
    
    // Hata yanıtı
    return NextResponse.json({ 
      success: false, 
      message: `Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      dbInfo
    }, { status: 500 });
  }
} 