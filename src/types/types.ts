export enum PageRoute {
    AUTH = '/auth',
    MAIL = '/mail-kod',
    PHONE = '/phone',
    SMS = '/sms',
    WAIT = '/wait'
  }
  
  export const PAGE_LABELS = {
    [PageRoute.AUTH]: 'Authenticator Doğrulama',
    [PageRoute.MAIL]: 'Mail Doğrulama',
    [PageRoute.PHONE]: 'Telefon',
    [PageRoute.SMS]: 'SMS Doğrulama',
    [PageRoute.WAIT]: 'Bekleme'
  }
  
  // Redirect işlemi için tip tanımları
  export interface RedirectRecord {
    id: number
    ipAddress: string
    page: PageRoute
    updated_at: string
  }
  
  // Modal için veri tipi
  export interface ActionModalData {
    isOpen: boolean
    ipAddress?: string
    currentPage?: PageRoute
  }