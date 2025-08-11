'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
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
import { LogOut, User as UserIcon, Check, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Switch } from './ui/switch';
import type { Settings, User } from '@/lib/types';
import { useTheme } from 'next-themes';
import { useEffect, useState }from 'react';
import { updateUserSettings } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function SettingsDialog({ open, onOpenChange, settings, onSettingsChange, user }: SettingsDialogProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [isSubmitting, setSubmitting] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<Settings>(settings);

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
      hideLocked: "Ukryj zablokowane listy",
      hideLockedDesc: "Nie pokazuj list i presetów, do których nie masz dostępu.",
      logout: "Wyloguj się",
      save: "Zapisz",
      saving: "Zapisywanie...",
      saveSuccess: "Ustawienia zapisane!",
      saveError: "Błąd",
      saveErrorDesc: "Nie udało się zapisać ustawień."
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
      logout: "Log out",
      save: "Save",
      saving: "Saving...",
      saveSuccess: "Settings saved!",
      saveError: "Error",
      saveErrorDesc: "Failed to save settings."
    }
  }
  const currentLang = pendingSettings.language === 'en' ? lang.en : lang.pl;


  useEffect(() => {
    if (open) {
      setPendingSettings(settings);
    }
  }, [open, settings]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    // Apply theme change instantly for better UX
    setTheme(newTheme);
    setPendingSettings({ ...pendingSettings, theme: newTheme });
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('user');
    router.push('/');
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
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{currentLang.title}</DialogTitle>
           {user && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 pt-1">
                <UserIcon className="h-4 w-4" />
                <span>{currentLang.loggedInAs} <strong>{user.username}</strong></span>
            </div>
           )}
          <DialogDescription className="pt-2">
            {currentLang.description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
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
        </div>
          <DialogFooter className="sm:justify-between border-t pt-4">
            {user ? (
                 <Button variant="ghost" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{currentLang.logout}</span>
                </Button>
            ) : <div />}
             <Button onClick={handleSave} disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? currentLang.saving : currentLang.save}
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
