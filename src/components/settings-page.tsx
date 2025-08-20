
'use client';

import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { User as UserIcon, Check, Save, KeyRound, QrCode } from 'lucide-react';
import { Switch } from './ui/switch';
import type { Settings, User } from '@/lib/types';
import { useTheme } from 'next-themes';
import { useEffect, useState }from 'react';
import { updateUserSettings, changeUserPassword, generateTempLoginToken } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from './ui/dialog';
import { PasswordInput } from './ui/password-input';
import QRCode from "react-qr-code";
import { Skeleton } from './ui/skeleton';

interface SettingsPageProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  user: User | null;
}

const colorThemes = [
    { name: 'default', gradient: 'linear-gradient(to right, hsl(243 80% 63%), hsl(256 90% 66%))' },
    { name: 'crimson', gradient: 'linear-gradient(to right, hsl(0 84% 60%), hsl(25 95% 53%))' },
    { name: 'tangerine', gradient: 'linear-gradient(to right, hsl(25 95% 53%), hsl(145 63% 49%))' },
    { name: 'emerald', gradient: 'linear-gradient(to right, hsl(145 63% 49%), hsl(220 89% 60%))' },
    { name: 'sky', gradient: 'linear-gradient(to right, hsl(220 89% 60%), hsl(262 92% 65%))' },
    { name: 'violet', gradient: 'linear-gradient(to right, hsl(262 92% 65%), hsl(329 82% 61%))' },
    { name: 'rose', gradient: 'linear-gradient(to right, hsl(329 82% 61%), hsl(0 84% 60%))' },
];

