import { NextResponse } from 'next/server';
import { connectMongoDB, Record } from '@/lib/models';
import mongoose from 'mongoose';

// MongoDB koleksiyon tipi
interface MongoCollection {
  name: string;
  type: string;
  options?: Record<string, any>;
  info?: Record<string, any>;
}

// Bir API endpoint'i oluştur
export async function GET() {
  try {
    await connectMongoDB();
    
    // Bağlantı durumunu kontrol et
    const isConnected = mongoose.connection.readyState === 1;
    const dbName = mongoose.connection.db?.databaseName || 'unknown';
    
    // MongoDB koleksiyonlarını listele
    let collections: MongoCollection[] = [];
    if (isConnected && mongoose.connection.db) {
      collections = await mongoose.connection.db.listCollections().toArray() as MongoCollection[];
    }
    
    // Kayıtları getir
    const records = await Record.find().limit(10).lean();
    
    // MongoDB Bağlantı URI'sini güvenli bir şekilde göster (kullanıcı adı ve şifreyi gizle)
    let safeMongoURI = process.env.MONGO_URI || '';
    if (safeMongoURI) {
      safeMongoURI = safeMongoURI.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        isConnected,
        dbName,
        collections: collections.map(c => c.name),
        recordCount: records.length,
        nodeEnv: process.env.NODE_ENV,
        randomDb: {
          enabled: process.env.USE_RANDOM_DB === 'true',
          projectId: process.env.PROJECT_ID || process.env.VERCEL_URL || 'not-set'
        },
        mongoURI: safeMongoURI
      },
      // İlk 5 kaydı göster (varsa)
      sampleRecords: records.slice(0, 5)
    });
  } catch (error: any) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Debug hatası: ' + error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 