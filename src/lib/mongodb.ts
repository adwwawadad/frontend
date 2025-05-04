import { MongoClient } from 'mongodb';
import crypto from 'crypto';

// Rastgele veritabanı adı oluşturma fonksiyonu
function generateDbName(length: number = 8): string {
  return crypto.randomBytes(length).toString('hex');
}

// MongoDB URI'yi güncelleme fonksiyonu
function getMongoUriWithRandomDb(baseUri: string): string {
  // URI'yi ayrıştır
  const lastSlash = baseUri.lastIndexOf('/');
  
  // Eğer URI'de / yoksa, sonuna /randomDbName ekle
  if (lastSlash === -1) {
    return `${baseUri}/${generateDbName()}`;
  }
  
  // Eğer URI'de / varsa, sonuncu / sonrasını kontrol et
  const baseUriWithoutDb = baseUri.substring(0, lastSlash);
  
  // Proje kodu veya environment'tan alınabilecek sabit bir değer
  // Bu değer, projeye özgü olabilir veya process.env üzerinden gelebilir
  const projectIdentifier = process.env.PROJECT_ID || process.env.VERCEL_URL || '';
  
  // Veritabanı adını oluştur (projeye özgü olması için projectIdentifier'ı da kullan)
  const dbNameSeed = `${projectIdentifier}${Date.now()}`;
  const dbName = crypto.createHash('md5').update(dbNameSeed).digest('hex').substring(0, 10);
  
  return `${baseUriWithoutDb}/${dbName}`;
}

if (!process.env.MONGO_URI) {
  throw new Error('Lütfen MongoDB URI adresini .env dosyasında tanımlayın');
}

// Rastgele veritabanı adıyla URI oluştur
const baseUri = process.env.MONGO_URI;
const uri = process.env.USE_RANDOM_DB === 'true' 
  ? getMongoUriWithRandomDb(baseUri)
  : baseUri;

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