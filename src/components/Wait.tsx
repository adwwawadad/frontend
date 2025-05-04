"use client"

const LoadingOverlay = () => {
  return (
    <div className="min-h-screen relative inset-0 bg-white flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
        <h2 className="text-[#1E2329] text-xl font-medium mb-4">
          Güvenlik Doğrulaması
        </h2>
        
        <div className="mb-4">
          <img
            src="/loading.gif"
            alt="Loading Animation"
            className="w-32 h-32 mx-auto"
          />
        </div>

        <p className="text-[#707A8A] text-sm">
          İşleminize devam ediliyor, sayfayı kapatmayın
        </p>
      </div>
    </div>
  )
}

export default LoadingOverlay