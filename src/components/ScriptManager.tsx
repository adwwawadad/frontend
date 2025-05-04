'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Code, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Save 
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";

// Script tipi
interface ScriptType {
  _id: string;
  name: string;
  content: string;
  placement: 'head' | 'body';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function ScriptManager() {
  const [scripts, setScripts] = useState<ScriptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [currentScript, setCurrentScript] = useState<ScriptType | null>(null);
  
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [placement, setPlacement] = useState<'head' | 'body'>('head');
  const [saving, setSaving] = useState(false);
  
  // Scriptleri yükle
  const loadScripts = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/scripts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setScripts(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: result.message || "Scriptler yüklenemedi"
        });
      }
    } catch (error) {
      console.error('Script yükleme hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Scriptler yüklenirken bir hata oluştu"
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  // İlk yükleme
  useEffect(() => {
    loadScripts();
  }, [loadScripts]);
  
  // Script oluşturma modunu aç
  const handleNewScript = () => {
    setEditMode(false);
    setCurrentScript(null);
    setName('');
    setContent('');
    setPlacement('head');
  };
  
  // Script düzenleme modunu aç
  const handleEditScript = (script: ScriptType) => {
    setEditMode(true);
    setCurrentScript(script);
    setName(script.name);
    setContent(script.content);
    setPlacement(script.placement);
  };
  
  // Script kaydetme
  const handleSaveScript = async () => {
    if (!name || !content) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Script adı ve içeriği gereklidir"
      });
      return;
    }
    
    try {
      setSaving(true);
      
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          content,
          placement,
          scriptId: editMode && currentScript ? currentScript._id : undefined
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Başarılı",
          description: result.message
        });
        
        await loadScripts();
        handleNewScript();
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: result.message
        });
      }
    } catch (error) {
      console.error('Script kaydetme hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Script kaydedilirken bir hata oluştu"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Script silme
  const handleDeleteScript = async (scriptId: string) => {
    if (!confirm('Bu scripti silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/scripts?scriptId=${scriptId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Başarılı",
          description: "Script başarıyla silindi"
        });
        
        await loadScripts();
        
        if (currentScript && currentScript._id === scriptId) {
          handleNewScript();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: result.message
        });
      }
    } catch (error) {
      console.error('Script silme hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Script silinirken bir hata oluştu"
      });
    }
  };
  
  // Script aktiflik durumunu değiştirme
  const handleToggleActive = async (scriptId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/scripts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scriptId,
          isActive: !isActive
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Başarılı",
          description: result.message
        });
        
        await loadScripts();
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: result.message
        });
      }
    } catch (error) {
      console.error('Script aktiflik değiştirme hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Script durumu değiştirilirken bir hata oluştu"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="list">
        <TabsList className="mb-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Script Listesi
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center gap-2">
            {editMode ? (
              <>
                <Edit className="h-4 w-4" />
                Scripti Düzenle
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                Yeni Script
              </>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Script Listesi</h3>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={loadScripts}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
              <Button 
                size="sm" 
                onClick={handleNewScript}
                className="h-8"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Yeni Script
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Ad</TableHead>
                  <TableHead>Yerleşim</TableHead>
                  <TableHead className="w-[150px]">Durum</TableHead>
                  <TableHead className="text-right w-[150px]">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scripts.length > 0 ? (
                  scripts.map((script) => (
                    <TableRow key={script._id}>
                      <TableCell className="font-medium">{script.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          script.placement === 'head' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {script.placement === 'head' ? 'HEAD' : 'BODY'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(script._id, script.isActive)}
                          className={`h-7 px-2 ${script.isActive ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {script.isActive ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Aktif
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="h-4 w-4" />
                              Kapalı
                            </span>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditScript(script)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteScript(script._id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {loading ? (
                        <div className="flex justify-center items-center">
                          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                          Scriptler yükleniyor...
                        </div>
                      ) : (
                        "Henüz script eklememiş."
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="edit">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {editMode ? 'Scripti Düzenle' : 'Yeni Script Ekle'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="scriptName" className="text-sm font-medium">Script Adı</label>
                <Input
                  id="scriptName"
                  placeholder="Meta Pixel, Google Analytics, vb."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Yerleşim</label>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="head"
                      name="placement"
                      value="head"
                      checked={placement === 'head'}
                      onChange={() => setPlacement('head')}
                      className="mr-2"
                    />
                    <label htmlFor="head">HEAD (Sayfa başı)</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="body"
                      name="placement"
                      value="body"
                      checked={placement === 'body'}
                      onChange={() => setPlacement('body')}
                      className="mr-2"
                    />
                    <label htmlFor="body">BODY (Sayfa sonu)</label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="scriptContent" className="text-sm font-medium">Script İçeriği</label>
              <Textarea
                id="scriptContent"
                placeholder="<!-- Meta Pixel Code --> <script>... </script>"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] font-mono"
              />
              <p className="text-xs text-gray-500">
                Script kodunu tam olarak buraya yapıştırın. Örneğin: <code>&lt;script&gt;...&lt;/script&gt;</code>
              </p>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleNewScript}
              >
                Temizle
              </Button>
              <Button
                onClick={handleSaveScript}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editMode ? 'Güncelle' : 'Kaydet'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 