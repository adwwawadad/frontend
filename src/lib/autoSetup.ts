import crypto from 'crypto';

/**
 * Uygulamanın başlangıcında otomatik admin kurulumu için fonksiyon
 * Bu fonksiyon, yapılandırma kontrolünü yapar ve AUTO_SETUP etkinse
 * bir fetch ile setup API'sini çağırarak admin kurulumunu başlatır.
 */
export async function autoSetupAdmin(): Promise<void> {
  try {
    // Eğer build zamanı ise, kurulumu atla
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && process.env.BUILD_MODE === 'true') {
      console.log('[AutoSetup] Build modu tespit edildi, kurulum atlanıyor (çalışma zamanında tekrar deneyecek)');
      return;
    }

    // AUTO_SETUP false ise çalışma
    if (process.env.AUTO_SETUP !== 'true') {
      console.log('[AutoSetup] Otomatik kurulum devre dışı (AUTO_SETUP=false)');
      return;
    }

    console.log('[AutoSetup] Admin kurulumu başlatılıyor...');
    
    // API URL'ini belirleme
    let baseUrl = '';
    
    // Client tarafında mı çalışıyor?
    const isClient = typeof window !== 'undefined';
    
    if (isClient) {
      // Tarayıcıda çalışıyorsa, mevcut window.location kullan
      baseUrl = window.location.origin;
    } else {
      // Server tarafında ise
      // NEXT_PUBLIC_API_URL varsa kullan
      if (process.env.NEXT_PUBLIC_API_URL) {
        baseUrl = process.env.NEXT_PUBLIC_API_URL;
      } 
      // Vercel ortamındaysa
      else if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      }
      // Yerel geliştirme ortamında
      else {
        baseUrl = 'http://localhost:3000';
      }
    }
    
    // URL'nin sonunda / varsa kaldır
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Setup API'yi çağır - token parametresi kaldırıldı çünkü artık route.ts dosyasında kullanılmıyor
    const setupUrl = `${baseUrl}/api/setup`;
    
    console.log(`[AutoSetup] Setup API URL: ${setupUrl}`);
    
    try {
      const response = await fetch(setupUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
        }
      });

      if (!response.ok) {
        console.warn(`[AutoSetup] Hata kodu: ${response.status} ${response.statusText}`);
        return;
      }

      const result = await response.json();

      if (result.success) {
        console.log('[AutoSetup] Admin kurulumu başarılı!', result.message);
        console.log('[AutoSetup] Veritabanı bilgileri:', result.dbInfo);
      } else if (result.message && result.message.includes('Zaten admin kullanıcıları mevcut')) {
        console.log('[AutoSetup] Admin kurulumuna gerek yok, zaten mevcut.');
        console.log('[AutoSetup] Veritabanı bilgileri:', result.dbInfo);
      } else {
        console.warn('[AutoSetup] Admin kurulumu başarısız!', result.message);
      }
    } catch (error) {
      console.error('[AutoSetup] Admin kurulumu sırasında hata oluştu:', error);
    }
  } catch (error) {
    console.error('[AutoSetup] Genel hata:', error);
  }
}

/**
 * Rastgele bir setup token oluşturur.
 * Bu token, .env dosyasına SETUP_TOKEN olarak eklenebilir.
 */
export function generateSetupToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Rastgele bir admin şifresi oluşturur.
 * Bu şifre, .env dosyasına DEFAULT_ADMIN_PASSWORD olarak eklenebilir.
 */
export function generateSecurePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  
  return password;
}

// Eğer token oluşturma fonksiyonu doğrudan çalıştırılırsa, bir örnek token ve şifre üretebilir
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  const exampleToken = generateSetupToken();
  const examplePassword = generateSecurePassword();
  
  console.log('\n=== Güvenlik Ayarları Örneği ===');
  console.log(`SETUP_TOKEN=${exampleToken}`);
  console.log(`DEFAULT_ADMIN_PASSWORD=${examplePassword}`);
  console.log('==============================\n');
} 