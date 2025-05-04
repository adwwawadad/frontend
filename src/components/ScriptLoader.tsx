'use client';

import { useEffect, useRef } from 'react';

interface ScriptType {
  _id: string;
  name: string;
  content: string;
  placement: 'head' | 'body';
  isActive: boolean;
}

interface ScriptLoaderProps {
  scripts: ScriptType[];
}

export function ScriptLoader({ scripts }: ScriptLoaderProps) {
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scriptContainerRef.current || scripts.length === 0) return;

    // Önceki scriptleri temizle
    scriptContainerRef.current.innerHTML = '';

    // Her bir script için
    scripts.forEach(script => {
      if (!script.isActive) return;

      // HTML içeriği olarak script'i ekle
      const scriptContainer = document.createElement('div');
      scriptContainer.innerHTML = script.content;

      // Script taglarını bul ve sayfaya ekle
      const scriptTags = scriptContainer.querySelectorAll('script');
      scriptTags.forEach(scriptTag => {
        const newScript = document.createElement('script');
        
        // Orijinal script'in özelliklerini kopyala
        Array.from(scriptTag.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Script içeriğini kopyala
        newScript.innerHTML = scriptTag.innerHTML;
        
        // Sayfaya ekle
        document.head.appendChild(newScript);
      });

      // Script olmayan (noscript, img vs.) içeriği doğrudan ekle
      scriptContainerRef.current?.appendChild(scriptContainer);
    });
  }, [scripts]);

  // Boş bir div döndür, script'ler JavaScript ile eklenecek
  return <div ref={scriptContainerRef} />;
} 