export default function SettingsPage({ settings, onSettingsChange, user }: SettingsPageProps) {
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [isSubmitting, setSubmitting] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<Settings>(settings);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordSubmitting, setPasswordSubmitting] = useState(false);
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);

  const [isQrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [isQrLoading, setQrLoading] = useState(false);

  const lang = {
    pl: {
      title: "Ustawienia",
      loggedInAs: "Zalogowano jako:",
      description: "Dostosuj wygląd i działanie aplikacji do swoich potrzeb.",
      theme: "Motyw",
      colorTheme: "Kolor motywu",
      language: "Język",
      polish: "Polski",
      english: "English",
      hideLocked: "Ukryj zablokowane",
      hideLockedDesc: "Nie pokazuj list i presetów, do których nie masz dostępu.",
      devMode: "Tryb deweloperski",
      devModeDesc: "Włącza eksperymentalne i niedokończone funkcje.",
      save: "Zapisz",
      saving: "Zapisywanie...",
      saveSuccess: "Ustawienia zapisane!",
      saveError: "Błąd",
      saveErrorDesc: "Nie udało się zapisać ustawień.",
      changePassword: "Zmień hasło",
      currentPassword: "Obecne hasło",
      newPassword: "Nowe hasło",
      passwordChangeSuccess: "Hasło zmienione pomyślnie!",
      passwordChangeError: "Błąd zmiany hasła",
      cancel: "Anuluj",
      loginWithQr: "Zaloguj przez QR",
      qrDialogTitle: "Zaloguj na innym urządzeniu",
      qrDialogDesc: "Zeskanuj ten kod QR za pomocą aparatu na drugim urządzeniu, aby się zalogować. Kod jest ważny przez 60 sekund.",
      qrGenerating: "Generowanie kodu...",
      qrError: "Błąd generowania kodu QR",
    },
    en: {
      title: "Settings",
      loggedInAs: "Logged in as:",
      description: "Customize the look and feel of the application to your needs.",
      theme: "Theme",
      colorTheme: "Color Theme",
      language: "Language",
      polish: "Polski",
      english: "English",
      hideLocked: "Hide locked items",
      hideLockedDesc: "Don't show lists and presets you don't have access to.",
      devMode: "Developer Mode",
      devModeDesc: "Enables experimental and unfinished features.",
      save: "Save",
      saving: "Saving...",
      saveSuccess: "Settings saved!",
      saveError: "Error",
      saveErrorDesc: "Failed to save settings.",
      changePassword: "Change Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      passwordChangeSuccess: "Password changed successfully!",
      passwordChangeError: "Password change error",
      cancel: "Cancel",
      loginWithQr: "Log in with QR",
      qrDialogTitle: "Log in on another device",
      qrDialogDesc: "Scan this QR code with your other device's camera to log in. The code is valid for 60 seconds.",
      qrGenerating: "Generating code...",
      qrError: "Error generating QR code",
    }
  }
  const currentLang = pendingSettings.language === 'en' ? lang.en : lang.pl;


  useEffect(() => {
    setPendingSettings(settings);
    setCurrentPassword('');
    setNewPassword('');
  }, [settings]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    // Apply theme change instantly for better UX
    setTheme(newTheme);
    setPendingSettings({ ...pendingSettings, theme: newTheme });
  };

  const handleSave = async () => {
    setSubmitting(true);
    onSettingsChange(pendingSettings);
    if (user) {
        try {
            await updateUserSettings(user.id, pendingSettings);
            toast({ title: currentLang.saveSuccess });
        } catch (error) {
            toast({ variant: 'destructive', title: currentLang.saveError, description: currentLang.saveErrorDesc });
        }
    }
    setSubmitting(false);
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentPassword || !newPassword) {
      return;
    }
    setPasswordSubmitting(true);
    const result = await changeUserPassword(user.id, currentPassword, newPassword);
    if (result.success) {
      toast({ title: currentLang.passwordChangeSuccess });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordDialogOpen(false);
    } else {
      toast({ variant: 'destructive', title: currentLang.passwordChangeError, description: result.message });
    }
    setPasswordSubmitting(false);
  };

  const handleQrRequest = async () => {
    if (!user) return;
    setQrLoading(true);
    setQrCodeValue(null);
    try {
        const result = await generateTempLoginToken(user.id);
        if (result.success && result.token) {
            const url = `${window.location.origin}/login/${result.token}`;
            setQrCodeValue(url);
        } else {
            toast({ variant: 'destructive', title: currentLang.qrError, description: result.message });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: currentLang.qrError });
    } finally {
        setQrLoading(false);
    }
  };
  
  return (
     <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="text-2xl font-bold">{currentLang.title}</h2>
               {user && (
                <div className="text-sm text-muted-foreground flex items-center gap-2 pt-1">
                    <UserIcon className="h-4 w-4" />
                    <span>{currentLang.loggedInAs} <strong>{user.username}</strong></span>
                </div>
               )}
              <p className="text-muted-foreground pt-2">
                {currentLang.description}
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">{currentLang.theme}</Label>
                <ThemeToggle 
                    onThemeChange={(newTheme) => handleThemeChange(newTheme as any)}
                    currentTheme={pendingSettings.theme} 
                />
              </div>
              <div className="space-y-2">
                <Label>{currentLang.colorTheme}</Label>
                <div className="flex flex-wrap gap-3">
                  {colorThemes.map(ct => (
                    <button
                      key={ct.name}
                      type="button"
                      title={ct.name.charAt(0).toUpperCase() + ct.name.slice(1)}
                      onClick={() => setPendingSettings({...pendingSettings, colorTheme: ct.name})}
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-transform transform hover:scale-110",
                        (pendingSettings.colorTheme || 'default') === ct.name && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      )}
                      style={{ background: ct.gradient }}
                    >
                      {(pendingSettings.colorTheme || 'default') === ct.name && <Check className="h-5 w-5 text-white/80" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="language">{currentLang.language}</Label>
                <Select 
                  value={pendingSettings.language}
                  onValueChange={(lang) => setPendingSettings({...pendingSettings, language: lang as any})}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Wybierz język" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pl">{currentLang.polish}</SelectItem>
                    <SelectItem value="en">{currentLang.english}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="hide-locked" className="flex flex-col gap-1">
                  <span>{currentLang.hideLocked}</span>
                  <span className="text-xs font-normal text-muted-foreground">{currentLang.hideLockedDesc}</span>
                </Label>
                <Switch
                  id="hide-locked"
                  checked={pendingSettings.hideLocked}
                  onCheckedChange={(checked) => setPendingSettings({...pendingSettings, hideLocked: checked})}
                />
              </div>
               {settings.devMode && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="dev-mode" className="flex flex-col gap-1">
                    <span>{currentLang.devMode}</span>
                    <span className="text-xs font-normal text-muted-foreground">{currentLang.devModeDesc}</span>
                  </Label>
                  <Switch
                    id="dev-mode"
                    checked={pendingSettings.devMode}
                    onCheckedChange={(checked) => setPendingSettings({...pendingSettings, devMode: checked})}
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
                {user && (
                <Dialog open={isPasswordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                    <DialogTrigger asChild>
                    <Button variant="outline">
                        <KeyRound className="mr-2 h-4 w-4" />
                        {currentLang.changePassword}
                    </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                    <form onSubmit={handlePasswordChange}>
                        <DialogHeader>
                        <DialogTitle>{currentLang.changePassword}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">{currentLang.currentPassword}</Label>
                            <PasswordInput id="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">{currentLang.newPassword}</Label>
                            <PasswordInput id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required />
                        </div>
                        </div>
                        <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">{currentLang.cancel}</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPasswordSubmitting || !currentPassword || !newPassword}>
                            {isPasswordSubmitting ? currentLang.saving : currentLang.changePassword}
                        </Button>
                        </DialogFooter>
                    </form>
                    </DialogContent>
                </Dialog>
                )}
                 {user && (
                    <Dialog open={isQrDialogOpen} onOpenChange={setQrDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" onClick={handleQrRequest}>
                                <QrCode className="mr-2 h-4 w-4" />
                                {currentLang.loginWithQr}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xs">
                             <DialogHeader>
                                <DialogTitle>{currentLang.qrDialogTitle}</DialogTitle>
                                <DialogDescription>{currentLang.qrDialogDesc}</DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center justify-center p-4 bg-white rounded-lg">
                                {isQrLoading && <Skeleton className="h-56 w-56" />}
                                {!isQrLoading && qrCodeValue && (
                                    <QRCode value={qrCodeValue} size={224} />
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex justify-end pt-4">
                 <Button onClick={handleSave} disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? currentLang.saving : currentLang.save}
                </Button>
            </div>
        </div>
      </div>
  );
}
