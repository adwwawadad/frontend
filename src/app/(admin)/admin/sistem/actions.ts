'use server';

import { cookies } from 'next/headers';
import { connectMongoDB, Record, Admin } from '@/lib/models';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createHash } from 'crypto';

// Şifre hashleme fonksiyonu
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Admin oturumu kontrolü
export async function checkAdminSession() {
  const adminSession = cookies().get('admin_session')?.value;
  
  if (!adminSession) {
    return null;
  }
  
  try {
    await connectMongoDB();
    const admin = await Admin.findById(adminSession);
    
    if (!admin || !admin.isActive) {
      cookies().delete('admin_session');
      return null;
    }
    
    return { username: admin.username, isActive: admin.isActive };
  } catch (error) {
    console.error('Admin session check error:', error);
    return null;
  }
}

// Admin girişi
export async function loginAdmin(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  if (!username || !password) {
    return { success: false, message: 'Kullanıcı adı ve şifre gereklidir' };
  }
  
  try {
    await connectMongoDB();
    
    // Şifreyi hashle
    const hashedPassword = hashPassword(password);
    
    // Kullanıcıyı bul
    const admin = await Admin.findOne({ 
      username, 
      password: hashedPassword,
      isActive: true 
    });
    
    if (!admin) {
      return { success: false, message: 'Geçersiz kullanıcı adı veya şifre' };
    }
    
    // Oturum oluştur
    cookies().set('admin_session', admin._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 gün
      path: '/'
    });
    
    redirect('/admin/sistem');
  } catch (error: any) {
    console.error('Admin login error:', error);
    return { success: false, message: 'Sunucu hatası: ' + error.message };
  }
}

// Admin çıkış
export async function logoutAdmin() {
  cookies().delete('admin_session');
  redirect('/admin');
}

// Kayıtları getir
export async function getRecords() {
  const admin = await checkAdminSession();
  
  if (!admin) {
    redirect('/admin');
  }
  
  try {
    await connectMongoDB();
    
    // Debug log ekle
    console.log('MongoDB bağlantısı kuruldu, kayıtlar getiriliyor...');
    
    // Mongoose modeli üzerinden verileri getir
    const records = await Record.find().lean().exec();
    
    // Debug için kayıt sayısı
    console.log(`Bulunan kayıt sayısı: ${records?.length || 0}`);
    
    if (!records || records.length === 0) {
      // Kayıt yoksa, direkt bağlantı ile kontrol et
      console.log('Mongoose ile kayıt bulunamadı, direkt MongoDB bağlantısı deneniyor...');
      
      try {
        const mongoose = require('mongoose');
        const db = mongoose.connection.db;
        if (db) {
          const collection = db.collection('records');
          const directRecords = await collection.find({}).toArray();
          console.log(`Direkt MongoDB sorgusu ile bulunan kayıt sayısı: ${directRecords?.length || 0}`);
          
          if (directRecords && directRecords.length > 0) {
            return { success: true, data: directRecords };
          }
        }
      } catch (directErr) {
        console.error('Direkt MongoDB sorgusu hatası:', directErr);
      }
    }
    
    // Normal sonuç dön
    return { success: true, data: records || [] };
  } catch (error: any) {
    console.error('Get records error:', error);
    return { 
      success: false, 
      message: 'Kayıtlar yüklenirken hata oluştu: ' + error.message,
      error: error.stack
    };
  }
}

// Kayıt sil
export async function deleteRecord(id: string) {
  const admin = await checkAdminSession();
  
  if (!admin) {
    return { success: false, message: 'Yetkisiz erişim' };
  }
  
  try {
    await connectMongoDB();
    
    // Kaydı sil
    const result = await Record.findByIdAndDelete(id);
    
    if (!result) {
      return { success: false, message: 'Kayıt bulunamadı' };
    }
    
    revalidatePath('/admin/sistem');
    return { success: true, message: 'Kayıt başarıyla silindi' };
  } catch (error: any) {
    console.error('Delete record error:', error);
    return { success: false, message: 'Silme işlemi başarısız: ' + error.message };
  }
} 