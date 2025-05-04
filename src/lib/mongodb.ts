import { MongoClient } from 'mongodb';
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

if (!process.env.MONGO_URI) {
  throw new Error('Lütfen MongoDB URI adresini .env dosyasında tanımlayın');
}

// Proje için sabit veritabanı adıyla URI oluştur
const baseUri = process.env.MONGO_URI;
const uri = process.env.USE_PROJECT_DB === 'true' 
  ? getMongoUriWithStableDb(baseUri)
  : baseUri;

// Veritabanı bağlantı bilgilerini logla
console.log('MongoDB URI konfigürasyonu yapıldı:', uri.replace(/\/\/[^:]+:[^@]+@/, '//****:****@')); // Güvenlik için kullanıcı adı ve şifreyi gizle

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise; 