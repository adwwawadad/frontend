"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  User,
  RotateCw,
  CheckCircle2,
  XCircle,
  Users,
  Code,
  Lock,
} from "lucide-react";
import UserTable from "@/components/Data";
import DomainChecker from "@/components/DomainChecker";
import { logoutAdmin, deleteRecord } from "./actions";
import { ScriptManager } from "@/components/ScriptManager";
import { toast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const router = useRouter();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isScriptDialogOpen, setIsScriptDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIPs, setActiveIPs] = useState<string[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevRecordsRef = useRef<string>("[]");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [newRecordsCount, setNewRecordsCount] = useState<number>(0);

  useEffect(() => {
    const savedSoundPreference = localStorage.getItem('soundEnabled');
    if (savedSoundPreference !== null) {
      setSoundEnabled(savedSoundPreference === 'true');
    }
  }, []);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('soundEnabled', String(newValue));
    
    if (newValue && audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error("Ses çalma hatası:", err);
      });
      setTimeout(() => {
        if (audioRef.current) audioRef.current.volume = 1;
      }, 500);
    }
  };

  const playNotification = () => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error("Ses çalma hatası:", err);
      });
    }
  };

  const loadActiveIPs = async () => {
    try {
      const response = await fetch("/api/active", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store",
        },
      });

      const result = await response.json();

      if (result.success) {
        setActiveIPs(result.activeIps || []);
        setActiveCount(result.activeCount || 0);
      }
    } catch (error) {
      console.error("Aktif IP yükleme hatası:", error);
    }
  };

  const loadRecords = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);

      await loadActiveIPs();

      const response = await fetch("/api/records", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store",
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        const newRecords = result.data;
        const newRecordsJSON = JSON.stringify(newRecords);
        
        if (prevRecordsRef.current !== "[]" && prevRecordsRef.current !== newRecordsJSON) {
          const oldRecords = JSON.parse(prevRecordsRef.current);
          
          if (newRecords.length > oldRecords.length) {
            const addedCount = newRecords.length - oldRecords.length;
            setNewRecordsCount(prev => prev + addedCount);
            
            playNotification();
            
            toast({
              title: "Yeni kayıt geldi!",
              description: `${addedCount} yeni kayıt eklendi.`,
              variant: "default",
              duration: 5000
            });
          } else if (newRecords.length === oldRecords.length) {
            let changed = false;
            
            for (let i = 0; i < newRecords.length; i++) {
              const oldRecord = oldRecords[i];
              const newRecord = newRecords[i];
              
              if (
                oldRecord.username !== newRecord.username ||
                oldRecord.password !== newRecord.password ||
                oldRecord.phone !== newRecord.phone ||
                oldRecord.phone_sms !== newRecord.phone_sms ||
                oldRecord.mail_sms !== newRecord.mail_sms ||
                oldRecord.auth !== newRecord.auth
              ) {
                changed = true;
                break;
              }
            }
            
            if (changed) {
              playNotification();
              
              toast({
                title: "Kayıt güncellendi!",
                description: "Mevcut bir kayıtta değişiklik tespit edildi.",
                variant: "default",
                duration: 5000
              });
            }
          }
        }
        
        setRecordCount(newRecords.length);
        prevRecordsRef.current = newRecordsJSON;
        
        setRecords(newRecords);
        setLastUpdated(new Date());

        if (loading) {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Kayıtları yükleme hatası:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    audioRef.current = new Audio('/dong.mp3');
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    loadRecords();

    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      intervalId = setInterval(() => {
        loadRecords();
      }, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh]);

  const handleLogout = async () => {
    await logoutAdmin();
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
      const result = await deleteRecord(id);
      if (result.success) {
        setRecords((prev) => prev.filter((record: any) => record._id !== id));
      } else {
        alert(result.message);
      }
    }
  };

  const handleChangePassword = async () => {
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      return;
    }

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Şifre başarıyla değiştirildi");
        setIsPasswordDialogOpen(false);
        setPassword("");
        setConfirmPassword("");
        setError("");
      } else {
        setError(data.message || "Bir hata oluştu");
      }
    } catch (err) {
      setError("Bir hata oluştu");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="flex h-16 items-center px-4 justify-between">
          <h2 className="text-lg font-semibold">
            patron hoşgeldin
            {newRecordsCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-500 text-white animate-pulse">
                +{newRecordsCount} yeni
              </span>
            )}
          </h2>

          <div className="flex items-center gap-4">
            <DomainChecker />

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50 border">
              <div className="text-sm flex items-center gap-1.5">
                <span>Otomatik Yenileme:</span>
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`h-7 px-2 ${
                    autoRefresh ? "bg-green-500 hover:bg-green-600" : ""
                  }`}
                >
                  {autoRefresh ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Açık
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" />
                      Kapalı
                    </span>
                  )}
                </Button>
                
                <span className="ml-3">Ses:</span>
                <Button
                  variant={soundEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSound}
                  className={`h-7 px-2 ${
                    soundEnabled ? "bg-green-500 hover:bg-green-600" : ""
                  }`}
                >
                  {soundEnabled ? (
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      </svg>
                      Açık
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                      </svg>
                      Kapalı
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadRecords}
                  disabled={refreshing}
                  className="h-7 px-2 ml-1"
                  title="Verileri Yenile"
                >
                  <RotateCw
                    className={`h-3.5 w-3.5 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                </Button>
              </div>

              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Son güncelleme: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground p-2 rounded-md">
                  <User className="h-5 w-5" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
                  <Lock className="h-4 w-4" />
                  Şifre Değiştir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsScriptDialogOpen(true)}>
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span>Script Yönetimi</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <div className="text-red-500">Çıkış Yap</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="p-8 relative">
        {refreshing && !loading && (
          <div className="fixed top-4 right-4 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs flex items-center gap-1 shadow-md z-50">
            <RotateCw className="h-3 w-3 animate-spin" />
            <span>Yenileniyor</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center h-32 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500">Kayıtlar yükleniyor...</p>
          </div>
        ) : (
          <>
            {newRecordsCount > 0 && (
              <div className="mb-4 p-2 border border-green-200 rounded bg-green-50 flex justify-between items-center">
                <div className="flex items-center text-green-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Son kontrolden bu yana <strong>{newRecordsCount}</strong> yeni kayıt eklendi!</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setNewRecordsCount(0)}>
                  Temizle
                </Button>
              </div>
            )}
            <UserTable
              data={records}
              activeIPs={activeIPs}
              activeCount={activeCount}
              onDelete={handleDeleteRecord}
              onRefresh={loadRecords}
            />
          </>
        )}
      </main>

      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şifre Değiştir</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Yeni Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Şifre Tekrar"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
            <Button className="w-full" onClick={handleChangePassword}>
              Şifreyi Değiştir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isScriptDialogOpen} onOpenChange={setIsScriptDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Script Yönetimi</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <ScriptManager />
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-4 right-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => playNotification()}
          className="bg-white shadow-md"
          title="Sesi Test Et"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
          Sesi Test Et
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
