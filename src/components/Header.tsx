import Image from 'next/image'
import Link from 'next/link'
import { Menu } from 'lucide-react'

const Header = () => {
  return (
    <header className="w-full bg-[#0C0C0C] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Binance TR Logo"
                  width={130}
                  height={32}
                  className="h-6 w-auto"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-gray-300 hover:text-white px-3 py-2">
              Giriş Yap
            </Link>
            <Link 
              href="#" 
              className="bg-[#FCD535] text-black hover:bg-[#FCD535]/90 px-4 py-2 rounded-md font-medium"
            >
              Hesap Oluştur
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-4">
            <Link 
              href="#" 
              className="bg-[#FCD535] text-black hover:bg-[#FCD535]/90 px-4 py-2 rounded-md text-sm font-medium"
            >
              Kaydol
            </Link>
            <button
              type="button"
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header