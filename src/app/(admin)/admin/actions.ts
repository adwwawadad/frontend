'use server';

import { cookies } from 'next/headers';
import { connectMongoDB, Admin } from '@/lib/models';
import { createHash } from 'crypto';

// Şifre hashleme fonksiyonu
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Admin girişi
export async function loginAdmin(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  if (!username || !password) {
    return { 
      success: false, 
      message: 'Kullanıcı adı ve şifre gereklidir',
      redirect: false
    };
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
      return { 
        success: false, 
        message: 'Geçersiz kullanıcı adı veya şifre',
        redirect: false
      };
    }
    
    // Oturum oluştur
    cookies().set('admin_session', admin._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 gün
      path: '/'
    });
    
    // Redirect yapmak yerine başarı bilgisi dön, client tarafında yönlendirme yap
    return { 
      success: true, 
      message: 'Giriş başarılı',
      redirect: true,
      redirectUrl: '/admin/sistem'
    };
  } catch (error: any) {
    console.error('Admin login error:', error);
    return { 
      success: false, 
      message: 'Sunucu hatası: ' + error.message,
      redirect: false
    };
  }
} 