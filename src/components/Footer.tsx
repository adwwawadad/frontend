"use client";

import Link from 'next/link'
import {  Facebook, Twitter, Plus } from 'lucide-react'
import { useState } from 'react'

const Footer = () => {
  const [openSection, setOpenSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  return (
    <footer className="bg-[#181A20] text-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Accordion Sections */}
        <div className="space-y-4">
          {/* Hakkında Section */}
          <div className="border-b border-gray-700">
            <button 
              onClick={() => toggleSection('hakkinda')}
              className="w-full flex justify-between items-center py-4"
            >
              <span className="text-base font-medium">Hakkında</span>
              <Plus className={`w-5 h-5 transition-transform ${openSection === 'hakkinda' ? 'rotate-45' : ''}`} />
            </button>
            {openSection === 'hakkinda' && (
              <div className="pb-4 space-y-3">
                <Link href="#" className="block text-gray-400 hover:text-white">Ücretler</Link>
                <Link href="#" className="block text-gray-400 hover:text-white">Blog</Link>
                <Link href="#" className="block text-gray-400 hover:text-white">İletişim</Link>
              </div>
            )}
          </div>

          {/* Yasal Bilgiler Section */}
          <div className="border-b border-gray-700">
            <button 
              onClick={() => toggleSection('yasal')}
              className="w-full flex justify-between items-center py-4"
            >
              <span className="text-base font-medium">Yasal Bilgiler</span>
              <Plus className={`w-5 h-5 transition-transform ${openSection === 'yasal' ? 'rotate-45' : ''}`} />
            </button>
            {openSection === 'yasal' && (
              <div className="pb-4 space-y-3">
                <Link href="#" className="block text-gray-400 hover:text-white">Koşullar</Link>
                <Link href="#" className="block text-gray-400 hover:text-white">KVKK Aydınlatma Metni</Link>
                <Link href="#" className="block text-gray-400 hover:text-white">Çerez Politikası</Link>
                <Link href="#" className="block text-gray-400 hover:text-white">Risk</Link>
                <Link href="#" className="block text-gray-400 hover:text-white">Gizlilik Politikası</Link>
                <Link href="#" className="block text-gray-400 hover:text-white">Web Sitesi Yasal Bilgilendirme</Link>
              </div>
            )}
          </div>

          {/* Destek Section */}
          <div className="border-b border-gray-700">
            <button 
              onClick={() => toggleSection('destek')}
              className="w-full flex justify-between items-center py-4"
            >
              <span className="text-base font-medium">Destek</span>
              <Plus className={`w-5 h-5 transition-transform ${openSection === 'destek' ? 'rotate-45' : ''}`} />
            </button>
            {openSection === 'destek' && (
              <div className="pb-4 space-y-3">
                <Link href="#" className="block text-gray-400 hover:text-white">SSS</Link>
                <Link href="#" className="block text-gray-400 hover:text-white">Duyurular</Link>
                <Link href="#" className="block text-gray-400 hover:text-white">Destek Merkezi</Link>
                <Link href="#" className="block text-gray-400 hover:text-white">Canlı Destek</Link>
                <Link href="#" className="block text-gray-400 hover:text-white">API Dökümanı</Link>
              </div>
            )}
          </div>
        </div>

        {/* Company Info */}
        <div className="text-gray-400 space-y-2 p-8">
          <p className="font-medium">BİNANCE TURKEY KRİPTO VARLIK ALIM SATIM PLATFORMU A.Ş.</p>
          <p>Özdilek River Plaza Wyndham Grand Blok 13/32</p>
          <p>Esentepe Mah. Bahar Sok. Şişli / İstanbul</p>
          <p>Email: destek@trbinance.com</p>
        </div>

        {/* Social Links */}
        <div className="mt-6">
          <h3 className="text-base font-medium mb-4">Topluluk</h3>
          <div className="flex gap-4">
        
            <Link href="#" className="text-gray-400 hover:text-white">
              <Facebook className="w-6 h-6" />
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white">
              <Twitter className="w-6 h-6" />
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-gray-700 text-gray-400 text-sm p-4">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex gap-2">
              <Link href="#" className="hover:text-white">© 2024 https://www.binance.tr</Link>
              <span>Tüm hakları saklıdır.</span>
            </div>
            <Link href="#" className="hover:text-white">Çerez Tercihleri</Link>
            <p className="mt-2">BİNANCE TURKEY KRİPTO VARLIK ALIM SATIM PLATFORMU A.Ş. Mersis no: 17814045130001</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer